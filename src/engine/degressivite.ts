import type { DegressiviteBaremes } from './types';

const DAYS_PER_MONTH = 365 / 12;

/**
 * Allocation ARE brute sur `payableDays` jours, en appliquant la dégressivité des hauts
 * salaires.
 *
 * Au-delà du seuil de SJR (≈ 4 940 €/mois) et avant 55 ans, l'ARE est versée au plein
 * tarif pendant 6 mois, puis réduite (coefficient 0,7 = −30 %) sans descendre sous le
 * plancher. Sinon, allocation pleine sur toute la durée.
 *
 * NB : l'ASP du CSP n'est jamais dégressive — c'est l'un des avantages du CSP pour les
 * hauts salaires.
 */
export function computeAreAllocation(
  payableDays: number,
  dailyFull: number,
  dailyReduced: number,
  sjr: number,
  age: number,
  deg: DegressiviteBaremes,
): number {
  const applies = age < deg.ageExemption.valeur && sjr > deg.seuilSjr.valeur;
  if (!applies) return dailyFull * payableDays;

  const seuilJours = deg.moisAvantReduction.valeur * DAYS_PER_MONTH;
  const joursPleins = Math.min(payableDays, seuilJours);
  const joursReduits = Math.max(0, payableDays - seuilJours);
  return dailyFull * joursPleins + dailyReduced * joursReduits;
}

/** Tarif journalier réduit (−30 %, plancher), avant conversion éventuelle en net. */
export function areReducedDaily(areDaily: number, deg: DegressiviteBaremes): number {
  return Math.max(areDaily * deg.coefficient.valeur, deg.plancher.valeur);
}
