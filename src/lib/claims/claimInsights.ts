import { mockClaims } from '@/data/mockClaims';
import type { RiskLevel } from './buildClaimReport';
import { loadLatestClaimReport } from './persistClaimReport';

export type InsightsSource = 'session' | 'dossiers';

export interface LandingInsights {
    settlementMin: number;
    settlementMax: number;
    settlementMid: number;
    settlementLabel: string;
    fraudScore: number;
    riskLevel: RiskLevel;
    aiConfidence: number;
    source: InsightsSource;
    sourceDetail: string;
}

function computeRiskLevel(score: number): RiskLevel {
    if (score >= 60) return 'Élevé';
    if (score >= 30) return 'Modéré';
    return 'Faible';
}

function formatSettlementRange(min: number, max: number): string {
    if (min === max) return `${min.toLocaleString('fr-FR')} TND`;
    return `${min.toLocaleString('fr-FR')} – ${max.toLocaleString('fr-FR')} TND`;
}

/** Aggregates approved/settled claims from the insurer mock dossiers. */
function insightsFromMockClaims(): LandingInsights {
    const eligible = mockClaims.filter((c) => c.status === 'approved' || c.status === 'settled');
    const pool = eligible.length ? eligible : mockClaims;

    const settlementMin = Math.round(pool.reduce((s, c) => s + c.estimatedCostMin, 0) / pool.length);
    const settlementMax = Math.round(pool.reduce((s, c) => s + c.estimatedCostMax, 0) / pool.length);
    const settlementMid = Math.round((settlementMin + settlementMax) / 2);

    const fraudScore = Math.round(
        pool.reduce((s, c) => s + Math.min(100, Math.max(3, c.severityScore * 4)), 0) / pool.length
    );
    const aiConfidence = Math.round(pool.reduce((s, c) => s + c.confidence, 0) / pool.length);

    return {
        settlementMin,
        settlementMax,
        settlementMid,
        settlementLabel: formatSettlementRange(settlementMin, settlementMax),
        fraudScore,
        riskLevel: computeRiskLevel(fraudScore),
        aiConfidence,
        source: 'dossiers',
        sourceDetail: `Moyenne de ${pool.length} dossiers SANAD`,
    };
}

/** Prefer the user's latest constat report; otherwise use project dossier data. */
export function getLandingInsights(): LandingInsights {
    const session = loadLatestClaimReport();
    if (session && session.settlementMid > 0) {
        return {
            settlementMin: session.settlementMin,
            settlementMax: session.settlementMax,
            settlementMid: session.settlementMid,
            settlementLabel: formatSettlementRange(session.settlementMin, session.settlementMax),
            fraudScore: session.fraudScore,
            riskLevel: session.riskLevel,
            aiConfidence: session.aiConfidence,
            source: 'session',
            sourceDetail: `Dernier constat · ${session.generatedAt}`,
        };
    }

    return insightsFromMockClaims();
}

export function riskLevelColor(level: RiskLevel): string {
    if (level === 'Élevé') return 'text-sanad-danger';
    if (level === 'Modéré') return 'text-[#B5850A]';
    return 'text-sanad-success';
}
