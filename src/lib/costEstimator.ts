export type DamageType =
    | 'dent'
    | 'scratch'
    | 'crack'
    | 'broken_headlight'
    | 'broken_taillight'
    | 'bumper_damage'
    | 'door_damage'
    | 'hood_damage'
    | 'windshield_crack'
    | 'mirror_damage';

export type SeverityLevel = 'Minor' | 'Medium' | 'Severe';

export interface RoboflowPrediction {
    class: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface EstimatedDamage {
    part: string;
    type: string;
    severity: SeverityLevel;
    confidence: number;
    estimatedCost: number;
}

export interface AssessmentResult {
    damages: EstimatedDamage[];
    totalEstimatedCost: number;
    summary: string;
}

// Cost table in Tunisian Dinar (TND)
const COST_TABLE: Record<DamageType, Record<SeverityLevel, number>> = {
    scratch: { Minor: 150, Medium: 300, Severe: 600 },
    dent: { Minor: 300, Medium: 700, Severe: 1500 },
    crack: { Minor: 400, Medium: 900, Severe: 1700 },
    bumper_damage: { Minor: 450, Medium: 1000, Severe: 1800 },
    door_damage: { Minor: 500, Medium: 1100, Severe: 2000 },
    hood_damage: { Minor: 600, Medium: 1200, Severe: 2200 },
    mirror_damage: { Minor: 250, Medium: 450, Severe: 700 },
    broken_headlight: { Minor: 700, Medium: 1100, Severe: 1700 },
    broken_taillight: { Minor: 500, Medium: 900, Severe: 1500 },
    windshield_crack: { Minor: 900, Medium: 1600, Severe: 2500 }
};

// Map raw class names to readable French descriptions
const TYPE_LABELS: Record<string, string> = {
    dent: 'Enfoncement / Bosse',
    scratch: 'Rayure / Éraflure',
    crack: 'Fissure / Cassure',
    broken_headlight: 'Optique avant brisé',
    broken_taillight: 'Feu arrière brisé',
    bumper_damage: 'Pare-chocs endommagé',
    door_damage: 'Portière enfoncée/rayée',
    hood_damage: 'Capot déformé',
    windshield_crack: 'Fissure pare-brise',
    mirror_damage: 'Rétroviseur cassé'
};

// Map raw class names to vehicle parts
const PART_MAPPING: Record<string, string> = {
    dent: 'Carrosserie',
    scratch: 'Carrosserie',
    crack: 'Carrosserie / Plastique',
    broken_headlight: 'Bloc optique avant',
    broken_taillight: 'Bloc optique arrière',
    bumper_damage: 'Pare-chocs',
    door_damage: 'Portière',
    hood_damage: 'Capot',
    windshield_crack: 'Vitrage / Pare-brise',
    mirror_damage: 'Rétroviseur'
};

/**
 * Calculates the Intersection over Union (IoU) of two bounding boxes.
 * Bounding boxes are defined by center (x, y) and dimensions (width, height).
 */
export function calculateIoU(boxA: RoboflowPrediction, boxB: RoboflowPrediction): number {
    // Convert center-based (x, y, w, h) to corner coordinates (x1, y1, x2, y2)
    const ax1 = boxA.x - boxA.width / 2;
    const ay1 = boxA.y - boxA.height / 2;
    const ax2 = boxA.x + boxA.width / 2;
    const ay2 = boxA.y + boxA.height / 2;

    const bx1 = boxB.x - boxB.width / 2;
    const by1 = boxB.y - boxB.height / 2;
    const bx2 = boxB.x + boxB.width / 2;
    const by2 = boxB.y + boxB.height / 2;

    // Determine the coordinates of the intersection rectangle
    const xLeft = Math.max(ax1, bx1);
    const yTop = Math.max(ay1, by1);
    const xRight = Math.min(ax2, bx2);
    const yBottom = Math.min(ay2, by2);

    if (xRight < xLeft || yBottom < yTop) {
        return 0;
    }

    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
    const areaA = boxA.width * boxA.height;
    const areaB = boxB.width * boxB.height;
    const unionArea = areaA + areaB - intersectionArea;

    return unionArea > 0 ? intersectionArea / unionArea : 0;
}

/**
 * Merges duplicate bounding boxes across one or multiple images.
 * Keeps the detection with the highest confidence when boxes overlap significantly (IoU > 0.45).
 */
export function deduplicatePredictions(predictions: RoboflowPrediction[]): RoboflowPrediction[] {
    const sorted = [...predictions].sort((a, b) => b.confidence - a.confidence);
    const kept: RoboflowPrediction[] = [];

    for (const pred of sorted) {
        let isDuplicate = false;
        for (const existing of kept) {
            // If they are of the same type and overlap heavily, they refer to the same damage
            if (pred.class === existing.class) {
                const iou = calculateIoU(pred, existing);
                if (iou > 0.45) {
                    isDuplicate = true;
                    break;
                }
            }
        }
        if (!isDuplicate) {
            kept.push(pred);
        }
    }

    return kept;
}

/**
 * Maps confidence score to severity level based on user requirements.
 */
export function getSeverity(confidence: number): SeverityLevel {
    if (confidence >= 0.90) return 'Severe';
    if (confidence >= 0.70) return 'Medium';
    return 'Minor';
}

/**
 * Analyzes predictions, applies costs, and generates a structured assessment.
 */
export function estimateClaims(predictions: RoboflowPrediction[]): AssessmentResult {
    const uniquePredictions = deduplicatePredictions(predictions);
    
    const damages: EstimatedDamage[] = uniquePredictions.map((pred) => {
        const typeKey = pred.class as DamageType;
        const severity = getSeverity(pred.confidence);
        
        // Default to a fallback cost if damage type is unrecognized
        const costTable = COST_TABLE[typeKey] || { Minor: 200, Medium: 500, Severe: 1000 };
        const estimatedCost = costTable[severity];

        return {
            part: PART_MAPPING[pred.class] || 'Autre partie',
            type: TYPE_LABELS[pred.class] || pred.class,
            severity,
            confidence: Math.round(pred.confidence * 100) / 100,
            estimatedCost
        };
    });

    const totalEstimatedCost = damages.reduce((sum, item) => sum + item.estimatedCost, 0);

    // Build human-readable summary
    let summary = '';
    if (damages.length === 0) {
        summary = "Aucun dommage apparent n'a été détecté sur le véhicule.";
    } else {
        const damageCounts = damages.reduce((acc, item) => {
            const label = `${item.severity.toLowerCase()} ${item.type.toLowerCase()}`;
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const parts = Object.entries(damageCounts).map(([label, count]) => {
            return `${count} ${label}`;
        });
        
        summary = `Détection effectuée : ${parts.join(', ')} sur le véhicule.`;
    }

    return {
        damages,
        totalEstimatedCost,
        summary
    };
}
