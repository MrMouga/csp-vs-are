const ANCIENNETE_MIN_MOIS = 8; // minimum légal pour ouvrir droit à l'indemnité
const TAUX_10_PREMIERES = 0.25; // 1/4 de mois par an
const TAUX_AU_DELA = 1 / 3; // 1/3 de mois par an au-delà de 10 ans

/**
 * Indemnité légale de licenciement (€), calcul automatique.
 *
 * Barème légal : 1/4 de mois de salaire par année d'ancienneté pour les 10 premières
 * années, puis 1/3 de mois par année au-delà. Proratisé pour les années partielles.
 * Nulle en dessous de 8 mois d'ancienneté. L'utilisateur peut toujours saisir le
 * montant réel s'il diffère (conventions collectives plus favorables).
 */
export function computeIndemniteLegaleLicenciement(
  salaireMensuel: number,
  ancienneteMois: number,
): number {
  if (ancienneteMois < ANCIENNETE_MIN_MOIS) return 0;
  const annees = ancienneteMois / 12;
  const moisIndemnite =
    TAUX_10_PREMIERES * Math.min(annees, 10) + TAUX_AU_DELA * Math.max(0, annees - 10);
  return moisIndemnite * salaireMensuel;
}

export type StatutSyntec = 'etam' | 'cadre';

const SYNTEC_ANCIENNETE_MIN_ANNEES = 2; // le barème conventionnel ne joue qu'à partir de 2 ans
const SYNTEC_ETAM_PLAFOND_MOIS = 10;

/** Indemnité conventionnelle Syntec (ETAM ou Cadre), 0 sous 2 ans d'ancienneté. */
function indemniteSyntec(salaireMensuel: number, annees: number, statut: StatutSyntec): number {
  if (annees < SYNTEC_ANCIENNETE_MIN_ANNEES) return 0;
  if (statut === 'cadre') {
    // Cadre (IC) : 1/3 de mois par année, sans plafond depuis l'avenant 46 (mai 2023).
    return (annees / 3) * salaireMensuel;
  }
  // ETAM : 1/4 de mois/an jusqu'à 20 ans, 0,30 au-delà, plafonné à 10 mois.
  const mois = 0.25 * Math.min(annees, 20) + 0.3 * Math.max(0, annees - 20);
  return Math.min(mois, SYNTEC_ETAM_PLAFOND_MOIS) * salaireMensuel;
}

/**
 * Indemnité de rupture retenue = le plus favorable entre le légal et le conventionnel.
 *
 * Sous convention Syntec, le Cadre (1/3 de mois/an, sans plafond) est sensiblement plus
 * favorable que le légal ; l'ETAM est proche du légal. Hors Syntec, on applique le légal.
 */
export function computeIndemniteRupture(
  salaireMensuel: number,
  ancienneteMois: number,
  options: { syntec: boolean; statut?: StatutSyntec },
): number {
  const legal = computeIndemniteLegaleLicenciement(salaireMensuel, ancienneteMois);
  if (!options.syntec || !options.statut) return legal;
  if (ancienneteMois < ANCIENNETE_MIN_MOIS) return 0;
  const conventionnel = indemniteSyntec(salaireMensuel, ancienneteMois / 12, options.statut);
  return Math.max(legal, conventionnel);
}
