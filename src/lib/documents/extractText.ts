import path from 'node:path';
import { existsSync } from 'node:fs';
import { getData } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';
import { createWorker, OEM } from 'tesseract.js';

export interface RawExtractionResult {
    text: string;
    method: 'ocr' | 'pdf-text';
    warning?: string;
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

// Inline worker avoids broken pdf.worker.mjs paths after Next.js bundling.
PDFParse.setWorker(getData());

function getTesseractWorkerPath(): string {
    // require.resolve() gets rewritten by the bundler into a fake [externals] path.
    // Worker threads need a real filesystem path at runtime.
    const workerPath = path.resolve(
        process.cwd(),
        'node_modules/tesseract.js/src/worker-script/node/index.js'
    );
    if (!existsSync(workerPath)) {
        throw new Error(`Tesseract worker script not found at ${workerPath}`);
    }
    return workerPath;
}

/**
 * Extracts raw text from an uploaded document, using only free/local tools:
 * - Images (photos of police reports, invoices, medical notes) -> Tesseract.js OCR,
 *   loaded with French + Arabic + English language packs (covers Tunisian docs
 *   which mix French and Arabic).
 * - PDFs -> pdf-parse, which reads embedded text directly (works for
 *   digitally-generated invoices/reports). Scanned/image-only PDFs will
 *   return little/no text; the caller surfaces a warning in that case so a
 *   future version can rasterize pages and OCR them.
 */
export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<RawExtractionResult> {
    if (IMAGE_TYPES.has(mimeType)) {
        return extractTextFromImage(buffer);
    }

    if (mimeType === 'application/pdf') {
        return extractTextFromPdf(buffer);
    }

    throw new Error(`Unsupported file type for extraction: ${mimeType}`);
}

async function extractTextFromImage(buffer: Buffer): Promise<RawExtractionResult> {
    // 'fra+ara+eng' covers French, Arabic (incl. Tunisian docs written in Arabic),
    // and English/numerals commonly present on invoices and stamps.
    const worker = await createWorker(['fra', 'ara', 'eng'], OEM.LSTM_ONLY, {
        workerPath: getTesseractWorkerPath(),
    });
    try {
        const {
            data: { text },
        } = await worker.recognize(buffer);
        return { text: text.trim(), method: 'ocr' };
    } finally {
        await worker.terminate();
    }
}

async function extractTextFromPdf(buffer: Buffer): Promise<RawExtractionResult> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
        const result = await parser.getText();
        const text = (result.text || '').trim();

        if (text.length < 20) {
            return {
                text,
                method: 'pdf-text',
                warning:
                    'Ce PDF semble être un document scanné (image) sans texte intégré. ' +
                    "L'extraction automatique est limitée pour l'instant — un traitement OCR des pages PDF sera ajouté dans une prochaine étape.",
            };
        }

        return { text, method: 'pdf-text' };
    } finally {
        await parser.destroy();
    }
}
