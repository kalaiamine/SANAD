/**
 * Downscales and re-encodes photos before sending them to Groq vision models.
 * Large phone photos can consume thousands of TPM and trigger rate limits.
 */
const MAX_DIM = 1024;
const REENCODE_ABOVE_BYTES = 350_000;
const JPEG_QUALITY = 80;

function normalizeMimeType(mimeType: string): string {
    if (!mimeType || mimeType === 'image/jpg' || mimeType.includes('jfif')) {
        return 'image/jpeg';
    }
    return mimeType;
}

export async function prepareVisionImageDataUrl(buffer: Buffer, mimeType: string): Promise<string> {
    const normalizedMime = normalizeMimeType(mimeType);

    if (buffer.length <= REENCODE_ABOVE_BYTES && normalizedMime === 'image/jpeg') {
        return `data:${normalizedMime};base64,${buffer.toString('base64')}`;
    }

    try {
        const { createCanvas, loadImage } = await import('@napi-rs/canvas');
        const img = await loadImage(buffer);
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const jpeg = canvas.encodeSync('jpeg', JPEG_QUALITY);
        return `data:image/jpeg;base64,${Buffer.from(jpeg).toString('base64')}`;
    } catch {
        return `data:${normalizedMime};base64,${buffer.toString('base64')}`;
    }
}
