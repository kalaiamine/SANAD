import type { RoboflowPrediction } from './costEstimator';

const API_TIMEOUT = 12000; // 12 seconds

/**
 * Dispatches a single image buffer to Roboflow YOLO hosted endpoint.
 */
export async function detectVehicleDamage(
    imageBuffer: Buffer,
    mimeType: string
): Promise<RoboflowPrediction[]> {
    const apiKey = process.env.ROBOFLOW_API_KEY;
    const model = process.env.ROBOFLOW_MODEL;

    // Fail-soft fallback for demonstration/development if keys are missing
    if (!apiKey || !model) {
        console.warn('ROBOFLOW_API_KEY or ROBOFLOW_MODEL is missing in environment. Using fallback mock predictions.');
        return getMockPredictions();
    }

    const base64Data = imageBuffer.toString('base64');
    const baseUrl = process.env.ROBOFLOW_API_URL || 'https://serverless.roboflow.com';
    
    // Serverless hosted API doesn't use the "/1" version suffix, while detect.roboflow.com does
    const url = baseUrl.includes('serverless.roboflow.com')
        ? `${baseUrl}/${model}?api_key=${apiKey}`
        : `${baseUrl}/${model}/1?api_key=${apiKey}`;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: base64Data,
            signal: controller.signal,
        });

        clearTimeout(id);

        if (!res.ok) {
            const errorText = await res.text().catch(() => '');
            throw new Error(`Roboflow API returned status ${res.status}: ${errorText || res.statusText}`);
        }

        const data = await res.json();
        
        if (!data || !Array.isArray(data.predictions)) {
            throw new Error('Invalid JSON response format received from Roboflow.');
        }

        return data.predictions.map((p: any) => ({
            class: p.class,
            confidence: p.confidence,
            x: p.x || 0,
            y: p.y || 0,
            width: p.width || 0,
            height: p.height || 0
        }));

    } catch (err: any) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
            throw new Error('La requête vers Roboflow a expiré (Timeout).');
        }
        throw err;
    }
}

/**
 * Generate mock predictions matching the supported classes for test/demo mode.
 */
function getMockPredictions(): RoboflowPrediction[] {
    return [
        { class: 'dent', confidence: 0.94, x: 150, y: 100, width: 80, height: 60 },
        { class: 'scratch', confidence: 0.88, x: 180, y: 120, width: 50, height: 40 },
        { class: 'bumper_damage', confidence: 0.72, x: 300, y: 250, width: 200, height: 90 },
        { class: 'broken_headlight', confidence: 0.95, x: 80, y: 90, width: 40, height: 40 }
    ];
}
