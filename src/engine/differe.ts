import type { DiffereBaremes } from './types';

/** Sous-ensemble de l'entrée nécessaire au calcul des différés ARE. */
export interface DeferralInput {
  /** Jours de congés payés non pris (différé congés payés). */
  joursCongesPayesNonPris: number;
  /** Indemnités supra-légales en € (différé spécifique). */
  indemnitesSupraLegales: number;
}

/**
 * Nombre de jours avant le premier versement de l'ARE.
 *
 * = différé congés payés (jours) + différé spécifique (plafonné à 75 j en éco)
 *   + délai d'attente (7 j).
 *
 * Le différé spécifique = indemnités supra-légales ÷ coefficient, plafonné.
 *
 * NB : l'ASP (CSP) n'a AUCUN différé ni carence — elle démarre dès le lendemain de la
 * rupture. C'est l'un des leviers de la zone de bascule.
 */
export function computeAreDeferralDays(input: DeferralInput, differe: DiffereBaremes): number {
  const differeCp = Math.max(0, input.joursCongesPayesNonPris);
  const differeSpecifiqueBrut = Math.floor(
    input.indemnitesSupraLegales / differe.coefficientDiffereSpecifique.valeur,
  );
  const differeSpecifique = Math.min(
    Math.max(0, differeSpecifiqueBrut),
    differe.plafondDiffereSpecifiqueJours.valeur,
  );
  return differeCp + differeSpecifique + differe.delaiAttenteJours.valeur;
}
