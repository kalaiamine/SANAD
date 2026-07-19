# SANAD — Business Model Canvas (BMC)

Planche visuelle prête pour les slides : [`bmc.png`](bmc.png)

## 1. Segments de clientèle
- **Payeurs** : compagnies d'assurance tunisiennes (~20 sur le marché, priorité auto), puis maghrébines.
- **Utilisateurs finaux** : assurés particuliers (conducteurs) — francophones, arabophones et locuteurs de derja.
- Phase ultérieure : courtiers et bancassurance (canal de distribution des polices).

## 2. Proposition de valeur
- **Pour l'assureur** : -25 à -30 % de coût de traitement estimé sur les petits sinistres (formule transparente, à calibrer en pilote) ; détection de fraude photo-vs-déclaration ; conformité AML/CFT Loi 2015-26 native avec piste d'audit ; KYC mutualisé (coût d'onboarding partagé).
- **Pour l'assuré** : identité vérifiée en ~5 min sans agence ; sinistre déclaré en ~3 min, 24h/24, dans sa langue (FR/AR/derja) ; décision expliquée le jour même.
- **Différenciateur** : l'IA ne décide seule que sous triple condition (montant, confiance, fraude) — automatisation auditable par un régulateur.

## 3. Canaux
- Vente directe B2B aux directions sinistres/innovation des assureurs (marché concentré : ~20 comptes).
- Pilote comme produit d'appel — les résultats mesurés deviennent l'argumentaire commercial.
- Événements sectoriels (FTUSA, conférences insurtech Maghreb) et prescription par le régulateur (CGA).

## 4. Relation client
- **Assureurs** : accompagnement d'intégration + comité de calibration des seuils (500 TND / 70 % / 30) + support dédié.
- **Assurés** : self-service via l'assistant conversationnel trilingue ; escalade vers un expert humain quand un gate est déclenché.

## 5. Flux de revenus
- Redevance **par identité vérifiée** (eKYC) — quelques dinars par dossier.
- Redevance **par sinistre traité** — quelques dinars par dossier.
- **Abonnement plateforme** annuel par assureur (dashboard, audit, mises à jour listes AML).
- Phase 3 : commission de place sur le réseau KYC mutualisé inter-assureurs.

## 6. Ressources clés
- La plateforme (Next.js + service eKYC Python) et ses modèles : PaddleOCR arabe, face-match local, moteur AML explicable, grille de coûts TND.
- Le dossier d'audit KYC réutilisable (actif de données, avec consentement).
- L'équipe technique et la connaissance du terrain tunisien (langue, loi, constat).

## 7. Activités clés
- Développement produit et durcissement sécurité.
- Calibration des seuils sur données réelles (pilote) et amélioration continue des modèles.
- Mise à jour des listes sanctions/PPE (ONU/CTAF) et veille réglementaire.
- Onboarding et support des assureurs partenaires.

## 8. Partenaires clés
- **Assureur pilote** (critique — la demande du pitch).
- Régulateur (CGA) et CTAF pour la conformité AML/CFT.
- Fournisseurs d'IA : Groq (LLM/vision), Roboflow (YOLO dégâts) — remplaçables, non structurants.
- Garages agréés / experts automobiles (validation des estimations, Phase 2).

## 9. Structure de coûts
- Ingénierie (poste principal) : développement, sécurité, MLOps.
- Infrastructure : hébergement léger sans GPU (VPS/on-premise assureur) + coûts d'API IA à l'usage (faibles, facturés au volume).
- Conformité et juridique (agréments, protection des données).
- Commercial B2B (cycle de vente assureur long).

**Logique économique** : coûts quasi fixes (ingénierie) + coût marginal par dossier très faible → la marge croît avec le volume de dossiers et le nombre d'assureurs membres ; l'effet réseau du KYC mutualisé renforce la rétention.
