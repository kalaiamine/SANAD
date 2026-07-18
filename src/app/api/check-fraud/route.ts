import { NextRequest, NextResponse } from 'next/server';
import { groqVisionChatJSON, GroqConfigError, GroqRateLimitError } from '@/lib/ai/groqClient';
import { prepareVisionImageDataUrl } from '@/lib/ai/prepareVisionImage';
import { FRAUD_CHECK_SYSTEM_PROMPT, buildFraudCheckUserText, normalizeFraudCheckResult, type FraudCheckResult } from '@/lib/ai/fraudCheckPrompt';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: 'Requête invalide (multipart/form-data attendu).' }, { status: 400 });
    }

    const file = formData.get('photo');
    const vehicleLabel = (formData.get('vehicleLabel') as 'A' | 'B' | null) || 'A';
    const pointChocInitial = (formData.get('pointChocInitial') as string | null) || '';
    const degatsApparents = (formData.get('degatsApparents') as string | null) || '';
    const vehiculeMarqueType = (formData.get('vehiculeMarqueType') as string | null) || '';
    let circonstancesCochees: string[] = [];
    try {
        circonstancesCochees = JSON.parse((formData.get('circonstancesCochees') as string | null) || '[]');
    } catch {
        circonstancesCochees = [];
    }

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Aucune photo reçue.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Photo trop volumineuse (10MB max).' }, { status: 413 });
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Type de fichier non supporté: ${file.type}. Utilisez JPG, PNG ou WEBP.` }, { status: 415 });
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const imageDataUrl = await prepareVisionImageDataUrl(buffer, file.type);

        const raw = await groqVisionChatJSON<Partial<FraudCheckResult>>(
            FRAUD_CHECK_SYSTEM_PROMPT,
            {
                text: buildFraudCheckUserText({
                    vehicleLabel,
                    pointChocInitial,
                    degatsApparents,
                    circonstancesCochees,
                    vehiculeMarqueType,
                }),
                imageDataUrl,
            },
            { temperature: 0.15 }
        );

        const result = normalizeFraudCheckResult(raw);

        return NextResponse.json({ fileName: file.name, vehicleLabel, result });
    } catch (err) {
        if (err instanceof GroqConfigError) {
            return NextResponse.json({ error: err.message, code: 'MISSING_API_KEY' }, { status: 500 });
        }
        if (err instanceof GroqRateLimitError) {
            return NextResponse.json(
                {
                    error: 'Limite de requêtes API atteinte. Réessayez dans quelques secondes.',
                    code: 'RATE_LIMIT',
                    retryAfterMs: err.retryAfterMs,
                },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(err.retryAfterMs / 1000)) } }
            );
        }
        console.error('Fraud check error:', err);
        return NextResponse.json({ error: "La vérification anti-fraude a échoué. Réessayez." }, { status: 502 });
    }
}
