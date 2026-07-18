/**
 * Génère des données de démonstration synthétiques :
 *   1. Un compte client de démo (CIN fictif) — via /api/auth/register
 *   2. Un sinistre synthétique complet (rapport d'analyse) — via /api/claims
 *
 * Usage :  npm run seed:demo        (dev server requis sur http://localhost:3000)
 * Variables : SANAD_URL pour cibler une autre instance.
 */
const base = process.env.SANAD_URL || 'http://localhost:3000';

const DEMO_CLIENT = {
    email: 'demo.client@sanad.tn',
    password: 'DemoClient2026!',
    cin: '99887766',
    dossierId: 'KYC-DEMO-00000001',
    profile: {
        fullNameLatin: 'Ahmed Ben Salah',
        fullNameArabic: 'أحمد بن صالح',
        birthDate: '1990-03-15',
        birthPlace: 'Sfax',
        fatherName: 'Mohamed',
        phone: '+216 20 000 000',
        address: 'Route de Tunis, Sfax',
        expiryDate: '2030-01-01',
    },
};

function syntheticReport() {
    const min = 620, max = 980;
    return {
        constatData: {
            dateAccident: '2026-07-10',
            lieu: 'Avenue Habib Bourguiba, Sfax',
            vehiculeA: {
                vehiculeMarqueType: 'Peugeot 208',
                immatriculation: '220 TUN 4571',
                pointChoc: 'Avant droit',
                degatsApparents: 'Pare-chocs avant enfoncé, phare droit cassé',
            },
            vehiculeB: {
                vehiculeMarqueType: 'Renault Clio',
                immatriculation: '198 TUN 8802',
                pointChoc: 'Arrière gauche',
                degatsApparents: 'Rayures aile arrière',
            },
            circonstances: 'Collision à faible vitesse à une intersection.',
        },
        generatedAt: new Date().toISOString(),
        settlementMin: min,
        settlementMax: max,
        settlementMid: Math.round((min + max) / 2),
        fraudScore: 8,
        riskLevel: 'Faible',
        aiConfidence: 91,
        vehicleA: {
            label: 'A',
            brand: 'Peugeot 208',
            immatriculation: '220 TUN 4571',
            source: 'roboflow',
            result: {
                damageVisible: true,
                detectedDamage: 'Pare-chocs avant, phare droit',
                severity: 'moderee',
                estimatedCostMin: min,
                estimatedCostMax: max,
                confidence: 87,
                explanation: 'Dégâts avant droit cohérents avec la déclaration (donnée synthétique de démonstration).',
            },
        },
        vehicleB: null,
        fraudA: {
            inconsistencyDetected: false,
            confidence: 92,
            explanation: 'Photo cohérente avec le point de choc déclaré (donnée synthétique).',
            observedDamage: 'Pare-chocs avant enfoncé',
        },
        fraudB: null,
        invoiceReference: 750,
        explainability: {
            fraud: [
                { feature: 'Cohérence photo/déclaration', impact: -18, direction: 'down' },
                { feature: 'Historique du client', impact: -6, direction: 'down' },
                { feature: 'Montant vs facture de référence', impact: +4, direction: 'up' },
            ],
            settlement: [
                { feature: 'Sévérité détectée (modérée)', impact: +320, direction: 'up' },
                { feature: 'Gamme du véhicule', impact: +130, direction: 'up' },
                { feature: 'Facture de référence', impact: -50, direction: 'down' },
            ],
        },
    };
}

async function main() {
    // 1) Créer (ou réutiliser) le client de démo
    let cookie;
    let res = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEMO_CLIENT),
    });
    if (res.ok) {
        cookie = res.headers.get('set-cookie');
        console.log('Client de démo créé :', DEMO_CLIENT.email);
    } else if (res.status === 409) {
        res = await fetch(`${base}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: DEMO_CLIENT.email, password: DEMO_CLIENT.password }),
        });
        if (!res.ok) throw new Error(`Login démo impossible: ${res.status} ${await res.text()}`);
        cookie = res.headers.get('set-cookie');
        console.log('Client de démo existant réutilisé :', DEMO_CLIENT.email);
    } else {
        throw new Error(`Register démo impossible: ${res.status} ${await res.text()}`);
    }

    // 2) Créer un sinistre synthétique
    const claimRes = await fetch(`${base}/api/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ report: syntheticReport(), fnolDurationSec: 184 }),
    });
    const data = await claimRes.json();
    if (!claimRes.ok) throw new Error(`Création du sinistre impossible: ${claimRes.status} ${JSON.stringify(data)}`);
    console.log('Sinistre synthétique créé, id =', data.id);
    console.log('\nIdentifiants de démo :');
    console.log('  Client   :', DEMO_CLIENT.email, '/', DEMO_CLIENT.password);
    console.log('  Assureur : voir INSURER_EMAIL / INSURER_PASSWORD dans .env (npm run seed:insurer)');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
