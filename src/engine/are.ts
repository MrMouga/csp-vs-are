import type { AreBaremes } from './types';

/**
 * Allocation ARE journalière brute.
 *
 * Formule (France Travail / Unédic, vérifiée 2026-06-23) :
 *   max( tauxBas * SJR + partieFixe ; tauxHaut * SJR )
 * plafonnée à plafondPartSJR * SJR (75 %), avec un plancher journalier.
 */
export function computeAreDaily(sjr: number, are: AreBaremes): number {
  const formuleA = are.tauxBas.valeur * sjr + are.partieFixe.valeur;
  const formuleB = are.tauxHaut.valeur * sjr;
  const brut = Math.max(formuleA, formuleB);
  const plafonne = Math.min(brut, are.plafondPartSJR.valeur * sjr);
  return Math.max(plafonne, are.plancherJournalier.valeur);
}
