import type { Baremes } from './types';

/** Abattement d'assiette pour la CSG et la CRDS sur les allocations (1,75 %). */
const ABATTEMENT_CSG_CRDS = 0.9825;

/**
 * Estimation du montant NET journalier d'une allocation (ARE ou ASP) — décision 9.
 *
 * Méthode France Travail / Unédic (à confirmer en parité avec le simulateur FT) :
 * 1. Retraite complémentaire = 3 % du SJR, prélevée sans faire passer l'allocation
 *    sous le plancher (allocation minimale 32,13 €/j). En dessous de ce plancher,
 *    aucune retenue retraite.
 * 2. CSG (6,2 %) + CRDS (0,5 %) sur une base abattue à 98,25 %, uniquement si
 *    l'allocation journalière brute atteint le seuil d'exonération (61 €/j).
 *
 * AVERTISSEMENT : c'est une ESTIMATION. Le chiffre canonique reste le brut. Les taux
 * réduits de CSG (3,8 % / 0 % selon le revenu fiscal) ne sont pas modélisés en v1.
 */
export function computeNetDaily(grossDaily: number, sjr: number, baremes: Baremes): number {
  const plancher = baremes.are.plancherJournalier.valeur;
  const retraite = baremes.net.tauxRetraiteComplementaire.valeur * sjr;

  const afterRetraite =
    grossDaily >= plancher ? Math.max(grossDaily - retraite, plancher) : grossDaily;

  if (grossDaily < baremes.net.seuilExonerationJournalier.valeur) {
    return afterRetraite;
  }

  const base = afterRetraite * ABATTEMENT_CSG_CRDS;
  const csgCrds = base * (baremes.net.tauxCsg.valeur + baremes.net.tauxCrds.valeur);
  return afterRetraite - csgCrds;
}
