import type { DamageEstimateResult } from '@/lib/ai/damageEstimatePrompt';
import type { ConstatVehicleInfo } from '@/lib/constat/types';

export type EstimateSource = 'roboflow' | 'vision' | 'declaration';

export interface VehicleEstimateResult {
    result: DamageEstimateResult;
    source: EstimateSource;
}

function estimateFromDeclaration(vehicleInfo: ConstatVehicleInfo): VehicleEstimateResult {
    const description = `${vehicleInfo.vehiculeMarqueType || 'Véhicule'} - Choc: ${vehicleInfo.pointChocInitial || 'Non spécifié'} - Dégâts: ${vehicleInfo.degatsApparents || 'Non spécifiés'}. Observations: ${vehicleInfo.observations || ''}`;
    const lowerDesc = description.toLowerCase();

    let estimatedCostMin = 300;
    let estimatedCostMax = 800;
    let detectedDamage = vehicleInfo.degatsApparents || 'Dégâts carrosserie';
    let severity: DamageEstimateResult['severity'] = 'legere';
    let explanation = "Estimation basée sur la déclaration du constat (pièces + main d'œuvre, marché tunisien).";

    if (
        lowerDesc.includes('châssis') ||
        lowerDesc.includes('moteur') ||
        lowerDesc.includes('structurel') ||
        lowerDesc.includes('grave') ||
        lowerDesc.includes('train') ||
        lowerDesc.includes('airbag')
    ) {
        estimatedCostMin = 2000;
        estimatedCostMax = 6500;
        severity = 'severe';
        explanation = 'Dommages structurels déclarés — pièces spécialisées et main d\'œuvre lourde.';
    } else if (lowerDesc.includes('pare-choc') || lowerDesc.includes('parechoc') || lowerDesc.includes('bouclier')) {
        estimatedCostMin = 350;
        estimatedCostMax = 1200;
        severity = 'moderee';
        explanation = 'Remplacement ou réparation de pare-chocs avec peinture.';
    } else if (lowerDesc.includes('portière') || lowerDesc.includes('portiere') || lowerDesc.includes('porte') || lowerDesc.includes('capot')) {
        estimatedCostMin = 500;
        estimatedCostMax = 1800;
        severity = 'moderee';
        explanation = 'Tôlerie de panneau avec mise en peinture.';
    } else if (lowerDesc.includes('phare') || lowerDesc.includes('rétro') || lowerDesc.includes('retro') || lowerDesc.includes('optique') || lowerDesc.includes('vitre')) {
        estimatedCostMin = 250;
        estimatedCostMax = 900;
        severity = 'legere';
        explanation = 'Remplacement optique ou vitrage et pose.';
    } else if (lowerDesc.includes('rayure') || lowerDesc.includes('peinture') || lowerDesc.includes('léger') || lowerDesc.includes('leger')) {
        estimatedCostMin = 100;
        estimatedCostMax = 400;
        severity = 'legere';
        explanation = 'Retouches de peinture superficielles.';
    }

    const brand = (vehicleInfo.vehiculeMarqueType || '').toLowerCase();
    let brandMultiplier = 1.0;

    if (
        brand.includes('mercedes') ||
        brand.includes('bmw') ||
        brand.includes('audi') ||
        brand.includes('porsche') ||
        brand.includes('range') ||
        brand.includes('land rover') ||
        brand.includes('jaguar') ||
        brand.includes('lexus') ||
        brand.includes('volvo') ||
        brand.includes('jeep') ||
        brand.includes('alfa')
    ) {
        brandMultiplier = 2.4;
        explanation += ' Tarif premium pour cette marque.';
    } else if (
        brand.includes('volkswagen') ||
        brand.includes('vw') ||
        brand.includes('ford') ||
        brand.includes('honda') ||
        brand.includes('toyota') ||
        brand.includes('nissan') ||
        brand.includes('mazda')
    ) {
        brandMultiplier = 1.3;
        explanation += ' Tarif standard+ pour cette marque.';
    }

    estimatedCostMin = Math.round(estimatedCostMin * brandMultiplier);
    estimatedCostMax = Math.round(estimatedCostMax * brandMultiplier);

    return {
        source: 'declaration',
        result: {
            damageVisible: true,
            detectedDamage,
            severity,
            estimatedCostMin,
            estimatedCostMax,
            confidence: 65,
            explanation,
        },
    };
}

async function fetchVisionEstimate(photoFile: File, brand: string): Promise<VehicleEstimateResult | null> {
    const buildFormData = () => {
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('brand', brand);
        return formData;
    };

    const parseResponse = (json: { result?: DamageEstimateResult; method?: string }): VehicleEstimateResult | null => {
        if (!json?.result) return null;
        const source: EstimateSource = json.method === 'roboflow' ? 'roboflow' : 'vision';
        return { result: json.result, source };
    };

    const res = await fetch('/api/estimate-damage', { method: 'POST', body: buildFormData() });
    if (res.status === 429) {
        const json = await res.json().catch(() => ({}));
        const retryMs = typeof json.retryAfterMs === 'number' ? json.retryAfterMs : 5000;
        await new Promise((resolve) => setTimeout(resolve, retryMs));
        const retry = await fetch('/api/estimate-damage', { method: 'POST', body: buildFormData() });
        if (!retry.ok) return null;
        return parseResponse(await retry.json());
    }

    if (!res.ok) return null;
    return parseResponse(await res.json());
}

/** Vision API first, then declaration-based fallback. */
export async function estimateVehicleDamage(
    vehicleInfo: ConstatVehicleInfo,
    photoFile: File | null
): Promise<VehicleEstimateResult> {
    if (photoFile) {
        try {
            const vision = await fetchVisionEstimate(photoFile, vehicleInfo.vehiculeMarqueType || '');
            if (vision?.result.damageVisible) {
                return vision;
            }
        } catch (e) {
            console.error('Vision estimate failed, using declaration fallback', e);
        }
    }

    return estimateFromDeclaration(vehicleInfo);
}
