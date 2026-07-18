# SANAD — Description des données

## 1. Sources de données

| Source | Type | Format | Usage |
|---|---|---|---|
| Carte d'identité nationale tunisienne (recto/verso) | Image fournie par l'utilisateur | JPG/PNG/WEBP/PDF/BMP/TIFF, ≤ 10 Mo | OCR eKYC (PaddleOCR arabe) |
| Selfie utilisateur | Image capturée en direct | JPG/PNG | Liveness + face-match vs photo CIN |
| Photos des dégâts véhicule | Image | JPG/PNG/WEBP, ≤ 10 Mo | Détection YOLO Roboflow + vision Groq |
| Factures de réparation, rapports de police, certificats médicaux | Image ou PDF | JPG/PNG/WEBP/PDF, ≤ 15 Mo | Tesseract.js / pdf-parse + extraction LLM |
| Conversation FNOL | Texte libre (FR / AR / derja) | JSON (historique de messages) | Intake structuré du sinistre |
| Listes sanctions & PPE | Jeu de données JSON (démo) | `data/sanctions_pep.json` | Screening AML/CFT (Loi 2015-26) |

## 2. Formats et schémas produits

### Dossier KYC (audit trail, JSON — 1 fichier par dossier)
```json
{
  "dossierId": "KYC-2026-07-18-ef1e1259",
  "createdAt": "…Z", "updatedAt": "…Z",
  "identity": { "fullNameArabic": "…", "fullNameLatin": "…", "cin": "…", "birthDate": "…", "birthPlace": "…", "fatherName": "…" },
  "steps": [ { "step": "OCR_SCAN|LIVENESS_CHECK|FACE_MATCH|AML_SCREENING|INFO_VALIDATION|ACCOUNT_CREATED", "timestamp": "…Z", "status": "SUCCESS|FAILED", "metadata": { } } ],
  "riskAssessment": { "level": "LOW|MEDIUM|HIGH|CRITICAL", "score": 0 },
  "finalStatus": "IN_PROGRESS|APPROVED"
}
```

### Utilisateur (MongoDB `users`)
`email` (unique), `passwordHash` (bcrypt), `cin` (unique, indexé), `dossierId` (lien Pilier 1), `role` (`client|insurer|admin`), `profile` (champs extraits de la CIN), `createdAt`.

### Sinistre (MongoDB `claimreports`)
`userId` (réf. `users`), `cin` (indexé), `dossierId`, `fnolDurationSec`, `report` : constat complet, `settlementMin/Mid/Max` (TND), `fraudScore` (0-100), `riskLevel` (Faible/Modéré/Élevé), `aiConfidence`, tranches par véhicule (source `roboflow|vision|declaration`), résultats anti-fraude A/B, bundle d'explicabilité (attributions par facteur).

### Résultat AML
`risk_level`, `risk_score` (0-100), `sanctions_hits[]`, `pep_hits[]` (similarité %, source, motif), `factors[]` (poids et sévérité par facteur), `screened_at`, `legal_basis` ("Loi n° 2015-26 du 7 août 2015").

## 3. Volumes (démo)

- Jeu sanctions/PPE : fichier JSON de démonstration (entrées synthétiques) — remplaçable par les listes officielles (ONU, listes nationales CTAF) sans changement de code.
- Modèles PaddleOCR arabes : téléchargés automatiquement au premier démarrage (~qq centaines de Mo).
- Packs Tesseract `ara/eng/fra.traineddata` : ~15-30 Mo chacun (racine du repo).
- Dossiers KYC : ~5-15 Ko par dossier JSON.

## 4. Prétraitement

| Étape | Détail |
|---|---|
| **OCR CIN** | Prétraitement OpenCV (redimensionnement, niveaux de gris, débruitage) → PaddleOCR PP-OCRv5 (`lang='ar'`, orientation de ligne activée, unwarping désactivé pour la vitesse CPU) → classification par mots-clés → parsing regex + translittération arabe→latin → normalisation des dates (`YYYY-MM-DD`, mois tunisiens جانفي/فيفري…) |
| **Face-match** | Détection de visage Haar cascade → recadrage → corrélation de templates (NCC) + histogrammes (bascule niveaux de gris si photo CIN N&B) ; liveness par variance Laplacienne (anti-photo-de-photo) |
| **Documents sinistre** | Tesseract.js LSTM `fra+ara+eng` (images) / pdf-parse (PDF texte) → texte tronqué à 6 000 caractères → extraction LLM en JSON strict (température 0,1) |
| **Photos dégâts** | Redimensionnement (`@napi-rs/canvas`) avant envoi vision → détections YOLO dédoublonnées par IoU > 0,45 (meilleure confiance conservée) → sévérité par seuils de confiance (≥0,90 Severe, ≥0,70 Medium) |
| **FNOL** | Fusion incrémentale des champs extraits par le LLM (mode JSON, température 0,3), détection de langue et registre (FR/AR/derja) |

## 5. Génération de données synthétiques

- `npm run seed:insurer` — crée le compte assureur de démonstration.
- `npm run seed:demo` — crée un client fictif (CIN synthétique) et un sinistre complet synthétique (rapport, scores, explicabilité) pour alimenter le dashboard.
- `ai-services/ocr-service/data/sanctions_pep.json` — entrées sanctions/PPE fictives pour démontrer les niveaux MEDIUM/HIGH/CRITICAL sans données réelles.
- Les tests unitaires Python injectent leurs propres jeux de données AML en mémoire (aucune dépendance aux fichiers).

## 6. Protection des données

- Mots de passe : hachage bcrypt (jamais en clair).
- Sessions : JWT signé (`jose`), cookie httpOnly, contrôle de rôle par middleware.
- Secrets : uniquement via `.env` (non versionné) ; `.env.example` fournit le modèle.
- Les images CIN/selfie transitent par le service local (port 8001) et ne sont pas envoyées aux APIs cloud ; seuls le texte OCR des documents sinistre et les photos de dégâts sont transmis à Groq/Roboflow.
