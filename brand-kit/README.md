# SANAD — Brand Kit

Identité visuelle officielle de la plateforme SANAD (eKYC intelligent & automatisation des sinistres, Tunisie).

## 1. Logo

| Fichier | Usage |
|---|---|
| `logo/sanad.png` | Logo principal — fonds clairs, en-têtes, documents |

**Règles d'usage :**
- Zone de protection : laisser au minimum la hauteur du symbole en espace libre autour du logo.
- Taille minimale : 32 px de hauteur à l'écran, 10 mm en impression.
- Ne pas déformer, incliner, recolorer ni ajouter d'ombre au logo.
- Sur fond sombre ou photo chargée : placer le logo dans un cartouche blanc arrondi.

## 2. Palette de couleurs

### Couleurs de marque
| Rôle | Nom | HEX | Usage |
|---|---|---|---|
| 🟦 Primaire | Teal SANAD | `#1F6F78` | Boutons principaux, titres, liens, éléments de marque |
| 🟩 Secondaire | Vert lagon | `#3BA99C` | Accents, états actifs, anneaux de focus |
| ⬜ Accent clair | Écume | `#E8F5F4` | Fonds de badges, surlignages doux |
| ⬛ Texte | Ardoise | `#24333A` | Texte principal |
| ▫️ Texte atténué | Gris brume | `#6B7A80` | Texte secondaire, légendes |
| ▫️ Fond | Blanc vert | `#F7FAF9` | Fond de page |
| ▫️ Surface | Blanc | `#FFFFFF` | Cartes, panneaux |
| ▫️ Bordure | Vert de gris | `#D8E4E2` | Séparateurs, contours de cartes |

### Couleurs sémantiques (états & décisions)
| Rôle | HEX | Usage |
|---|---|---|
| ✅ Succès | `#2E8B57` | Auto-approbation, vérifications réussies, « système opérationnel » |
| ⚠️ Avertissement | `#F4B740` | Revue manuelle, vigilance, sévérité modérée |
| ⛔ Danger | `#D9534F` | Fraude détectée, risque élevé, erreurs |

**Règle des décisions gated** (cohérence produit ↔ slides) : vert = auto-approuvé, orange/ambre = transmis à un expert, rouge = fraude/bloqué. Toujours ces trois couleurs, dans les slides comme dans l'app.

## 3. Typographie

| Usage | Police | Graisse |
|---|---|---|
| Titres & display | **Plus Jakarta Sans** | Bold (700) |
| Texte courant & UI | **Manrope** | Regular (400) / Medium (500) / SemiBold (600) |
| Arabe / derja | police système arabe (rendu RTL natif) | — |

Deux polices Google Fonts gratuites — utilisables librement dans les slides, documents et vidéos.

## 4. Ton & voix

- **Clair et rassurant** : on parle d'assurance à des gens stressés par un accident — phrases courtes, pas de jargon (jamais « SHAP/LLM/YOLO » face au client).
- **Trilingue par principe** : français, arabe, derja — le client choisit, pas nous.
- **Honnête sur les chiffres** : toujours distinguer mesuré vs estimé ; pas de superlatifs (« meilleur », « révolutionnaire » sont bannis).
- **Humain d'abord** : l'IA propose, l'humain garde le contrôle — le message « decided with control » est central.

## 5. Taglines officielles

| Langue | Tagline |
|---|---|
| FR | « Assuré en 5 minutes, déclaré en 3, décidé sous contrôle. » |
| EN | “Insured in five minutes, declared in three, decided with control.” |
| AR | « مؤمَّن في 5 دقائق، مصرَّح في 3، مقرَّر تحت السيطرة. » |

Signature courte : **SANAD — votre allié assurance** (sanad = « soutien/appui » en arabe).

## 6. Éléments visuels

- Coins arrondis généreux (`rounded-2xl`) sur cartes et boutons — jamais d'angles vifs.
- Icônes : bibliothèque **Lucide** (trait fin, 16-20 px) — cohérente avec l'app.
- Le visuel « 3 gates » (montant / confiance / fraude, feux vert-orange-rouge) est l'élément signature des présentations — voir `data-room/diagrams/` pour les schémas officiels.
- Planche visuelle prête à l'emploi : `brand-board.png` dans ce dossier.
