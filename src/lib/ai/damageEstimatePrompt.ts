// Prompt + types for the repair-cost estimate: given a photo of vehicle
// damage uploaded in the chat, ask the vision model for an indicative repair
// cost range (TND, Tunisian market) plus a short breakdown. This is a rough,
// non-binding estimate meant to give the claimant a sense of scale while
// they wait for a human adjuster / garage quote — never a final figure.

/** One damage line item: a single visible damage priced individually. */
export interface DamageLineItem {
    /** Vehicle part, French label, e.g. "Pare-chocs avant". */
    part: string;
    /** Damage type, French label, e.g. "Enfoncement avec peinture cassée". */
    type: string;
    severity: 'legere' | 'moderee' | 'severe';
    /** Low end of the repair cost for THIS damage, in TND. */
    costMin: number;
    /** High end of the repair cost for THIS damage, in TND. */
    costMax: number;
}

export interface DamageEstimateResult {
    /** Whether the photo shows visible vehicle damage at all. */
    damageVisible: boolean;
    /** Short French label, e.g. "Pare-choc avant enfoncé". */
    detectedDamage: string;
    /** 'legere' | 'moderee' | 'severe' — coarse severity bucket. */
    severity: 'legere' | 'moderee' | 'severe';
    /** Low end of the estimated repair cost, in TND. */
    estimatedCostMin: number;
    /** High end of the estimated repair cost, in TND. */
    estimatedCostMax: number;
    /** 0-100 confidence in this estimate. */
    confidence: number;
    /** 1-2 sentence French explanation of what drives the estimate. */
    explanation: string;
    /** Per-damage breakdown — each visible damage priced individually. */
    items?: DamageLineItem[];
}

export const DAMAGE_ESTIMATE_SYSTEM_PROMPT = `Tu es un assistant d'expertise automobile pour une plateforme d'assurance tunisienne (SANAD). Tu reçois UNE photo de dommages sur un véhicule suite à un accident.

Ta tâche:
1. **Vérification de l'objet** : Assure-toi que la photo représente bien un véhicule (voiture, moto, camion) ou une partie de carrosserie/mécanique d'un véhicule. Si la photo montre autre chose (par exemple, un visage humain, un selfie, un document, une pièce de maison ou un paysage sans véhicule), tu dois définir damageVisible=false, une fourchette à 0, et l'expliquer dans le champ explanation.
2. **Estimation des dégâts** : Si c'est bien un véhicule, donne une estimation INDICATIVE et APPROXIMATIVE du coût de réparation en dinars tunisiens (TND), basée uniquement sur ce qui est visible sur la photo. Ce n'est pas un devis final — un garage ou un expert agréé doit toujours confirmer le montant réel. Reste prudent et raisonnable dans tes fourchettes, en te basant sur les prix courants du marché tunisien de la réparation automobile (pièces + main d'oeuvre).

Repères indicatifs de marché tunisien (pièces + main d'oeuvre, à ajuster selon l'étendue réelle des dégâts):
- Rayure / éclat de peinture superficiel: 100–400 TND
- Bosse/enfoncement localisé sans peinture cassée: 200–600 TND
- Pare-choc fissuré/décroché à remplacer ou réparer: 300–1200 TND
- Phare/rétroviseur/aile endommagé: 250–900 TND
- Portière enfoncée ou déformée: 500–1800 TND
- Dommages structurels/multiples panneaux/airbag/déformation du châssis: 2000–8000+ TND

3. **Détail par dégât** : Liste dans "items" CHAQUE dégât visible séparément (pièce touchée, type de dégât, sévérité, fourchette de coût pour CE dégât précis en TND, alignée sur les repères ci-dessus). La fourchette globale (estimatedCostMin/Max) doit être cohérente avec la somme des items. Ne liste que ce qui est réellement visible sur la photo — n'invente jamais un dégât non visible.

Si aucun dommage n'est visible ou si la photo ne représente pas un véhicule, indique damageVisible=false, "detectedDamage": "Non-véhicule ou aucun dégât visible", une fourchette à 0 et "items": [].

Réponds en JSON STRICT UNIQUEMENT (pas de markdown, pas de texte hors JSON), exactement sous cette forme:
{
  "damageVisible": true,
  "detectedDamage": "pare-chocs avant enfoncé avec rayures, phare droit fissuré",
  "severity": "moderee",
  "estimatedCostMin": 650,
  "estimatedCostMax": 1500,
  "confidence": 75,
  "explanation": "Enfoncement localisé du pare-chocs et optique avant fissuré nécessitant réparation, remplacement du phare et retouche peinture.",
  "items": [
    { "part": "Pare-chocs avant", "type": "Enfoncement avec rayures", "severity": "moderee", "costMin": 400, "costMax": 900 },
    { "part": "Phare avant droit", "type": "Fissure de l'optique", "severity": "legere", "costMin": 250, "costMax": 600 }
  ]
}`;

export function buildDamageEstimateUserText(): string {
    return JSON.stringify({
        instruction:
            "Analyse la photo jointe des dommages du véhicule et réponds au format JSON demandé, avec une estimation de coût de réparation en TND pour le marché tunisien.",
    });
}
