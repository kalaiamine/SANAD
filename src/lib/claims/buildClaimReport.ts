import type { DamageEstimateResult } from '@/lib/ai/damageEstimatePrompt';
import type { FraudCheckResult } from '@/lib/ai/fraudCheckPrompt';
import type { ConstatFraudResults } from '@/lib/constat/generateConstatPdf';
import type { ConstatData } from '@/lib/constat/types';
import type { EstimateSource, VehicleEstimateResult } from './estimateVehicleDamage';
import { buildExplainabilityBundle, type ExplainabilityBundle } from '@/lib/ai/explainability';

export interface VehicleClaimSlice {
    label: 'A' | 'B';
    brand: string;
    immatriculation: string;
    result: DamageEstimateResult;
    source: EstimateSource;
}

export type RiskLevel = 'Faible' | 'Modéré' | 'Élevé';

export interface ClaimReportData {
    constatData: ConstatData;
    generatedAt: string;
    settlementMin: number;
    settlementMax: number;
    settlementMid: number;
    fraudScore: number;
    riskLevel: RiskLevel;
    aiConfidence: number;
    vehicleA: VehicleClaimSlice | null;
    vehicleB: VehicleClaimSlice | null;
    fraudA: FraudCheckResult | null;
    fraudB: FraudCheckResult | null;
    invoiceReference: number | null;
    explainability: ExplainabilityBundle;
}

function vehicleFraudContribution(result: FraudCheckResult | null | undefined): number {
    if (!result) return 12;
    if (result.inconsistencyDetected) return Math.min(100, Math.round(result.confidence));
    return Math.max(0, Math.round((100 - result.confidence) * 0.12));
}

function computeRiskLevel(score: number): RiskLevel {
    if (score >= 60) return 'Élevé';
    if (score >= 30) return 'Modéré';
    return 'Faible';
}

function sliceFromEstimate(
    label: 'A' | 'B',
    vehicleInfo: ConstatData['vehiculeA'],
    estimate: VehicleEstimateResult | null
): VehicleClaimSlice | null {
    if (!estimate || !estimate.result.damageVisible) return null;
    return {
        label,
        brand: vehicleInfo.vehiculeMarqueType || `Véhicule ${label}`,
        immatriculation: vehicleInfo.immatriculation || '—',
        result: estimate.result,
        source: estimate.source,
    };
}

export function buildClaimReport(params: {
    constatData: ConstatData;
    estimateA: VehicleEstimateResult | null;
    estimateB: VehicleEstimateResult | null;
    fraudResults: ConstatFraudResults;
    invoiceReference?: number | null;
}): ClaimReportData {
    const { constatData, estimateA, estimateB, fraudResults, invoiceReference = null } = params;

    const vehicleA = sliceFromEstimate('A', constatData.vehiculeA, estimateA);
    const vehicleB = sliceFromEstimate('B', constatData.vehiculeB, estimateB);

    const slices = [vehicleA, vehicleB].filter(Boolean) as VehicleClaimSlice[];
    const settlementMin = slices.reduce((sum, s) => sum + s.result.estimatedCostMin, 0);
    const settlementMax = slices.reduce((sum, s) => sum + s.result.estimatedCostMax, 0);
    const settlementMid = slices.length ? Math.round((settlementMin + settlementMax) / 2) : 0;

    const fraudScore = Math.round(
        Math.max(vehicleFraudContribution(fraudResults.A), vehicleFraudContribution(fraudResults.B))
    );

    const confidences = [fraudResults.A?.confidence, fraudResults.B?.confidence].filter(
        (c): c is number => typeof c === 'number'
    );
    const estimateConfidences = slices.map((s) => s.result.confidence);
    const aiConfidence = confidences.length
        ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
        : estimateConfidences.length
          ? Math.round(estimateConfidences.reduce((a, b) => a + b, 0) / estimateConfidences.length)
          : 70;

    const explainability = buildExplainabilityBundle({
        fraudA: fraudResults.A ?? null,
        fraudB: fraudResults.B ?? null,
        constatData,
        vehicleA,
        vehicleB,
        fraudScore,
    });

    return {
        constatData,
        generatedAt: new Date().toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }),
        settlementMin,
        settlementMax,
        settlementMid,
        fraudScore,
        riskLevel: computeRiskLevel(fraudScore),
        aiConfidence,
        vehicleA,
        vehicleB,
        fraudA: fraudResults.A ?? null,
        fraudB: fraudResults.B ?? null,
        invoiceReference,
        explainability,
    };
}
