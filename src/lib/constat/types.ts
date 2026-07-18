// Data model for the "Constat Amiable" (bilateral/friendly accident report),
// the standard two-driver accident form used by Tunisian insurers.
// This is a functional/legal form structure (not copyrighted creative text) —
// field labels below are written independently for this app.

export interface ConstatVehicleInfo {
    conducteurNom: string;
    conducteurAdresse: string;
    conducteurTelephone: string;
    permisNumero: string;
    permisDelivreLe: string;
    assureNom: string; // souscripteur du contrat, si différent du conducteur
    vehiculeMarqueType: string;
    immatriculation: string;
    societeAssurance: string;
    numeroContrat: string;
    agence: string;
    attestationValableDu: string;
    attestationValableAu: string;
    pointChocInitial: string;
    degatsApparents: string;
    circonstances: boolean[]; // 17 standard checkboxes, indices 0..16
    observations: string;
}

export interface ConstatData {
    date: string;
    heure: string;
    lieu: string;
    blesses: 'oui' | 'non';
    degatsAutresVehicules: 'oui' | 'non';
    temoins: string;
    vehiculeA: ConstatVehicleInfo;
    vehiculeB: ConstatVehicleInfo;
    observationsGenerales: string;
    /** Photo (data URL) of the accident location/scene, uploaded by the user — shown above the sketch. */
    lieuPhotoDataUrl: string;
    /** PNG data URL of the freehand accident sketch ("croquis de l'accident"). */
    croquisDataUrl: string;
    /** PNG data URL — signature du conducteur véhicule A */
    signatureConducteurA: string;
    /** PNG data URL — signature du conducteur véhicule B */
    signatureConducteurB: string;
}

export const CIRCONSTANCES_LABELS: string[] = [
    "En stationnement / à l'arrêt",
    'Quittait un stationnement',
    'Prenait un stationnement',
    "Sortait d'un parking, d'un lieu privé, d'un chemin de terre",
    "S'engageait dans un parking, un lieu privé, un chemin de terre",
    "S'engageait sur une place à sens giratoire",
    'Circulait sur une place à sens giratoire',
    'Heurtait à l\u2019arrière un véhicule circulant dans le même sens, sur la même file',
    'Circulait dans le même sens, sur une file différente',
    'Changeait de file',
    'Doublait',
    'Virait à droite',
    'Virait à gauche',
    'Reculait',
    'Empiétait sur la partie de chaussée réservée à la circulation en sens inverse',
    'Venait de droite (dans un carrefour)',
    "N'avait pas respecté un signal de priorité ou un feu rouge",
];

function emptyVehicleInfo(): ConstatVehicleInfo {
    return {
        conducteurNom: '',
        conducteurAdresse: '',
        conducteurTelephone: '',
        permisNumero: '',
        permisDelivreLe: '',
        assureNom: '',
        vehiculeMarqueType: '',
        immatriculation: '',
        societeAssurance: '',
        numeroContrat: '',
        agence: '',
        attestationValableDu: '',
        attestationValableAu: '',
        pointChocInitial: '',
        degatsApparents: '',
        circonstances: Array(CIRCONSTANCES_LABELS.length).fill(false),
        observations: '',
    };
}

export function emptyConstatData(): ConstatData {
    return {
        date: '',
        heure: '',
        lieu: '',
        blesses: 'non',
        degatsAutresVehicules: 'non',
        temoins: '',
        vehiculeA: emptyVehicleInfo(),
        vehiculeB: emptyVehicleInfo(),
        observationsGenerales: '',
        lieuPhotoDataUrl: '',
        croquisDataUrl: '',
        signatureConducteurA: '',
        signatureConducteurB: '',
    };
}
