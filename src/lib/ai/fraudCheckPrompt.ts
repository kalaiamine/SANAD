// Prompt + types for the anti-fraud cross-check: comparing a photo of a
// vehicle against what was *declared* for that vehicle on the constat
// amiable (point de choc initial / dégâts apparents / circonstances).
// The goal is not to make a legal fraud determination — only to flag
// visible inconsistencies for human review by an adjuster.

export interface FraudCheckResult {
    /** Whether the photo appears inconsistent with the declared damage. */
    inconsistencyDetected: boolean;
    /** 0-100 — how confident the model is in that verdict. */
    confidence: number;
    /** Short French explanation of what was compared and why. */
    explanation: string;
    /** What the model actually sees on the vehicle in the photo. */
    observedDamage: string;
}

export const FRAUD_CHECK_SYSTEM_PROMPT = `Tu es un assistant d'aide à la détection d'anomalies pour une plateforme d'assurance automobile tunisienne (SANAD).

Tu reçois UNE photo censée représenter un véhicule impliqué dans un accident, ainsi que ce que le conducteur a déclaré sur le constat amiable pour ce véhicule.

Ta tâche est double :
1. **Vérification de l'objet** : Assure-toi que la photo représente bien un véhicule (voiture, moto, camion) ou une partie de carrosserie/mécanique d'un véhicule. Si la photo montre autre chose (par exemple, un visage humain, un document, une pièce de maison ou un paysage sans véhicule), tu dois ABSOLUMENT considérer cela comme une incohérence majeure.
2. **Cohérence des dommages** : Si c'est bien un véhicule, vérifie si les dommages visibles sur la photo sont raisonnablement cohérents avec la déclaration.

Signale une incohérence (inconsistencyDetected: true) avec une confiance de 100% si :
- La photo ne représente pas un véhicule ou une pièce de véhicule (ex: c'est un visage humain, un selfie, un paysage, un texte).
- Le point de choc déclaré (ex: "avant droit") ne correspond à aucun dommage visible à cet endroit sur la photo.
- Les dégâts visibles sont beaucoup plus étendus, anciens (rouille, poussière sur les bords de la casse), ou d'un type différent (ex: rayures superficielles vs. déclaration de "choc violent") que ce qui est décrit.
- La photo ne montre pas de dommage du tout alors qu'un choc important est déclaré.
- Le véhicule sur la photo semble ne pas correspondre à la description (marque/type/couleur) si celle-ci est fournie.

Réponds en JSON STRICT UNIQUEMENT (pas de markdown), exactement sous cette forme :
{
  "inconsistencyDetected": false,
  "confidence": 85,
  "explanation": "Les dommages visibles à l'avant droit correspondent au point de choc déclaré.",
  "observedDamage": "pare-chocs avant droit enfoncé avec rayures"
}`;

export function buildFraudCheckUserText(params: {
    vehicleLabel: 'A' | 'B';
    pointChocInitial: string;
    degatsApparents: string;
    circonstancesCochees: string[];
    vehiculeMarqueType?: string;
}): string {
    const { vehicleLabel, pointChocInitial, degatsApparents, circonstancesCochees, vehiculeMarqueType } = params;
    return [
        `Véhicule ${vehicleLabel}.`,
        vehiculeMarqueType ? `Marque/type déclaré : ${vehiculeMarqueType}.` : '',
        pointChocInitial ? `Point de choc déclaré : ${pointChocInitial}.` : 'Point de choc : non renseigné.',
        degatsApparents ? `Dégâts déclarés : ${degatsApparents}.` : 'Dégâts : non renseignés.',
        circonstancesCochees.length ? `Circonstances : ${circonstancesCochees.join(', ')}.` : '',
        'Compare la photo jointe à ces déclarations.',
        'Réponds avec ce JSON exact (4 clés, pas d\'autre texte) :',
        '{"inconsistencyDetected":false,"confidence":85,"explanation":"...","observedDamage":"..."}',
    ]
        .filter(Boolean)
        .join(' ');
}

export function normalizeFraudCheckResult(raw: Partial<FraudCheckResult>): FraudCheckResult {
    return {
        inconsistencyDetected: Boolean(raw.inconsistencyDetected),
        confidence: Math.min(100, Math.max(0, Math.round(Number(raw.confidence) || 50))),
        explanation: String(raw.explanation || 'Analyse de cohérence effectuée.'),
        observedDamage: String(raw.observedDamage || 'Non précisé sur la photo.'),
    };
}
