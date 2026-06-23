import type { DureeBaremes } from './types';

/**
 * Durée maximale d'indemnisation ARE (jours) selon l'âge en fin de contrat.
 *
 * Tranches 2026 (à confirmer sur Unédic) :
 *   < 55 ans   → 548 jours
 *   55-56 ans  → 685 jours
 *   ≥ 57 ans   → 822 jours
 */
export function computeAreDurationDays(age: number, duree: DureeBaremes): number {
  if (age < 55) return duree.moins55.valeur;
  if (age < 57) return duree.de55a56.valeur;
  return duree.min57.valeur;
}
