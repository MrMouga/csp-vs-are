import { computeSjrFromPeriods } from './sjr-periods';
import { computeIndemniteRupture, type StatutSyntec } from './indemnite';
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
  /** Sous convention Syntec ? (barème de licenciement plus favorable). */
  syntec: boolean;
  /** Statut Syntec (ETAM ou Cadre) — change le barème conventionnel. */
  statutSyntec?: StatutSyntec;
  /** Indemnité de rupture saisie manuellement (remplace le calcul auto). */
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

  // Indemnité légale : l'ancienneté se calcule JUSQU'À LA FIN DU PRÉAVIS, même si
  // celui-ci n'est pas effectué (article R1234-1 du Code du travail). On ajoute donc
  // le préavis à l'ancienneté de contrat pour cette indemnité uniquement.
  // NB : le salaire de référence légal est le plus favorable entre la moyenne des 12
  // derniers mois et le 1/3 des 3 derniers mois ; pour un salaire stable (cas v1), les
  // deux égalent le salaire mensuel utilisé ici.
  const ancienneteSeveranceMois = ancienneteMois + Math.max(0, input.preavisMois);
  const indemniteLicenciement =
    input.indemniteLicenciementManuelle ??
    computeIndemniteRupture(salaireBrutMensuel, ancienneteSeveranceMois, {
      syntec: input.syntec,
      ...(input.statutSyntec ? { statut: input.statutSyntec } : {}),
    });
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
