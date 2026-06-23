/** Sous-ensemble de l'entrée nécessaire au calcul du préavis. */
export interface PreavisInput {
  salaireBrutMensuel: number;
  preavisMois: number;
  ancienneteMois: number;
}

export type Scenario = 'csp' | 'are';

/** Nombre de mois de préavis qui financent le CSP (≥ 1 an d'ancienneté). */
const MOIS_PREAVIS_FINANCANT_CSP = 3;
const MOIS_UN_AN = 12;

/**
 * Indemnité de préavis effectivement conservée par le salarié (€), selon le scénario.
 *
 * Correction Codex #3 (gate de premier niveau) :
 * - Sous ARE : le préavis est conservé en entier.
 * - Sous CSP, ancienneté ≥ 1 an : les 3 premiers mois financent le CSP ; seul le
 *   surplus au-delà de 3 mois est versé au salarié.
 * - Sous CSP, ancienneté < 1 an : le salarié garde l'indemnité de préavis (et ASP = ARE).
 */
export function computePreavisKept(input: PreavisInput, scenario: Scenario): number {
  const moisConserves =
    scenario === 'csp' && input.ancienneteMois >= MOIS_UN_AN
      ? Math.max(0, input.preavisMois - MOIS_PREAVIS_FINANCANT_CSP)
      : input.preavisMois;
  return moisConserves * input.salaireBrutMensuel;
}
