import type { AspBaremes } from './types';

/**
 * Allocation ASP journalière brute pour une ancienneté ≥ 1 an.
 *
 * ASP = taux (75 %) × SJR, plafonnée au plafond journalier et plancher journalier.
 *
 * NB : pour une ancienneté < 1 an, l'ASP est égale à l'ARE (règle gérée au niveau du
 * scénario CSP, pas ici). Voir compare().
 */
export function computeAspDaily(sjr: number, asp: AspBaremes): number {
  const brut = asp.taux.valeur * sjr;
  const plafonne = Math.min(brut, asp.plafondJournalier.valeur);
  return Math.max(plafonne, asp.plancherJournalier.valeur);
}
