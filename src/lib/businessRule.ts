export interface BusinessRuleDecision {
    decision: 'auto_approve' | 'manual_review';
    explanation: string;
    threshold: number;
    /** Which gate produced the decision (montant, confiance IA, fraude, ou aucun). */
    gate: 'amount' | 'confidence' | 'fraud' | 'none';
}

/** Seuil d'auto-approbation en TND. */
export const AMOUNT_THRESHOLD_TND = 500;
/** Gate de confiance : en-dessous, l'IA n'a PAS le droit de décider seule. */
export const CONFIDENCE_GATE = 70;
/** Gate anti-fraude : à partir de ce score, revue humaine obligatoire. */
export const FRAUD_GATE = 30;

/**
 * Décision de routage d'un sinistre : auto-approbation ou revue par un expert.
 *
 * L'explicabilité (type SHAP) n'est pas seulement affichée — elle est ACTIVE :
 * une confiance IA sous le seuil ou un score de fraude élevé retire à l'IA le
 * droit de décider, quel que soit le montant. L'automatisation n'est accordée
 * que lorsque les trois gates sont verts.
 */
export function evaluateClaimDecision(
    amount: number,
    aiConfidence?: number,
    fraudScore?: number
): BusinessRuleDecision {
    const threshold = AMOUNT_THRESHOLD_TND;

    if (typeof fraudScore === 'number' && fraudScore >= FRAUD_GATE) {
        return {
            decision: 'manual_review',
            explanation: `Le score de fraude (${fraudScore}/100) atteint le seuil de vigilance (${FRAUD_GATE}) — le dossier est transmis à un expert humain, quel que soit le montant.`,
            threshold,
            gate: 'fraud',
        };
    }

    if (typeof aiConfidence === 'number' && aiConfidence < CONFIDENCE_GATE) {
        return {
            decision: 'manual_review',
            explanation: `La confiance de l'IA (${aiConfidence}%) est inférieure au seuil requis (${CONFIDENCE_GATE}%) — l'IA n'est pas autorisée à décider seule, un expert humain tranche.`,
            threshold,
            gate: 'confidence',
        };
    }

    if (amount < threshold) {
        return {
            decision: 'auto_approve',
            explanation: `Le montant du règlement (${amount} TND) est inférieur au seuil de ${threshold} TND et tous les contrôles de confiance sont au vert — approuvé automatiquement conformément aux directives de la politique.`,
            threshold,
            gate: 'none',
        };
    }

    return {
        decision: 'manual_review',
        explanation: `Le montant du règlement (${amount} TND) dépasse le seuil de ${threshold} TND — nécessite une révision manuelle par un agent.`,
        threshold,
        gate: 'amount',
    };
}
