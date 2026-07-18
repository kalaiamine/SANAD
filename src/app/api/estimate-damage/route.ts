import { NextRequest, NextResponse } from 'next/server';
import { groqVisionChatJSON, GroqConfigError, GroqRateLimitError } from '@/lib/ai/groqClient';
import { prepareVisionImageDataUrl } from '@/lib/ai/prepareVisionImage';
import { DAMAGE_ESTIMATE_SYSTEM_PROMPT, buildDamageEstimateUserText, type DamageEstimateResult } from '@/lib/ai/damageEstimatePrompt';
import { estimateDamageWithRoboflow } from '@/lib/claims/roboflowEstimate';

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
    const brand = String(formData.get('brand') || '');

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

        // 1) Roboflow YOLO (your trained dataset) + Tunisian cost grid
        try {
            const roboflow = await estimateDamageWithRoboflow(buffer, file.type, brand);
            if (roboflow?.result.damageVisible) {
                return NextResponse.json({
                    fileName: file.name,
                    method: 'roboflow',
                    result: roboflow.result,
                    roboflowDetails: roboflow.assessment,
                });
            }
        } catch (roboflowErr) {
            console.warn('Roboflow estimate skipped, falling back to Groq:', roboflowErr);
        }

        // 2) Groq vision fallback
        const imageDataUrl = await prepareVisionImageDataUrl(buffer, file.type);
        const userPromptText = `${buildDamageEstimateUserText()}\n\nNote: Le véhicule est de marque/modèle: "${brand}". Prends impérativement en compte cette marque dans l'évaluation du coût des pièces de rechange et de la peinture sur le marché tunisien (les marques premium comme Mercedes, BMW, Audi, Porsche ont des tarifs de pièces nettement plus élevés).`;
        const result = await groqVisionChatJSON<DamageEstimateResult>(
            DAMAGE_ESTIMATE_SYSTEM_PROMPT,
            { text: userPromptText, imageDataUrl },
            { temperature: 0.2 }
        );

        return NextResponse.json({ fileName: file.name, method: 'groq', result });
    } catch (err: unknown) {
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
        const message = err instanceof Error ? err.message : String(err);
        console.error('Damage estimate error:', err);
        return NextResponse.json({ error: `L'estimation a échoué: ${message}` }, { status: 502 });
    }
}
