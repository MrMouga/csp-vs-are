# Barèmes & règles CSP (ASP) vs ARE — Référence 2026

> Document de recherche produit le 2026-06-23 via /office-hours.
> But : fondation du moteur de calcul. Chaque valeur porte sa **source** et son
> **statut**. NE PAS coder une valeur ⚠️ comme vérité avant confirmation sur le
> texte officiel cité.
>
> Statuts :
> - ✅ **Confirmé** : recoupé sur ≥2 sources dont une officielle (Unédic / France Travail / Service-Public).
> - ⚠️ **À vérifier** : valeur trouvée mais à confirmer ligne par ligne sur le texte officiel (revalorisations, dates d'effet).
> - 🔢 **Conflit de sources** : plusieurs valeurs trouvées — à arbitrer sur la source faisant autorité.

---

## Sources faisant autorité (à verrouiller en premier)

1. **Unédic — fiche ASP** : https://www.unedic.org/la-reglementation/fiches-thematiques/allocation-de-securisation-professionnelle-asp
2. **Unédic — fiche CSP** : https://www.unedic.org/la-reglementation/fiches-thematiques/contrat-de-securisation-professionnelle-csp
3. **France Travail — « Données À Connaître » (DAC) au 1er janvier 2026** (PDF, LA source des montants) : https://www.francetravail.org/files/live/sites/peorg/files/documents/Publications/DAC%20Allocaides%20_Vdef1er%20Janvier%202026.pdf
4. **Service-Public — ASP** : https://www.service-public.gouv.fr/particuliers/vosdroits/F31688
5. **Service-Public — CSP** : https://www.service-public.gouv.fr/particuliers/vosdroits/F13819
6. **France Travail — fiche CSP licencié éco** (PDF com-555) : https://www.francetravail.fr/files/live/sites/PE/files/fichiers-en-telechargement/fichiers-en-telechargement---dem/com-555-CSP.pdf

> **RÈGLE D'OR (décision validée) : France Travail est la source UNIQUE de vérité
> pour toute donnée chiffrée.** Tout montant (minima, partie fixe, plafonds, plancher
> ASP/ARE) se code depuis le PDF DAC 1er janvier 2026 (source 3). Les blogs et
> simulateurs tiers servent à comprendre, jamais à coder une valeur.
>
> Nuance : France Travail publie les **montants appliqués** ; l'**Unédic** écrit le
> **règlement** (mécanique des durées, coefficients, différés). Donc : un *chiffre* →
> France Travail ; une *règle de calcul* → règlement Unédic. En cas de conflit, France
> Travail tranche.

---

## A. CSP → ASP (Allocation de Sécurisation Professionnelle)

| Élément | Valeur | Statut | Source |
|---|---|---|---|
| Taux (ancienneté ≥ 1 an) | **75 % du SJR brut** | ✅ | Unédic ASP, France Travail |
| Taux (ancienneté < 1 an) | = montant ARE | ✅ | Unédic ASP |
| Équivalence pratique | 75 % du brut ≈ proche du **net** | ⚠️ | France Travail (« correspond au salaire net ») — à nuancer, dépend du taux de charges |
| Plancher journalier | **32,13 €/j** | 🔢 | macalculatriceenligne ; mais « ne peut être < ARE » (min ARE ≈ 32,50) → réconcilier |
| Plafond journalier | **294,40 €/j** (= 4 × PMSS journalier 2026) | ⚠️ | recoupé plusieurs sources, confirmer sur DAC |
| Durée max | **12 mois (365 jours)** | ✅ | Unédic, France Travail, Service-Public |
| Carence | **Aucune** | ✅ | France Travail |
| Différé (congés payés + spécifique) | **Aucun** | ✅ | France Travail (« ASP due dès le lendemain de la rupture ») |
| Début du versement | lendemain de la rupture (après les 21 j de réflexion, salaire maintenu pendant ces 21 j) | ✅ | France Travail |
| Période de référence du SJR | 24 mois (< 53 ans) / 36 mois (≥ 53 ans) | ✅ | source ASP |
| Dispositif prolongé jusqu'au | **31 décembre 2026** | ✅ | LégiSocial, Axens |

**Point clé** : l'ASP à 75 % du brut ≈ proche du net → c'est pourquoi le CSP « paraît »
nettement plus généreux que l'ARE (57 % du brut ≈ ~73 % du net). C'est le moteur du
« CSP gagne presque toujours » du cas standard.

---

## B. Refus du CSP → ARE (Allocation de Retour à l'Emploi)

### Montant

| Élément | Valeur | Statut | Source |
|---|---|---|---|
| Formule journalière | **max( 40,4 % × SJR + partie fixe ; 57 % × SJR )** | ✅ | Service-Public, France Travail |
| Partie fixe | **13,11 €/j** (un autre source dit 13,19) | 🔢 | wizbii 13,11 / francuski 13,19 → DAC arbitre |
| Plafond | **75 % du SJR** | ✅ | plusieurs sources |
| Plancher | **32,50 €/j** (~975 €/mois) — un autre source dit 31,97 | 🔢 | francuski 32,50 / wizbii 31,97 → DAC arbitre |
| Rappel 2025 | min était 31,59 €/j | contexte | francuski |

> ⚠️ **À verrouiller sur le DAC 1er janvier 2026** : partie fixe + plancher. Ces deux
> nombres bougent à chaque revalorisation (souvent 1er juillet) — le simulateur doit
> les stocker datés.

### Durée

| Âge en fin de contrat | Durée max indemnisable | Statut |
|---|---|---|
| < 55 ans | **548 jours (~18 mois)** | ⚠️ |
| 55-56 ans | **685 jours (~22,5 mois)** | ⚠️ |
| ≥ 57 ans | **822 jours (~27 mois)** | ⚠️ |

> 🔢 **Piège majeur à ne pas rater** : les 548 jours intègrent DÉJÀ le **coefficient
> contracyclique 0,75** (réduction de 25 % appliquée en période de faible chômage,
> taux < 9 %, plancher 182 jours, depuis le 1er fév. 2023). **Ne pas réappliquer 0,75
> par-dessus.** Vérifier sur Unédic si le coefficient est toujours actif en 2026 et si
> les seuils d'âge (55 / 57) sont les bons (la réforme 2025 a relevé l'âge senior).

### Carence & différés (le « money starts later » de l'ARE)

| Élément | Valeur | Statut | Source |
|---|---|---|---|
| Délai d'attente (carence) | **7 jours** fixes | ✅ | France Travail |
| Différé congés payés (ICCP) | = jours d'indemnité compensatrice de congés payés | ✅ | règle générale |
| Différé spécifique (indemnités supra-légales) | plafonné à **75 jours en licenciement économique** (vs 150 j sinon) | ✅ | France Travail / Unédic |

> Conséquence pour le moteur : sous ARE, l'argent commence après carence (7 j) +
> différé CP + différé spécifique (≤ 75 j en éco). Soit potentiellement ~2,5 mois de
> décalage. Sous CSP : zéro décalage. **C'est un des leviers de la zone de bascule.**

### Dégressivité du MONTANT (hauts salaires)

| Élément | Valeur | Statut | Source |
|---|---|---|---|
| Réduction | **-30 % après 6 mois** (dès le 7e mois) | ⚠️ | aide-sociale |
| Plancher sous lequel la dégressivité ne s'applique pas | **92,57 €/j brut** | ⚠️ | aide-sociale (≈ SJR > ~4 900 €/mois) |
| Ne s'applique pas avant | **55 ans** (abaissé de 57 → 55 au 1er avril 2025) | ✅ | Unédic |

> Pour le cas standard (salaire moyen), la dégressivité du montant ne joue PAS. À
> modéliser surtout pour les cadres / hauts salaires (cas hors périmètre v1 possible).

---

## C. Sort du préavis & indemnités (le levier « retour rapide »)

| Élément | Règle | Statut | Source |
|---|---|---|---|
| Indemnité de préavis sous CSP | Les **3 premiers mois** de préavis (chargés) **non perçus** par le salarié ≥ 1 an d'ancienneté sont **versés par l'employeur à France Travail** pour financer le CSP | ✅ | France Travail, Unédic |
| Préavis > 3 mois | Le **surplus au-delà de 3 mois** est versé au salarié | ⚠️ | à confirmer Unédic |
| Indemnité de préavis sous ARE (refus CSP) | **Conservée** par le salarié (mais génère du différé / décale l'ARE) | ✅ | déduction des règles |
| Indemnité légale de licenciement | **Toujours due**, CSP ou ARE | ✅ | Service-Public |
| Indemnités supra-légales | Conservées dans les 2 cas, mais **allongent le différé spécifique** sous ARE (≤ 75 j en éco) | ✅ | France Travail |

> **C'est le cœur de la bascule en retour rapide** : sous CSP, le salarié ≥ 1 an
> d'ancienneté « perd » jusqu'à 3 mois de préavis (qui financent le dispositif). Sous
> ARE, il garde ce préavis. Donc si elle retrouve un emploi très vite, le préavis
> conservé sous ARE peut compenser le taux plus faible. À modéliser précisément.

---

## D. Synthèse — comment la zone de bascule se forme

Trois forces qui s'opposent (à coder comme les variables du moteur) :

1. **Montant mensuel** : CSP (75 % brut) > ARE (57 % brut). Avantage CSP, chaque mois.
2. **Décalage de départ** : CSP = 0. ARE = carence 7 j + différés (≤ ~2,5 mois). Avantage CSP.
3. **Durée & préavis** : ARE plus longue (548 j vs 365 j) ET préavis conservé (jusqu'à 3 mois de salaire). Avantage ARE, surtout aux extrêmes (retour très rapide → le préavis pèse ; chômage > 12 mois → la durée pèse).

→ **Le CSP domine la zone « retour entre ~3 et ~12 mois »** (la plus fréquente). L'ARE
peut repasser devant en **retour très rapide** (préavis conservé) ou en **chômage long
> 12 mois** (durée). Le moteur doit résoudre le(s) point(s) de croisement N — fonction
par morceaux, 0, 1 ou 2 croisements.

---

## E. Ce qu'il reste à verrouiller AVANT de coder le moteur

- [ ] Partie fixe ARE 2026 (13,11 vs 13,19) → **DAC 1er janvier 2026**
- [ ] Plancher ARE 2026 (32,50 vs 31,97) → **DAC**
- [ ] Plancher ASP & sa relation au plancher ARE (32,13 vs « ≥ ARE ») → **DAC + Unédic ASP**
- [ ] Plafond ASP 294,40 €/j → confirmer = 4 × PMSS journalier 2026 → **DAC**
- [ ] Durées ARE 548 / 685 / 822 : coefficient 0,75 déjà inclus ? seuils d'âge 55/57 corrects en 2026 ? → **Unédic durée**
- [ ] Surplus de préavis > 3 mois versé au salarié sous CSP → **Unédic CSP**
- [ ] Modèle exact du différé CP + différé spécifique (jours) → **France Travail / Unédic**
- [ ] Règle de calcul du SJR (salaire de référence / nb de jours) identique CSP et ARE ? → **Service-Public F2064**

---

## F. Cas de test n°1 (l'assignment)

Quand tu as les chiffres réels de ton amie : salaire brut mensuel, ancienneté, âge,
indemnité de licenciement, indemnités supra-légales éventuelles, jours de CP non pris,
date limite. Calcule à la main CSP vs ARE sur 24 mois → c'est le test d'or du moteur.
Vise 2-3 cas qui encadrent la bascule (retour rapide / lent / pile au croisement).

---

## G. Corrections issues de la revue croisée (Codex, 2026-06-23)

> Ratées par la première passe. Plusieurs sont des corrections FACTUELLES à vérifier
> en PRIORITÉ sur Service-Public / France Travail avant de coder le moteur.

1. ✅ **Formule ARE — CONFLIT RÉSOLU (T1, 2026-06-23).** Vérifié sur France Travail +
   Unédic : **le plafond d'indemnisation reste 75% du SJR** (la section B était juste,
   Codex s'est trompé sur ce point). Formule = max(40,4% SJR + partie fixe ; 57% SJR),
   plafonnée à 75%.
   MAIS Codex avait flairé un vrai 70% mal attribué : depuis le **1er avril 2025**, les
   **jours non travaillés entre deux contrats** ne comptent que dans la limite de **70%
   des jours travaillés** (au lieu de 75%) **dans le calcul du SJR**. 🔴 Nouvelle règle
   à modéliser dans `computeSJR()` — distincte du plafond d'indemnisation.
   Reste à figer sur le DAC : partie fixe (13,11 vs 13,18 €/j selon revalo 01/07/2025)
   et plancher (31,97 €/j confirmé par Unédic 2026).

2. 🔴 **Post-CSP : le CSP n'est PAS « 12 mois puis zéro ».** Si toujours au chômage
   après les 12 mois d'ASP → bascule en ARE **sans carence ni nouveau différé**, durée
   ARE **réduite des jours d'ASP déjà consommés**. Le moteur doit modéliser « ASP 12
   mois PUIS ARE résiduelle ». Conséquence : le CSP est encore plus dominant ; la
   bascule vers l'ARE se joue surtout côté **retour rapide** (préavis), pas chômage long.
   → corrige la synthèse D.3 ci-dessus. (Source : Service-Public CSP)

3. **Préavis = GATE de premier niveau, pas un edge.** ≥ 1 an : seul le montant jusqu'à
   3 mois part à France Travail, le **surplus est versé au salarié**. < 1 an : garde
   l'indemnité de préavis et **ASP = ARE**.

4. **Retour rapide à modéliser MAINTENANT.** Le retour anticipé peut clôturer le CSP,
   et la prime / IDR (indemnité différentielle de reclassement) peut dominer l'histoire
   du préavis. L'insight central du produit en dépend → pas une question ouverte.

5. **Net vs brut.** Les gens raisonnent en cash net (CSG/CRDS, retraite compl., plancher
   net, base 30 j). Comparer en brut peut **inverser le résultat perçu**. Décider tôt.

6. **Barèmes datés par DATE DE FIN DE CONTRAT, pas « année courante ».** Date d'effet +
   barèmes archivés, sinon faux résultats silencieux après réforme. (Affine 4A :
   `baremes-<dateEffet>.json`.)

7. **Écran d'éligibilité AVANT tout calcul** : motif éco, CDI, taille employeur /
   insolvabilité, résidence, aptitude, ancienneté → « cet outil ne s'applique peut-être
   pas à ton cas ».

8. **Oracle de test.** Un simulateur web change/arrondit/cache des entrées. Préférer les
   **exemples des circulaires Unédic** + fixtures auditées à la main, versionnées avec
   leurs hypothèses. (Affine 5A.)

9. **Le PDF porte ses limites** : hypothèses, cas exclus, dates des sources, « ce n'est
   pas une décision officielle ». Sinon fausse autorité. (Affine 2A.)
