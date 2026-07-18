import { describe, it, expect } from 'vitest';
import { evaluateClaimDecision } from '../businessRule';

describe('evaluateClaimDecision (routage auto / expert humain)', () => {
    it('approuve automatiquement sous le seuil de 500 TND', () => {
        const d = evaluateClaimDecision(499);
        expect(d.decision).toBe('auto_approve');
        expect(d.threshold).toBe(500);
    });

    it('route vers revue manuelle exactement au seuil (500 TND)', () => {
        expect(evaluateClaimDecision(500).decision).toBe('manual_review');
    });

    it('route vers revue manuelle au-dessus du seuil', () => {
        expect(evaluateClaimDecision(2500).decision).toBe('manual_review');
    });

    it("fournit une explication lisible mentionnant le montant", () => {
        const d = evaluateClaimDecision(750);
        expect(d.explanation).toContain('750');
        expect(d.explanation).toContain('500');
    });
});
