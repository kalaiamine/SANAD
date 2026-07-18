import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/documents/extractText';
import { groqChatJSON, GroqConfigError } from '@/lib/ai/groqClient';
import {
    DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
    buildDocumentExtractionUserTurn,
    type ExtractedDocumentFields,
} from '@/lib/ai/documentExtractionPrompt';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);

export async function POST(req: NextRequest) {
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: 'Requête invalide (multipart/form-data attendu).' }, { status: 400 });
    }

    const file = formData.get('file');
    const docTypeHint = (formData.get('docType') as string | null) || undefined;

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Fichier trop volumineux (15MB max).' }, { status: 413 });
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
        return NextResponse.json(
            { error: `Type de fichier non supporté: ${file.type}. Utilisez JPG, PNG, WEBP ou PDF.` },
            { status: 415 }
        );
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const { text, method, warning } = await extractTextFromFile(buffer, file.type);

        if (!text || text.trim().length < 5) {
            return NextResponse.json({
                fileName: file.name,
                extractionMethod: method,
                rawTextPreview: text,
                warning: warning || "Aucun texte lisible n'a été détecté dans ce document.",
                extracted: null,
            });
        }

        const extracted = await groqChatJSON<ExtractedDocumentFields>(
            [
                { role: 'system', content: DOCUMENT_EXTRACTION_SYSTEM_PROMPT },
                { role: 'user', content: buildDocumentExtractionUserTurn(text, file.name, docTypeHint) },
            ],
            { temperature: 0.1 }
        );

        return NextResponse.json({
            fileName: file.name,
            extractionMethod: method,
            rawTextPreview: text.slice(0, 800),
            warning,
            extracted,
        });
    } catch (err) {
        if (err instanceof GroqConfigError) {
            return NextResponse.json({ error: err.message, code: 'MISSING_API_KEY' }, { status: 500 });
        }
        console.error('Document extraction error:', err);
        return NextResponse.json({ error: "L'analyse du document a échoué. Réessayez." }, { status: 502 });
    }
}
