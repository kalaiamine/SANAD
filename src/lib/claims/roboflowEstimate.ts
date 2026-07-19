import type { DamageEstimateResult, DamageLineItem } from '@/lib/ai/damageEstimatePrompt';
import { estimateClaims, type AssessmentResult } from '@/lib/costEstimator';
import { detectVehicleDamage } from '@/lib/roboflow';

const SEVERITY_MAP: Record<string, DamageLineItem['severity']> = {
    Minor: 'legere',
    Medium: 'moderee',
    Severe: 'severe',
};

function brandMultiplier(brand: string): number {
    const b = brand.toLowerCase();
    if (
        b.includes('mercedes') ||
        b.includes('bmw') ||
        b.includes('audi') ||
        b.includes('porsche') ||
        b.includes('range') ||
        b.includes('land rover') ||
        b.includes('jaguar') ||
        b.includes('lexus') ||
        b.includes('volvo') ||
        b.includes('jeep') ||
        b.includes('alfa')
    ) {
        return 2.4;
    }
    if (
        b.includes('volkswagen') ||
        b.includes('vw') ||
        b.includes('ford') ||
        b.includes('honda') ||
        b.includes('toyota') ||
        b.includes('nissan') ||
        b.includes('mazda')
    ) {
        return 1.3;
    }
    return 1.0;
}

function severityFromTotal(total: number): DamageEstimateResult['severity'] {
    if (total >= 2000) return 'severe';
    if (total >= 800) return 'moderee';
    return 'legere';
}

export function assessmentToDamageEstimate(assessment: AssessmentResult, brand = ''): DamageEstimateResult {
    const mult = brandMultiplier(brand);
    const baseTotal = assessment.totalEstimatedCost;
    const total = Math.round(baseTotal * mult);
    const min = Math.round(total * 0.9);
    const max = Math.round(total * 1.15);

    const detectedDamage =
        assessment.damages.length > 0
            ? assessment.damages.map((d) => `${d.type} — ${d.part}`).join(' · ')
            : 'Aucun dommage détecté automatiquement';

    const confidence =
        assessment.damages.length > 0
            ? Math.round(
                  (assessment.damages.reduce((s, d) => s + d.confidence, 0) / assessment.damages.length) * 100
              )
            : 0;

    let explanation =
        assessment.summary +
        ' Estimation calculée via modèle YOLO entraîné (Roboflow) et grille tarifaire assurance automobile Tunisie.';

    if (mult > 1) {
        explanation += ` Coefficient marque appliqué (×${mult}).`;
    }

    // Per-damage breakdown: each YOLO detection priced individually (brand
    // multiplier applied), so the client sees exactly what drives the total.
    const items: DamageLineItem[] = assessment.damages.map((d) => ({
        part: d.part,
        type: d.type,
        severity: SEVERITY_MAP[d.severity] ?? 'moderee',
        costMin: Math.round(d.estimatedCost * mult * 0.9),
        costMax: Math.round(d.estimatedCost * mult * 1.15),
    }));

    return {
        damageVisible: assessment.damages.length > 0,
        detectedDamage,
        severity: severityFromTotal(total),
        estimatedCostMin: min,
        estimatedCostMax: max,
        confidence,
        explanation,
        items,
    };
}

/** Runs Roboflow detection + local cost grid. Returns null if no damage classes detected. */
export async function estimateDamageWithRoboflow(
    buffer: Buffer,
    mimeType: string,
    brand = ''
): Promise<{ result: DamageEstimateResult; assessment: AssessmentResult } | null> {
    const predictions = await detectVehicleDamage(buffer, mimeType);
    const assessment = estimateClaims(predictions);
    if (assessment.damages.length === 0) {
        return null;
    }
    return {
        assessment,
        result: assessmentToDamageEstimate(assessment, brand),
    };
}
