import { describe, it, expect } from 'vitest';
import { evaluateClaimDecision, CONFIDENCE_GATE, FRAUD_GATE, AMOUNT_THRESHOLD_TND } from '../businessRule';

describe('evaluateClaimDecision (routage gated : montant + confiance IA + fraude)', () => {
    it('approuve automatiquement sous le seuil quand tous les gates sont verts', () => {
        const d = evaluateClaimDecision(499, 90, 5);
        expect(d.decision).toBe('auto_approve');
        expect(d.gate).toBe('none');
        expect(d.threshold).toBe(AMOUNT_THRESHOLD_TND);
    });

    it('route vers revue manuelle exactement au seuil de montant (500 TND)', () => {
        const d = evaluateClaimDecision(500, 95, 0);
        expect(d.decision).toBe('manual_review');
        expect(d.gate).toBe('amount');
    });

    it('gate de confiance : une confiance IA basse retire la décision à l’IA, même pour un petit montant', () => {
        const d = evaluateClaimDecision(100, CONFIDENCE_GATE - 1, 0);
        expect(d.decision).toBe('manual_review');
        expect(d.gate).toBe('confidence');
    });

    it('gate de confiance : au seuil exact, l’IA garde la main', () => {
        const d = evaluateClaimDecision(100, CONFIDENCE_GATE, 0);
        expect(d.decision).toBe('auto_approve');
    });

    it('gate anti-fraude : un score de fraude élevé force la revue humaine, même à haute confiance', () => {
        const d = evaluateClaimDecision(100, 99, FRAUD_GATE);
        expect(d.decision).toBe('manual_review');
        expect(d.gate).toBe('fraud');
    });

    it('le gate fraude prime sur le gate confiance dans l’explication', () => {
        const d = evaluateClaimDecision(100, 10, 90);
        expect(d.gate).toBe('fraud');
    });

    it('rétro-compatible : sans scores fournis, seule la règle de montant s’applique', () => {
        expect(evaluateClaimDecision(499).decision).toBe('auto_approve');
        expect(evaluateClaimDecision(2500).decision).toBe('manual_review');
    });

    it("fournit une explication lisible mentionnant le montant", () => {
        const d = evaluateClaimDecision(750);
        expect(d.explanation).toContain('750');
        expect(d.explanation).toContain('500');
    });
});
