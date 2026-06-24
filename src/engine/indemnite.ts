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
