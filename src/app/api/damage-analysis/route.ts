import { NextRequest, NextResponse } from 'next/server';
import { detectVehicleDamage } from '@/lib/roboflow';
import { estimateClaims, type RoboflowPrediction } from '@/lib/costEstimator';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('images'); // Support uploading multiple files

        if (files.length === 0) {
            return NextResponse.json(
                { error: 'Aucune image fournie. Téléchargez au moins un fichier.' },
                { status: 400 }
            );
        }

        const allPredictions: RoboflowPrediction[] = [];

        // Concurrently run Roboflow analysis on all uploaded files
        const analysisPromises = files.map(async (fileObj, index) => {
            if (!(fileObj instanceof File)) {
                throw new Error(`Le paramètre à l'index ${index} n'est pas un fichier valide.`);
            }

            if (fileObj.size > MAX_FILE_SIZE) {
                throw new Error(`Le fichier "${fileObj.name}" dépasse la limite de taille autorisée de 10 Mo.`);
            }

            if (!ALLOWED_MIME_TYPES.has(fileObj.type)) {
                throw new Error(
                    `Format de fichier non supporté pour "${fileObj.name}". Formats acceptés : JPG, PNG, WEBP.`
                );
            }

            const arrayBuffer = await fileObj.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Perform live detection
            const predictions = await detectVehicleDamage(buffer, fileObj.type);
            allPredictions.push(...predictions);
        });

        // Resolve all requests
        await Promise.all(analysisPromises);

        // Run cost estimator & deduplication logic
        const assessment = estimateClaims(allPredictions);

        return NextResponse.json(assessment);

    } catch (err: any) {
        console.error('Error during damage analysis API execution:', err);
        return NextResponse.json(
            { error: err.message || 'Une erreur est survenue lors de l\'analyse.' },
            { status: 500 }
        );
    }
}
