# SANAD — Plan de test : validation de chaque composant

## 1. Tests unitaires automatisés

### TypeScript — `npm test` (Vitest)
| Fichier | Composant validé | Cas couverts |
|---|---|---|
| `src/lib/__tests__/costEstimator.test.ts` | Grille de coûts TND + dédoublonnage YOLO | Seuils de sévérité (0,70/0,90), IoU (identique/disjoint/partiel), fusion des doublons par classe, tarifs de la grille, coût de repli classe inconnue, résumé sans dégât |
| `src/lib/__tests__/businessRule.test.ts` | Routage auto-approbation / revue manuelle | < 500 TND auto, = 500 manuel, > 500 manuel, explication lisible |

### Python — `python -m unittest discover tests -v` (dans `ai-services/ocr-service`)
| Fichier | Composant validé | Cas couverts |
|---|---|---|
| `tests/test_aml_screening.py` | Moteur AML/CFT (Loi 2015-26) | Identité propre → LOW ; hit sanctions exact → HIGH (poids 50) ; hit PPE → MEDIUM (poids 30) ; cumul sanctions+PPE → CRITICAL ; mineur → facteur UNDERAGE ; région à risque ; base légale ; matching flou (orthographe proche) |
| `tests/test_audit_trail.py` | Piste d'audit KYC | Création de dossier, étapes horodatées, mise à jour du risque via AML, APPROVED via ACCOUNT_CREATED, erreur dossier inconnu, **détection CIN dupliqué (anti-fraude)**, protection traversée de chemin |
| `tests/test_parser.py` | Classification documents + dates | CIN (arabe et latin), facture, inconnu, vide ; formats de dates DD/MM/YYYY, ISO, invalides |

Les tests AML injectent un jeu de données en mémoire et les tests d'audit utilisent un répertoire temporaire : aucun effet de bord sur les données réelles.

## 2. Validation d'intégration (manuelle / scriptée)

Pré-requis : MongoDB démarré, service OCR sur :8001, Next.js sur :3000, `.env` renseigné.

| # | Composant | Procédure | Résultat attendu |
|---|---|---|---|
| I1 | Santé service eKYC | `GET http://localhost:8001/` | `{"service":"SANAD OCR","status":"running"}` |
| I2 | OCR CIN | `POST /ocr` avec une photo de CIN (ou via `/register`) | `documentType: identity_card`, champs extraits, confiance > 60 % |
| I3 | AML screening | `POST /aml-screen` `{full_name, cin}` | JSON avec `risk_level`, `factors`, `legal_basis` Loi 2015-26 |
| I4 | Audit trail | Parcours `/register` complet puis `GET /audit/get/{id}` | Dossier avec étapes OCR_SCAN → … → ACCOUNT_CREATED, statut APPROVED |
| I5 | Anti-doublon CIN | Réinscription avec le même CIN | Blocage « Fraude détectée » |
| I6 | Auth + rôles | Login client puis accès `/dashboard` | Redirection `/chat` (403 pour un client) ; l'assureur accède au dashboard |
| I7 | FNOL FR | `POST /api/chat` « j'ai eu un accident hier à Tunis » | `language: fr`, `collected.location: Tunis`, questions de relance |
| I8 | FNOL derja/AR | Message en arabe/derja | `language: ar`, extraction correcte, réponse dans le même registre |
| I9 | Extraction document | `POST /api/extract-document` avec une facture | `docType: invoice`, montant et lignes extraits |
| I10 | Estimation dégâts | `POST /api/estimate-damage` avec photo de véhicule endommagé | `method: roboflow` (ou `groq`), fourchette TND, sévérité |
| I11 | Garde-fou vision | Même endpoint avec une image non-véhicule | `damageVisible: false`, explication du refus |
| I12 | Anti-fraude photo | `POST /api/check-fraud` photo incohérente avec le constat | `inconsistencyDetected: true` + explication |
| I13 | Persistance sinistre | Fin de parcours `/chat` puis `GET /api/claims` (assureur) | Rapport présent avec `cin` et `dossierId` du client |
| I14 | Pont Pilier 1→2 | Comparer `dossierId` du claim et du dossier d'audit | Identiques : sinistre traçable jusqu'au KYC |
| I15 | Dashboard KYC temps réel | `GET /api/dossiers` connecté assureur | Liste des dossiers issus de l'audit Python |
| I16 | Email KYC | Fin d'inscription avec SMTP configuré | Reçu KYC dans la boîte mail (sinon simulation loggée) |

## 3. Résultats de la dernière campagne (2026-07-18)

- ✅ Unitaires : **17/17 Vitest**, **25/25 unittest** — tous verts.
- ✅ I1, I3 (LOW + base légale), I4 (dossier réel APPROVED avec OCR 82,6 % de confiance), I6 (login assureur + 401/403 corrects), I7 (FR, extraction lieu/date), I8 (AR, lieu صفاقس extrait), I11 (CIN reconnue comme non-véhicule, méthode `groq` après tentative Roboflow), I15 (dossiers réels affichés).
- ⚠️ I2 en direct : l'endpoint `/ocr` a dépassé 5 min sur la machine de test **pendant que les deux serveurs et l'installation npm tournaient en parallèle** ; le même OCR avait réussi plus tôt le même jour via `/register` (étape auditée, 82,6 %). À revalider à froid.
- ⏳ I5, I9, I10, I12, I13, I14, I16 : à dérouler manuellement lors de la prochaine démo complète (nécessitent de vraies images CIN/dégâts et un parcours navigateur).

## 4. Tests de sécurité

| Vérification | Statut |
|---|---|
| Routes assureur inaccessibles sans session (401) et au rôle client (403) | ✅ vérifié en direct |
| Mots de passe stockés en hash bcrypt uniquement | ✅ (revue de code `auth/password`) |
| JWT signé, cookie httpOnly | ✅ (revue `auth/session` + middleware) |
| Traversée de chemin sur les IDs de dossier | ✅ test unitaire dédié |
| Secrets hors du code source (`.env` non versionné) | ✅ `.env` retiré du suivi git — **rotation des clés requise** (historique git) |
| Upload : taille et types de fichiers limités | ✅ (revue des routes upload) |
