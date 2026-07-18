/**
 * SHAP-style feature attribution for SANAD decision outputs.
 * Uses rule-based contributions aligned with model inputs (vision, OCR, AML factors).
 * Suitable for demo/explicability — full SHAP values computed server-side for AML in Python.
 */

import type { FraudCheckResult } from '@/lib/ai/fraudCheckPrompt';
import type { ConstatData } from '@/lib/constat/types';
import type { VehicleClaimSlice } from '@/lib/claims/buildClaimReport';

export interface ShapContribution {
    feature: string;
    featureAr: string;
    value: string;
    /** Positive = pushes score/cost up, negative = reduces risk/cost */
    contribution: number;
    /** Normalized 0-100 for bar width */
    impact: number;
}

export interface ExplainabilityBundle {
    fraudScore: ShapContribution[];
    settlement: ShapContribution[];
    baseScore: number;
    methodology: string;
}

function normalizeImpacts(items: ShapContribution[]): ShapContribution[] {
    const max = Math.max(...items.map((i) => Math.abs(i.contribution)), 1);
    return items.map((i) => ({ ...i, impact: Math.round((Math.abs(i.contribution) / max) * 100) }));
}

export function buildFraudExplainability(
    fraudA: FraudCheckResult | null,
    fraudB: FraudCheckResult | null,
    constatData: ConstatData
): ShapContribution[] {
    const items: ShapContribution[] = [];
    const base = 8;

    const addVehicle = (label: 'A' | 'B', result: FraudCheckResult | null, vehicle: ConstatData['vehiculeA']) => {
        if (!result) {
            items.push({
                feature: `Véhicule ${label} — photo absente`,
                featureAr: `المركبة ${label} — لا توجد صورة`,
                value: 'Non analysé',
                contribution: 12,
                impact: 0,
            });
            return;
        }
        if (result.inconsistencyDetected) {
            items.push({
                feature: `Véhicule ${label} — incohérence photo/déclaration`,
                featureAr: `المركبة ${label} — تناقض بين الصورة والتصريح`,
                value: result.observedDamage.slice(0, 60),
                contribution: Math.min(45, Math.round(result.confidence * 0.45)),
                impact: 0,
            });
        } else {
            items.push({
                feature: `Véhicule ${label} — cohérence confirmée`,
                featureAr: `المركبة ${label} — اتساق مؤكد`,
                value: `${result.confidence}% confiance`,
                contribution: -Math.round(result.confidence * 0.08),
                impact: 0,
            });
        }
        if (vehicle.pointChocInitial && !result.observedDamage.toLowerCase().includes(vehicle.pointChocInitial.toLowerCase().slice(0, 4))) {
            items.push({
                feature: `Point de choc déclaré (${label})`,
                featureAr: `نقطة الصدمة المصرح بها (${label})`,
                value: vehicle.pointChocInitial,
                contribution: result.inconsistencyDetected ? 8 : 3,
                impact: 0,
            });
        }
    };

    addVehicle('A', fraudA, constatData.vehiculeA);
    addVehicle('B', fraudB, constatData.vehiculeB);

    if (!constatData.lieuPhotoDataUrl) {
        items.push({
            feature: 'Photo de scène manquante',
            featureAr: 'صورة المشهد مفقودة',
            value: 'Constat incomplet',
            contribution: 6,
            impact: 0,
        });
    }

    items.unshift({
        feature: 'Score de base (prior)',
        featureAr: 'النقطة الأساسية',
        value: `${base}/100`,
        contribution: base,
        impact: 0,
    });

    return normalizeImpacts(items);
}

export function buildSettlementExplainability(
    vehicleA: VehicleClaimSlice | null,
    vehicleB: VehicleClaimSlice | null
): ShapContribution[] {
    const items: ShapContribution[] = [];

    const addVehicle = (slice: VehicleClaimSlice | null) => {
        if (!slice) return;
        const mid = Math.round((slice.result.estimatedCostMin + slice.result.estimatedCostMax) / 2);
        items.push({
            feature: `Dommages véhicule ${slice.label}`,
            featureAr: `أضرار المركبة ${slice.label}`,
            value: slice.result.detectedDamage.slice(0, 50),
            contribution: mid,
            impact: 0,
        });
        if (slice.source === 'roboflow') {
            items.push({
                feature: `YOLO Roboflow (${slice.label})`,
                featureAr: `Roboflow YOLO (${slice.label})`,
                value: `${slice.result.confidence}% confiance`,
                contribution: Math.round(mid * 0.15),
                impact: 0,
            });
        }
        if (slice.result.severity === 'severe') {
            items.push({
                feature: `Gravité élevée (${slice.label})`,
                featureAr: `خطورة عالية (${slice.label})`,
                value: 'Structurel / lourd',
                contribution: Math.round(mid * 0.2),
                impact: 0,
            });
        }
    };

    addVehicle(vehicleA);
    addVehicle(vehicleB);

    if (items.length === 0) {
        items.push({
            feature: 'Déclaration textuelle',
            featureAr: 'تصريح نصي',
            value: 'Sans photo analysée',
            contribution: 400,
            impact: 100,
        });
    }

    return normalizeImpacts(items);
}

export function buildExplainabilityBundle(params: {
    fraudA: FraudCheckResult | null;
    fraudB: FraudCheckResult | null;
    constatData: ConstatData;
    vehicleA: VehicleClaimSlice | null;
    vehicleB: VehicleClaimSlice | null;
    fraudScore: number;
}): ExplainabilityBundle {
    return {
        fraudScore: buildFraudExplainability(params.fraudA, params.fraudB, params.constatData),
        settlement: buildSettlementExplainability(params.vehicleA, params.vehicleB),
        baseScore: params.fraudScore,
        methodology:
            'Attribution SHAP-like : chaque facteur montre sa contribution marginale au score de fraude ou au coût estimé (Loi 2015-26, vision IA, YOLO Roboflow).',
    };
}

/** Converts AML Python factors to SHAP-style rows for eKYC dashboard. */
export function amlFactorsToShap(
    factors: Array<{ factor: string; description: string; weight: number; severity?: string }>
): ShapContribution[] {
    const items = factors.map((f) => ({
        feature: f.factor.replace(/_/g, ' '),
        featureAr: f.factor,
        value: f.description,
        contribution: f.weight,
        impact: 0,
    }));
    return normalizeImpacts(items);
}
