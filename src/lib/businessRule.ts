export interface BusinessRuleDecision {
    decision: 'auto_approve' | 'manual_review';
    explanation: string;
    threshold: number;
}

export function evaluateClaimDecision(amount: number): BusinessRuleDecision {
    const threshold = 500;
    if (amount < threshold) {
        return {
            decision: 'auto_approve',
            explanation: `Le montant du règlement (${amount} TND) est inférieur au seuil de ${threshold} TND — approuvé automatiquement conformément aux directives de la politique.`,
            threshold,
        };
    }
    return {
        decision: 'manual_review',
        explanation: `Le montant du règlement (${amount} TND) dépasse le seuil de ${threshold} TND — nécessite une révision manuelle par un agent.`,
        threshold,
    };
}
