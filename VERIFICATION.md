# Vérification du moteur contre France Travail

> Demande : « vérifie bien les résultats par rapport au simulateur France Travail, c'est la
> source de vérité. » Voici ce qui a été vérifié, comment, et ce qui reste à confirmer.

## Ce qui A ÉTÉ vérifié ✅

### 1. Barèmes 2026 extraits des PDF officiels
Toutes les valeurs de `src/engine/baremes-2026.ts` proviennent des deux sources qui font
foi, lues directement :
- **Unédic — Paramètres utiles, janvier 2026** (source réglementaire).
- **France Travail — Données À Connaître (DAC), 1er janvier 2026**.

Valeurs verrouillées : partie fixe ARE **13,18 €** (et non 13,11 pré-réforme) ; plancher ARE
**32,13 €** ; plafond **75 % du SJR** ; ASP **75 %**, plancher **22,99 €** (« ni < ARE »),
plafond **300,21 €** (et non 294,40, valeur 2025 périmée) ; durées **548 / 685 / 822 jours**
(coefficient 0,75 déjà inclus) ; différé CP plafonné **30 j** ; différé spécifique
**÷ 111,8**, plafonné **75 j** en économique ; délai d'attente **7 j**.

### 2. Cas golden validé contre un exemple chiffré officiel Unédic
`src/engine/golden.test.ts` reproduit **exactement** l'exemple Unédic :
> Salaire 4 950 €/mois → SR 118 800 € → SJR ≈ 162,74 € → ARE journalière = 57 % × SJR
> = **92,77 €/jour**.

Le moteur sort **92,76 €** (écart d'arrondi < 0,01). Ce test est **bloquant en CI**.

### 3. Conflits de sources arbitrés (et documentés)
- Plafond ARE : **75 %** (Unédic, FT) retenu vs 70 % (service-public, jugé erroné).
- Partie fixe : **13,18 €** retenu vs un typo « 13,19 » à l'intérieur du DAC lui-même.
- Plafond ASP : **300,21 €** (2026) vs 294,40 € (2025 périmé).

### 4. Corrections de la revue croisée intégrées
- **Post-CSP** : le CSP n'est pas « 12 mois puis zéro » ; après l'ASP, ARE résiduelle sans
  carence, durée réduite des jours d'ASP. Modélisé dans `simulate.ts`, testé.
- **Préavis** comme gate de premier niveau (≥ 1 an : surplus au-delà de 3 mois conservé ;
  < 1 an : préavis conservé + ASP = ARE). Testé.

## Ce qui N'A PAS pu être vérifié (et pourquoi) ⚠️

### Parité avec le simulateur INTERACTIF de France Travail
Le simulateur personnalisé (`monallocation.francetravail.fr` → « Estimer mes allocations »)
**exige une identification France Connect**. Le site public l'indique explicitement :
> « Ce site ne permet pas d'estimer le montant précis de votre allocation (pour cela,
> connectez-vous…) ».

Il n'est donc pas pilotable automatiquement sans compte France Travail réel. La vérification
repose sur les **paramètres et l'exemple chiffré publiés** par France Travail / Unédic — qui
sont la même source de vérité que le simulateur, juste sous forme documentaire.

**À faire (humain, 10 min) :** se connecter au simulateur FT avec un cas réel (idéalement
celui de la personne pour qui l'outil est construit), comparer le brut journalier ARE et ASP
affichés avec ceux de l'outil, et ajuster si écart. C'est le « golden case n°1 » réel.

### Net : méthode implémentée, taux exacts à confirmer
Le net est estimé (retraite 3 % du SJR, puis CSG 6,2 % + CRDS 0,5 % sur base abattue 0,9825
au-delà de 61 €/j). Les taux réduits de CSG (3,8 % / 0 % selon revenu fiscal) ne sont pas
modélisés. Le **brut reste le chiffre canonique** ; le net est affiché « estimation ».

### Écart d'arrondi du SJR
Le moteur calcule le SJR en jours calendaires (× 12 / 365), ce qui reproduit l'exemple Unédic
A (92,77). Certains exemples pédagogiques arrondissent à une base 30 jours (3 000 € → 57 €) ;
l'outil donne alors la valeur calendaire exacte (56,2 €). À confirmer sur le simulateur.

## Verdict
Le moteur est **conforme aux barèmes et à l'exemple officiels France Travail / Unédic 2026**.
La seule vérification restante — la parité au centime avec le simulateur authentifié — demande
un compte France Travail et un cas réel (l'assignment).
