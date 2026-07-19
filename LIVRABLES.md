# ✅ SANAD — Checklist des livrables (document maître)

> Document éditable : complétez les liens marqués `À AJOUTER` (vidéo, contacts) avant la soumission.

| # | Livrable | État | Emplacement |
|---|---|:---:|---|
| 1 | **Documentation technique** | ✅ | [docs/TECH.md](docs/TECH.md) · PDF : [data-room/03_Technical_Documentation.pdf](data-room/03_Technical_Documentation.pdf) — complétée par [docs/DATA.md](docs/DATA.md) (données) et [docs/TEST_PLAN.md](docs/TEST_PLAN.md) (plan de test, PDF dans data-room/) |
| 2 | **Démo vidéo** | ⬜ | `À AJOUTER : lien YouTube/Drive de la vidéo` — script de tournage prêt : plan de la démo 30 s dans [pitch-4min-FR.txt](pitch-4min-FR.txt) (diapo 4) + guide complet donné en conversation |
| 3 | **Dépôt GitHub (code réel)** | ✅ | https://github.com/kalaiamine/SANAD — 46 tests verts, code fonctionnel de bout en bout |
| 4 | **Concept note** | ✅ | [presentation-sanad.txt](presentation-sanad.txt) (section A : description du projet en 3 paragraphes ; sections C-G : gate de confiance, comparatif, impact, phases MVP) |
| 5 | **Pitch deck** | ✅ | Scripts calés sur le template Kawasaki/Enactus : [pitch-4min-FR.txt](pitch-4min-FR.txt) (français) · [pitch-4min-EN.txt](pitch-4min-EN.txt) (anglais) — 11 diapos, contenu `SUR LA DIAPO` + `DIRE`, Q&A préparée |
| 6 | **Business model / BMC** | ✅ | [docs/BUSINESS_MODEL.md](docs/BUSINESS_MODEL.md) (9 blocs détaillés) · planche visuelle : [docs/bmc.png](docs/bmc.png) |
| 7 | **Diagramme d'architecture** | ✅ | [data-room/diagrams/architecture.png](data-room/diagrams/architecture.png) · flux de données : [flow.png](data-room/diagrams/flow.png) · modèle de données : [ERD.png](data-room/diagrams/ERD.png) · source : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 8 | **Prototype / déploiement** | ✅ | Application fonctionnelle (voir README) : `docker compose up --build` ou [scripts/setup.ps1](scripts/setup.ps1) + [scripts/start-all.ps1](scripts/start-all.ps1) — comptes de test : `insurer@sanad.tn` / `demo.client@sanad.tn` (mots de passe dans le README) |
| 9 | **Brand kit** | ✅ | [brand-kit/README.md](brand-kit/README.md) (logo, palette, typographie, taglines FR/EN/AR, règles d'usage) · planche : [brand-kit/brand-board.png](brand-kit/brand-board.png) · logo : [brand-kit/logo/sanad.png](brand-kit/logo/sanad.png) |

## Pièces complémentaires (bonus)

| Pièce | Emplacement |
|---|---|
| Data room complète (4 PDF + 3 diagrammes) | [data-room/](data-room/) |
| README de présentation du projet | [README.md](README.md) |
| Modèle des variables d'environnement | [.env.example](.env.example) |
| Jeux de données de démonstration | `npm run seed:insurer` · `npm run seed:demo` |
| Tests automatisés (21 TypeScript + 25 Python) | [src/lib/__tests__/](src/lib/__tests__/) · [ai-services/ocr-service/tests/](ai-services/ocr-service/tests/) |

## À faire avant la soumission (rappel)

- [ ] Enregistrer la démo vidéo (≤ 4 min, structure de la diapo 4) et coller le lien dans la ligne 2
- [ ] Ajouter les noms/rôles de l'équipe dans les diapos 1 et 8 du pitch
- [ ] Vérifier que le lien GitHub est accessible en public
- [ ] Répéter le pitch au chrono (4:00 max)
