import { describe, it, expect } from 'vitest';
import {
    calculateIoU,
    deduplicatePredictions,
    getSeverity,
    estimateClaims,
    type RoboflowPrediction,
} from '../costEstimator';

const box = (over: Partial<RoboflowPrediction> = {}): RoboflowPrediction => ({
    class: 'dent',
    confidence: 0.8,
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    ...over,
});

describe('getSeverity', () => {
    it('retourne Severe à partir de 0.90 de confiance', () => {
        expect(getSeverity(0.9)).toBe('Severe');
        expect(getSeverity(0.99)).toBe('Severe');
    });

    it('retourne Medium entre 0.70 et 0.90', () => {
        expect(getSeverity(0.7)).toBe('Medium');
        expect(getSeverity(0.89)).toBe('Medium');
    });

    it('retourne Minor en dessous de 0.70', () => {
        expect(getSeverity(0.69)).toBe('Minor');
        expect(getSeverity(0)).toBe('Minor');
    });
});

describe('calculateIoU', () => {
    it('vaut 1 pour deux boîtes identiques', () => {
        expect(calculateIoU(box(), box())).toBeCloseTo(1);
    });

    it('vaut 0 pour deux boîtes disjointes', () => {
        expect(calculateIoU(box(), box({ x: 500, y: 500 }))).toBe(0);
    });

    it('est strictement entre 0 et 1 pour un recouvrement partiel', () => {
        const iou = calculateIoU(box(), box({ x: 120 }));
        expect(iou).toBeGreaterThan(0);
        expect(iou).toBeLessThan(1);
    });
});

describe('deduplicatePredictions', () => {
    it('fusionne les détections identiques en gardant la meilleure confiance', () => {
        const result = deduplicatePredictions([
            box({ confidence: 0.75 }),
            box({ confidence: 0.95 }),
        ]);
        expect(result).toHaveLength(1);
        expect(result[0].confidence).toBe(0.95);
    });

    it('ne fusionne pas des classes différentes même superposées', () => {
        const result = deduplicatePredictions([
            box({ class: 'dent' }),
            box({ class: 'scratch' }),
        ]);
        expect(result).toHaveLength(2);
    });

    it('ne fusionne pas des détections de même classe éloignées', () => {
        const result = deduplicatePredictions([box(), box({ x: 500, y: 500 })]);
        expect(result).toHaveLength(2);
    });
});

describe('estimateClaims (grille de coûts TND)', () => {
    it('applique le tarif de la grille : rayure Medium = 300 TND', () => {
        const res = estimateClaims([box({ class: 'scratch', confidence: 0.8 })]);
        expect(res.damages).toHaveLength(1);
        expect(res.damages[0].severity).toBe('Medium');
        expect(res.damages[0].estimatedCost).toBe(300);
        expect(res.totalEstimatedCost).toBe(300);
    });

    it('additionne les coûts de plusieurs dégâts distincts', () => {
        const res = estimateClaims([
            box({ class: 'scratch', confidence: 0.95 }), // Severe scratch = 600
            box({ class: 'broken_headlight', confidence: 0.5, x: 400, y: 400 }), // Minor = 700
        ]);
        expect(res.totalEstimatedCost).toBe(1300);
    });

    it('utilise un coût de repli pour une classe inconnue', () => {
        const res = estimateClaims([box({ class: 'unknown_damage', confidence: 0.8 })]);
        expect(res.damages[0].estimatedCost).toBe(500); // fallback Medium
    });

    it('retourne un résumé « aucun dommage » sans détection', () => {
        const res = estimateClaims([]);
        expect(res.totalEstimatedCost).toBe(0);
        expect(res.summary).toContain('Aucun dommage');
    });
});
