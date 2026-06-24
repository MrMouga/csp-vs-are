import { computeSjrFromPeriods } from './sjr-periods';
import { computeIndemniteLegaleLicenciement } from './indemnite';
import type { EmploymentPeriod, UserInput } from './types';

/** Entrée de comparaison basée sur les périodes d'emploi (modèle proche de France Travail). */
export interface ComparisonInput {
  /** Âge en fin de contrat. */
  age: number;
  /** Périodes d'emploi salariées sur la période de référence. */
  periods: EmploymentPeriod[];
  /** Durée du préavis (mois). */
  preavisMois: number;
  /** Le préavis est-il payé (indemnité compensatrice) ? */
  preavisPaye: boolean;
  /** Indemnité légale de licenciement saisie manuellement (remplace le calcul auto). */
  indemniteLicenciementManuelle?: number;
}

function monthsInclusive(debut: string, fin: string): number {
  const d = new Date(debut + 'T00:00:00Z');
  const f = new Date(fin + 'T00:00:00Z');
  return f.getUTCFullYear() * 12 + f.getUTCMonth() - (d.getUTCFullYear() * 12 + d.getUTCMonth()) + 1;
}

/**
 * Transforme l'entrée par périodes en entrée scalaire du moteur :
 * - SJR précis (jours calendaires) ;
 * - ancienneté et salaire pris sur la période la plus récente (celle du licenciement) ;
 * - indemnité légale calculée automatiquement (sauf saisie manuelle) ;
 * - part supra-légale = rupture − légale (alimente le différé spécifique) ;
 * - différé congés payés exprimé en jours = indemnité CP / SJR.
 */
export function resolveInput(input: ComparisonInput): UserInput {
  const periods = [...input.periods].sort((a, b) => (a.dateFin < b.dateFin ? -1 : 1));
  const last = periods[periods.length - 1]!;

  const sjr = computeSjrFromPeriods(input.periods, input.age);
  const ancienneteMois = monthsInclusive(last.dateDebut, last.dateFin);
  const salaireBrutMensuel = last.salaireBrutMensuel;
  const indemniteLicenciement =
    input.indemniteLicenciementManuelle ??
    computeIndemniteLegaleLicenciement(salaireBrutMensuel, ancienneteMois);
  const indemnitesSupraLegales = Math.max(0, last.indemniteRupture - indemniteLicenciement);
  const joursCongesPayesNonPris = sjr > 0 ? last.indemniteCongesPayes / sjr : 0;

  return {
    salaireBrutMensuel,
    ancienneteMois,
    age: input.age,
    indemniteLicenciement,
    indemnitesSupraLegales,
    joursCongesPayesNonPris,
    preavisMois: input.preavisMois,
    sjr,
    preavisPaye: input.preavisPaye,
  };
}
