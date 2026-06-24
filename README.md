# CSP ou ARE ? — Comparateur après un licenciement économique

**🔗 En ligne : https://mrmouga.github.io/csp-vs-are/**

Un outil simple et gratuit pour aider quelqu'un en situation de licenciement économique à
comparer ses deux options dans le délai de 21 jours :

- **CSP** (Contrat de Sécurisation Professionnelle → allocation **ASP**, ≈ 75 % du brut
  pendant 12 mois, sans carence, mais le préavis finance le dispositif) ;
- **ARE** (allocation chômage classique, ≈ 57 % du brut, plus longue, avec carence et
  différés, mais le préavis est conservé).

Le cœur de l'outil n'est pas un verdict binaire (le CSP gagne souvent), c'est la **zone de
bascule** : un curseur « retour à l'emploi dans N mois » qui montre, en direct, à partir de
quand chaque option devient la meilleure.

> ⚠️ **Estimation, pas une décision officielle.** Cet outil n'a pas vocation à remplacer
> France Travail. Vérifier auprès d'un conseiller avant de signer.

## Statut

Prototype fonctionnel (v0.1). Moteur de calcul complet et testé ; UI complète (assistant →
éligibilité → verdict + timeline interactive + transparence + impression PDF).

## Démarrer

```bash
npm install
npm run dev       # serveur de développement
npm test          # 47 tests (dont cas golden bloquants)
npm run build     # build statique dans dist/
```

## Architecture

- `src/engine/` — moteur de calcul en **fonctions pures**, testées (Vitest). Aucun couplage
  à l'UI. C'est là que vit toute la logique et tout le risque.
  - `baremes-2026.ts` — barèmes officiels datés, chaque valeur portant **sa source**
    (décision : la transparence ne peut pas dériver de la valeur).
  - `sjr`, `are`, `asp`, `duree`, `differe`, `preavis`, `net` — primitives.
  - `simulate` — cash mois par mois, **avec la continuation post-CSP** (après 12 mois d'ASP,
    bascule en ARE résiduelle).
  - `breakeven` — détection des points de bascule.
  - `compare` — API de haut niveau (`analyze` + `compareAt`).
  - `eligibility` — écran d'éligibilité (périmètre v1 = cas standard).
  - `golden.test.ts` — **cas golden bloquants** validés contre l'exemple officiel Unédic.
- `src/ui/` + `src/main.ts` — couche vue (Vanilla TS), volontairement fine.

## Périmètre v1

Cas **standard** uniquement : CDI, licenciement économique, temps plein, ≥ 1 an
d'ancienneté, < 55 ans, sans droits chômage antérieurs, salaire sous le seuil de
dégressivité (≈ 4 940 €/mois). Tout cas hors périmètre reçoit un message explicite
« vois ton conseiller » plutôt qu'un faux chiffre.

## Source de vérité

**France Travail / Unédic.** Voir [`baremes-2026-reference.md`](baremes-2026-reference.md)
(recherche sourcée) et [`VERIFICATION.md`](VERIFICATION.md) (ce qui a été vérifié et comment).

## Déploiement

Site statique. `npm run build` → `dist/`. CI GitHub Actions : les tests (dont les cas
golden) **bloquent** le déploiement vers GitHub Pages.
