import { SeverityLevel } from '@/components/ui/SeverityBadge';
import { ClaimStatus } from '@/components/ui/StatusBadge';

export interface ExtractedField {
    id: string;
    label: string;
    value: string;
    confidence: number;
    source: 'photo' | 'document' | 'chat';
}

export interface ClaimDocument {
    id: string;
    name: string;
    type: 'photo' | 'pdf' | 'constat' | 'document';
    url: string;
    alt: string;
    uploadedAt: string;
}

export interface ClaimEvent {
    id: string;
    timestamp: string;
    event: string;
    actor: 'policyholder' | 'ai' | 'adjuster';
    detail?: string;
}

export interface Claim {
    id: string;
    policyNumber: string;
    policyholder: string;
    phone: string;
    email: string;
    vehicle: string;
    licensePlate: string;
    incidentDate: string;
    incidentLocation: string;
    reportedAt: string;
    severity: SeverityLevel;
    severityScore: number;
    confidence: number;
    status: ClaimStatus;
    estimatedCostMin: number;
    estimatedCostMax: number;
    aiSummary: string;
    aiSummaryAr: string;
    recommendedAction: string;
    extractedFields: ExtractedField[];
    documents: ClaimDocument[];
    timeline: ClaimEvent[];
    adjuster?: string;
}

export const mockClaims: Claim[] = [
    {
        id: 'CLM-2026-0847',
        policyNumber: 'POL-MA-88421',
        policyholder: 'Mohamed Benali',
        phone: '+212 6 61 23 45 67',
        email: 'm.benali@gmail.com',
        vehicle: 'Dacia Logan 2021',
        licensePlate: '12345-A-7',
        incidentDate: '17/07/2026',
        incidentLocation: 'Boulevard Mohammed V, Casablanca',
        reportedAt: '2026-07-17T09:14:00Z',
        severity: 'critical',
        severityScore: 9,
        confidence: 87,
        status: 'under_review',
        estimatedCostMin: 45000,
        estimatedCostMax: 78000,
        aiSummary:
            'Collision frontale à haute vitesse avec un véhicule utilitaire sur le Boulevard Mohammed V. Dommages structurels importants sur l\'avant du véhicule, airbags déployés. Passager signale des douleurs cervicales. Tiers identifié, constat amiable non signé.',
        aiSummaryAr:
            'تصادم أمامي بسرعة عالية مع مركبة تجارية على شارع محمد الخامس. أضرار هيكلية كبيرة في مقدمة السيارة، تم نشر الوسائد الهوائية. يشكو الراكب من آلام في الرقبة. تم التعرف على الطرف الثالث، لم يُوقَّع على تقرير الحادث.',
        recommendedAction:
            'Envoyer un expert dans les 24h. Vérifier les blessures corporelles. Contacter le tiers pour co-signature du constat.',
        extractedFields: [
            { id: 'ef-001', label: 'Vitesse estimée', value: '> 80 km/h', confidence: 72, source: 'photo' },
            { id: 'ef-002', label: 'Airbags déployés', value: 'Oui (frontal + latéral)', confidence: 95, source: 'photo' },
            { id: 'ef-003', label: 'Plaque tiers', value: '67890-B-2', confidence: 88, source: 'photo' },
            { id: 'ef-004', label: 'Blessures signalées', value: 'Douleurs cervicales', confidence: 90, source: 'chat' },
            { id: 'ef-005', label: 'Constat amiable', value: 'Non signé', confidence: 85, source: 'document' },
            { id: 'ef-006', label: 'Zone d\'impact', value: 'Avant gauche — structurel', confidence: 93, source: 'photo' }],

        documents: [
            { id: 'doc-001', name: 'Photo avant gauche', type: 'photo', url: "https://img.rocket.new/generatedImages/rocket_gen_img_14e9ace7a-1767850215384.png", alt: 'Vue avant gauche du véhicule accidenté montrant des dommages structurels importants', uploadedAt: '09:15' },
            { id: 'doc-002', name: 'Photo tableau de bord', type: 'photo', url: "https://img.rocket.new/generatedImages/rocket_gen_img_1bcdb467e-1770061237355.png", alt: 'Tableau de bord du véhicule avec airbag déployé', uploadedAt: '09:16' },
            { id: 'doc-003', name: 'Constat amiable', type: 'constat', url: "https://img.rocket.new/generatedImages/rocket_gen_img_1e6a6c261-1764677438459.png", alt: 'Document constat amiable partiel', uploadedAt: '09:18' }],

        timeline: [
            { id: 'ev-001', timestamp: '09:14', event: 'Déclaration initiée via chat', actor: 'policyholder' },
            { id: 'ev-002', timestamp: '09:15', event: '3 documents téléchargés', actor: 'policyholder' },
            { id: 'ev-003', timestamp: '09:16', event: 'Analyse IA terminée — Sévérité Critique détectée', actor: 'ai', detail: 'Confiance: 87%' },
            { id: 'ev-004', timestamp: '09:22', event: 'Dossier assigné à Karim Tazi', actor: 'adjuster' },
            { id: 'ev-005', timestamp: '10:05', event: 'En attente de co-signature constat', actor: 'adjuster' }],

        adjuster: 'Karim Tazi'
    },
    {
        id: 'CLM-2026-0846',
        policyNumber: 'POL-MA-77312',
        policyholder: 'Fatima Ezzahra Mansouri',
        phone: '+212 6 72 34 56 78',
        email: 'f.mansouri@outlook.com',
        vehicle: 'Hyundai Tucson 2023',
        licensePlate: '54321-C-5',
        incidentDate: '17/07/2026',
        incidentLocation: 'Route de Médiouna, Casablanca',
        reportedAt: '2026-07-17T08:45:00Z',
        severity: 'high',
        severityScore: 7,
        confidence: 91,
        status: 'under_review',
        estimatedCostMin: 18000,
        estimatedCostMax: 32000,
        aiSummary:
            'Accrochage latéral sur voie rapide avec sortie de route partielle. Dommages importants sur la portière et le passage de roue droits. Aucune blessure corporelle signalée. Tiers en fuite — plaque partiellement capturée.',
        aiSummaryAr:
            'اصطدام جانبي على الطريق السريع مع خروج جزئي عن المسار. أضرار كبيرة في الباب والقوس الأيمن. لم تُبلَّغ عن إصابات جسدية. الطرف الثالث فرّ — اللوحة ملتقطة جزئياً.',
        recommendedAction:
            'Rechercher les caméras de surveillance sur la route. Vérifier la plaque partielle. Expertise à planifier sous 48h.',
        extractedFields: [
            { id: 'ef-007', label: 'Plaque tiers (partielle)', value: '2?4??-D-?', confidence: 45, source: 'photo' },
            { id: 'ef-008', label: 'Zone d\'impact', value: 'Portière + passage de roue droits', confidence: 94, source: 'photo' },
            { id: 'ef-009', label: 'Blessures', value: 'Aucune signalée', confidence: 88, source: 'chat' },
            { id: 'ef-010', label: 'Délit de fuite', value: 'Oui', confidence: 96, source: 'chat' }],

        documents: [
            { id: 'doc-004', name: 'Photo côté droit', type: 'photo', url: "https://img.rocket.new/generatedImages/rocket_gen_img_17b1842f7-1773137298636.png", alt: 'Côté droit du véhicule avec dommages sur portière et passage de roue', uploadedAt: '08:47' },
            { id: 'doc-005', name: 'Carte grise', type: 'document', url: "https://img.rocket.new/generatedImages/rocket_gen_img_128cb2ac5-1772082722882.png", alt: 'Carte grise du véhicule', uploadedAt: '08:49' }],

        timeline: [
            { id: 'ev-006', timestamp: '08:45', event: 'Déclaration initiée via chat', actor: 'policyholder' },
            { id: 'ev-007', timestamp: '08:47', event: '2 documents téléchargés', actor: 'policyholder' },
            { id: 'ev-008', timestamp: '08:48', event: 'Analyse IA terminée — Sévérité Élevée', actor: 'ai', detail: 'Confiance: 91%' },
            { id: 'ev-009', timestamp: '09:10', event: 'Dossier en file d\'attente', actor: 'adjuster' }],

        adjuster: undefined
    },
    {
        id: 'CLM-2026-0845',
        policyNumber: 'POL-MA-65501',
        policyholder: 'Youssef Chraibi',
        phone: '+212 6 53 45 67 89',
        email: 'y.chraibi@gmail.com',
        vehicle: 'Renault Clio 2019',
        licensePlate: '98765-F-2',
        incidentDate: '17/07/2026',
        incidentLocation: 'Parking Centre Anfa, Casablanca',
        reportedAt: '2026-07-17T08:02:00Z',
        severity: 'medium',
        severityScore: 5,
        confidence: 94,
        status: 'info_requested',
        estimatedCostMin: 4500,
        estimatedCostMax: 9000,
        aiSummary:
            'Accrochage en stationnement — dommages sur le pare-chocs arrière et le feu gauche. Tiers non identifié, note laissée sur le pare-brise. Aucun constat.',
        aiSummaryAr:
            'اصطدام في موقف السيارات — أضرار في المصد الخلفي والضوء الأيسر. الطرف الثالث غير محدد، تُرك ملاحظة على الزجاج الأمامي. لا يوجد تقرير.',
        recommendedAction:
            'Demander les enregistrements vidéo du parking. Vérifier si une note de tiers est disponible.',
        extractedFields: [
            { id: 'ef-011', label: 'Zone d\'impact', value: 'Pare-chocs arrière + feu gauche', confidence: 97, source: 'photo' },
            { id: 'ef-012', label: 'Tiers identifié', value: 'Non — note laissée', confidence: 80, source: 'chat' }],

        documents: [
            { id: 'doc-006', name: 'Photo arrière', type: 'photo', url: "https://images.unsplash.com/photo-1631827343236-cfdedf74a735", alt: 'Vue arrière du véhicule avec dommages sur pare-chocs et feu gauche', uploadedAt: '08:04' }],

        timeline: [
            { id: 'ev-010', timestamp: '08:02', event: 'Déclaration initiée', actor: 'policyholder' },
            { id: 'ev-011', timestamp: '08:04', event: 'Photo téléchargée', actor: 'policyholder' },
            { id: 'ev-012', timestamp: '08:05', event: 'Analyse IA — Sévérité Modérée', actor: 'ai', detail: 'Confiance: 94%' },
            { id: 'ev-013', timestamp: '08:30', event: 'Informations complémentaires demandées', actor: 'adjuster' }],

        adjuster: 'Nadia Berrada'
    },
    {
        id: 'CLM-2026-0844',
        policyNumber: 'POL-MA-44892',
        policyholder: 'Aicha Bensouda',
        phone: '+212 6 64 56 78 90',
        email: 'a.bensouda@yahoo.fr',
        vehicle: 'Toyota Corolla 2020',
        licensePlate: '11223-G-6',
        incidentDate: '16/07/2026',
        incidentLocation: 'Rue Allal Ben Abdellah, Rabat',
        reportedAt: '2026-07-16T17:30:00Z',
        severity: 'low',
        severityScore: 2,
        confidence: 96,
        status: 'approved',
        estimatedCostMin: 1200,
        estimatedCostMax: 2500,
        aiSummary:
            'Rayure profonde sur la portière conducteur lors d\'un stationnement serré. Dommages esthétiques uniquement, aucun impact structurel. Tiers identifié et constat signé.',
        aiSummaryAr:
            'خدش عميق في باب السائق أثناء وقوف ضيق. أضرار جمالية فقط، لا يوجد تأثير هيكلي. تم التعرف على الطرف الثالث وتوقيع التقرير.',
        recommendedAction:
            'Traitement standard. Devis carrosserie à valider. Remboursement après franchise.',
        extractedFields: [
            { id: 'ef-013', label: 'Type de dommage', value: 'Esthétique — rayure', confidence: 99, source: 'photo' },
            { id: 'ef-014', label: 'Constat signé', value: 'Oui — co-signé', confidence: 98, source: 'document' }],

        documents: [
            { id: 'doc-007', name: 'Photo portière', type: 'photo', url: "https://img.rocket.new/generatedImages/rocket_gen_img_1fa1f8ddf-1772163024358.png", alt: 'Portière conducteur avec rayure profonde visible', uploadedAt: '17:32' },
            { id: 'doc-008', name: 'Constat signé', type: 'constat', url: "https://img.rocket.new/generatedImages/rocket_gen_img_109cc064d-1784294288761.png", alt: 'Constat amiable signé par les deux parties', uploadedAt: '17:33' }],

        timeline: [
            { id: 'ev-014', timestamp: '17:30', event: 'Déclaration initiée', actor: 'policyholder' },
            { id: 'ev-015', timestamp: '17:32', event: '2 documents téléchargés', actor: 'policyholder' },
            { id: 'ev-016', timestamp: '17:33', event: 'Analyse IA — Sévérité Faible', actor: 'ai', detail: 'Confiance: 96%' },
            { id: 'ev-017', timestamp: '17:45', event: 'Approuvé par Nadia Berrada', actor: 'adjuster' }],

        adjuster: 'Nadia Berrada'
    },
    {
        id: 'CLM-2026-0843',
        policyNumber: 'POL-MA-32167',
        policyholder: 'Omar Lahlou',
        phone: '+212 6 75 67 89 01',
        email: 'o.lahlou@gmail.com',
        vehicle: 'Peugeot 208 2022',
        licensePlate: '44556-H-3',
        incidentDate: '16/07/2026',
        incidentLocation: 'Autoroute A1, km 42, Settat',
        reportedAt: '2026-07-16T14:22:00Z',
        severity: 'critical',
        severityScore: 10,
        confidence: 79,
        status: 'under_review',
        estimatedCostMin: 65000,
        estimatedCostMax: 120000,
        aiSummary:
            'Carambolage à haute vitesse sur l\'autoroute impliquant 3 véhicules. Véhicule assuré totalement accidenté. Blessés signalés dans les 3 véhicules. Intervention des secours confirmée.',
        aiSummaryAr:
            'تصادم متعدد الأطراف بسرعة عالية على الطريق السريع يشمل 3 مركبات. المركبة المؤمن عليها تالفة كلياً. تم الإبلاغ عن مصابين في المركبات الثلاث. تأكيد تدخل خدمات الطوارئ.',
        recommendedAction:
            'Urgence — expertise immédiate requise. Coordonner avec les services médicaux. Rapport de police obligatoire.',
        extractedFields: [
            { id: 'ef-015', label: 'Véhicules impliqués', value: '3', confidence: 91, source: 'chat' },
            { id: 'ef-016', label: 'Blessés', value: 'Oui — plusieurs', confidence: 83, source: 'chat' },
            { id: 'ef-017', label: 'Rapport de police', value: 'En cours', confidence: 70, source: 'chat' },
            { id: 'ef-018', label: 'État du véhicule', value: 'Épave totale estimée', confidence: 88, source: 'photo' }],

        documents: [
            { id: 'doc-009', name: 'Photo scène accident', type: 'photo', url: "https://img.rocket.new/generatedImages/rocket_gen_img_1a2e7596d-1772206301380.png", alt: 'Scène de carambolage sur autoroute avec plusieurs véhicules endommagés', uploadedAt: '14:25' }],

        timeline: [
            { id: 'ev-018', timestamp: '14:22', event: 'Déclaration d\'urgence initiée', actor: 'policyholder' },
            { id: 'ev-019', timestamp: '14:25', event: 'Photo téléchargée', actor: 'policyholder' },
            { id: 'ev-020', timestamp: '14:26', event: 'Analyse IA — CRITIQUE — Alerte déclenchée', actor: 'ai', detail: 'Confiance: 79% — données partielles' },
            { id: 'ev-021', timestamp: '14:28', event: 'Escalade vers superviseur', actor: 'adjuster' }],

        adjuster: 'Superviseur — en attente'
    },
    {
        id: 'CLM-2026-0842',
        policyNumber: 'POL-MA-29054',
        policyholder: 'Nadia Zouiten',
        phone: '+212 6 86 78 90 12',
        email: 'n.zouiten@hotmail.com',
        vehicle: 'Volkswagen Golf 2020',
        licensePlate: '77889-I-1',
        incidentDate: '16/07/2026',
        incidentLocation: 'Avenue Hassan II, Fès',
        reportedAt: '2026-07-16T11:10:00Z',
        severity: 'medium',
        severityScore: 4,
        confidence: 89,
        status: 'settled',
        estimatedCostMin: 6800,
        estimatedCostMax: 11000,
        aiSummary:
            'Collision arrière à faible vitesse en embouteillage. Pare-chocs arrière et hayon endommagés. Tiers identifié, constat signé. Aucune blessure.',
        aiSummaryAr:
            'اصطدام خلفي بسرعة منخفضة في حالة اختناق مروري. تضرر المصد الخلفي والباب الخلفي. تم التعرف على الطرف الثالث وتوقيع التقرير. لا توجد إصابات.',
        recommendedAction: 'Devis validé. Remboursement en cours de traitement.',
        extractedFields: [
            { id: 'ef-019', label: 'Type collision', value: 'Arrière — faible vitesse', confidence: 95, source: 'photo' },
            { id: 'ef-020', label: 'Constat signé', value: 'Oui', confidence: 99, source: 'document' }],

        documents: [
            { id: 'doc-010', name: 'Photo hayon', type: 'photo', url: "https://images.unsplash.com/photo-1581791536754-e08dd723b48f", alt: 'Hayon et pare-chocs arrière endommagés suite à collision', uploadedAt: '11:12' }],

        timeline: [
            { id: 'ev-022', timestamp: '11:10', event: 'Déclaration initiée', actor: 'policyholder' },
            { id: 'ev-023', timestamp: '11:12', event: '1 document téléchargé', actor: 'policyholder' },
            { id: 'ev-024', timestamp: '11:13', event: 'Analyse IA — Sévérité Modérée', actor: 'ai', detail: 'Confiance: 89%' },
            { id: 'ev-025', timestamp: '11:30', event: 'Approuvé et réglé', actor: 'adjuster' }],

        adjuster: 'Karim Tazi'
    },
    {
        id: 'CLM-2026-0841',
        policyNumber: 'POL-MA-18734',
        policyholder: 'Rachid Amrani',
        phone: '+212 6 97 89 01 23',
        email: 'r.amrani@gmail.com',
        vehicle: 'Kia Sportage 2022',
        licensePlate: '33221-J-4',
        incidentDate: '15/07/2026',
        incidentLocation: 'Rond-point Hay Riad, Rabat',
        reportedAt: '2026-07-15T16:45:00Z',
        severity: 'high',
        severityScore: 6,
        confidence: 82,
        status: 'approved',
        estimatedCostMin: 14000,
        estimatedCostMax: 22000,
        aiSummary:
            'Collision latérale au rond-point. Dommages significatifs sur la porte et l\'aile avant gauches. Tiers identifié mais conteste la responsabilité. Constat litigieux.',
        aiSummaryAr:
            'تصادم جانبي في الدوار. أضرار كبيرة في الباب والجناح الأيسر الأمامي. تم التعرف على الطرف الثالث لكنه يعترض على المسؤولية. تقرير متنازع عليه.',
        recommendedAction: 'Expertise contradictoire recommandée. Dossier légal à ouvrir.',
        extractedFields: [
            { id: 'ef-021', label: 'Zone d\'impact', value: 'Porte + aile avant gauches', confidence: 93, source: 'photo' },
            { id: 'ef-022', label: 'Responsabilité', value: 'Contestée', confidence: 75, source: 'chat' }],

        documents: [
            { id: 'doc-011', name: 'Photo côté gauche', type: 'photo', url: "https://img.rocket.new/generatedImages/rocket_gen_img_147e08349-1767118729826.png", alt: 'Côté gauche du véhicule avec porte et aile avant endommagées', uploadedAt: '16:47' }],

        timeline: [
            { id: 'ev-026', timestamp: '16:45', event: 'Déclaration initiée', actor: 'policyholder' },
            { id: 'ev-027', timestamp: '16:47', event: '1 document téléchargé', actor: 'policyholder' },
            { id: 'ev-028', timestamp: '16:48', event: 'Analyse IA — Sévérité Élevée', actor: 'ai', detail: 'Confiance: 82%' },
            { id: 'ev-029', timestamp: '17:00', event: 'Approuvé avec réserves', actor: 'adjuster' }],

        adjuster: 'Nadia Berrada'
    },
    {
        id: 'CLM-2026-0840',
        policyNumber: 'POL-MA-09123',
        policyholder: 'Samira Ouali',
        phone: '+212 6 08 90 12 34',
        email: 's.ouali@gmail.com',
        vehicle: 'Ford Focus 2018',
        licensePlate: '66778-K-8',
        incidentDate: '15/07/2026',
        incidentLocation: 'Parking Marjane, Marrakech',
        reportedAt: '2026-07-15T10:30:00Z',
        severity: 'low',
        severityScore: 1,
        confidence: 98,
        status: 'settled',
        estimatedCostMin: 800,
        estimatedCostMax: 1500,
        aiSummary:
            'Légère rayure sur le capot lors d\'une manœuvre de parking. Dommage minime, esthétique uniquement. Tiers inconnu.',
        aiSummaryAr:
            'خدش طفيف على الغطاء أثناء مناورة الوقوف. ضرر بسيط، جمالي فقط. الطرف الثالث مجهول.',
        recommendedAction: 'Remboursement standard après franchise. Dossier clos.',
        extractedFields: [
            { id: 'ef-023', label: 'Zone d\'impact', value: 'Capot — rayure légère', confidence: 99, source: 'photo' }],

        documents: [
            { id: 'doc-012', name: 'Photo capot', type: 'photo', url: "https://img.rocket.new/generatedImages/rocket_gen_img_17ffe44a8-1773787084095.png", alt: 'Capot du véhicule avec légère rayure', uploadedAt: '10:32' }],

        timeline: [
            { id: 'ev-030', timestamp: '10:30', event: 'Déclaration initiée', actor: 'policyholder' },
            { id: 'ev-031', timestamp: '10:32', event: '1 photo téléchargée', actor: 'policyholder' },
            { id: 'ev-032', timestamp: '10:33', event: 'Analyse IA — Sévérité Faible', actor: 'ai', detail: 'Confiance: 98%' },
            { id: 'ev-033', timestamp: '10:45', event: 'Dossier réglé', actor: 'adjuster' }],

        adjuster: 'Karim Tazi'
    }];


export const getDailyClaimsData = () => [
    { day: '04/07', total: 8, critical: 1, high: 2, medium: 3, low: 2 },
    { day: '05/07', total: 12, critical: 2, high: 3, medium: 4, low: 3 },
    { day: '06/07', total: 6, critical: 0, high: 2, medium: 2, low: 2 },
    { day: '07/07', total: 15, critical: 3, high: 4, medium: 5, low: 3 },
    { day: '08/07', total: 9, critical: 1, high: 3, medium: 3, low: 2 },
    { day: '09/07', total: 11, critical: 2, high: 2, medium: 4, low: 3 },
    { day: '10/07', total: 7, critical: 0, high: 1, medium: 4, low: 2 },
    { day: '11/07', total: 14, critical: 2, high: 5, medium: 4, low: 3 },
    { day: '12/07', total: 10, critical: 1, high: 3, medium: 4, low: 2 },
    { day: '13/07', total: 13, critical: 2, high: 4, medium: 4, low: 3 },
    { day: '14/07', total: 8, critical: 0, high: 2, medium: 4, low: 2 },
    { day: '15/07', total: 16, critical: 3, high: 5, medium: 5, low: 3 },
    { day: '16/07', total: 11, critical: 2, high: 3, medium: 4, low: 2 },
    { day: '17/07', total: 8, critical: 2, high: 2, medium: 2, low: 2 }];


export const getSeverityDistribution = () => [
    { name: 'Critique', value: 18, fill: 'var(--severity-critical)' },
    { name: 'Élevé', value: 31, fill: 'var(--severity-high)' },
    { name: 'Modéré', value: 34, fill: 'var(--severity-medium)' },
    { name: 'Faible', value: 17, fill: 'var(--severity-low)' }];