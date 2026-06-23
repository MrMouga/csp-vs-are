import { computeSjr } from './sjr';
import { computeAspDaily } from './asp';
import { computeAreDaily } from './are';
import { computeAreDurationDays } from './duree';
import { computeAreDeferralDays } from './differe';
import { computePreavisKept, type Scenario } from './preavis';
import type { Baremes, UserInput } from './types';

const DAYS_PER_MONTH = 365 / 12;
const ASP_MAX_DAYS = 365; // 12 mois
const MOIS_UN_AN = 12;

export type { Scenario };

/** Détail du cash reçu sous un scénario, pour un retour à l'emploi donné. */
export interface ScenarioResult {
  /** Allocations chômage perçues (ASP et/ou ARE), en brut. */
  allocations: number;
  /** Indemnité de préavis effectivement conservée. */
  preavisConserve: number;
  /** Indemnité légale de licenciement (identique aux deux scénarios). */
  indemniteLicenciement: number;
  /** Total du cash perçu (allocations + préavis conservé + indemnité légale). */
  total: number;
}

/**
 * Simule le cash total reçu sous un scénario (CSP ou ARE) si la personne retrouve un
 * emploi au bout de `reemploymentMonths` mois.
 *
 * Modèle v1 (cas standard, documenté — décision 8 : estimation, pas décision officielle) :
 * - CSP : ASP pendant min(durée chômage, 12 mois), SANS carence ni différé. Si toujours
 *   au chômage après 12 mois → ARE résiduelle (post-CSP, correction Codex #2), durée
 *   réduite des jours d'ASP consommés. Préavis : seul le surplus au-delà de 3 mois est
 *   conservé (≥1 an).
 * - ARE : ARE après les différés (carence + congés payés + spécifique), pendant
 *   min(durée chômage − différés, durée ARE). Préavis conservé en entier.
 *
 * Hypothèse de comparabilité : `reemploymentMonths` est mesuré depuis la décision
 * (fin de contrat). Le préavis et l'indemnité de licenciement sont traités comme des
 * sommes forfaitaires reçues quel que soit le scénario.
 */
export function simulateScenario(
  input: UserInput,
  baremes: Baremes,
  scenario: Scenario,
  reemploymentMonths: number,
): ScenarioResult {
  const sjr = computeSjr(input);
  const unemploymentDays = Math.max(0, reemploymentMonths) * DAYS_PER_MONTH;
  const areDaily = computeAreDaily(sjr, baremes.are);
  const areDurationDays = computeAreDurationDays(input.age, baremes.duree);

  let allocations: number;
  let preavisConserve: number;

  if (scenario === 'csp') {
    // Ancienneté ≥ 1 an : ASP = 75% du SJR, mais ne peut jamais être inférieure à l'ARE
    // que la personne aurait perçue (règle Unédic « ni à l'ARE »). Ancienneté < 1 an :
    // l'ASP est directement égale à l'ARE.
    const aspDaily =
      input.ancienneteMois >= MOIS_UN_AN
        ? Math.max(computeAspDaily(sjr, baremes.asp), areDaily)
        : areDaily;
    const aspDays = Math.min(unemploymentDays, ASP_MAX_DAYS);
    allocations = aspDaily * aspDays;

    // Post-CSP : bascule en ARE résiduelle si toujours au chômage après 12 mois.
    if (unemploymentDays > ASP_MAX_DAYS) {
      const residualDurationDays = Math.max(0, areDurationDays - ASP_MAX_DAYS);
      const areResidualDays = Math.min(unemploymentDays - ASP_MAX_DAYS, residualDurationDays);
      allocations += areDaily * areResidualDays;
    }
    preavisConserve = computePreavisKept(input, 'csp');
  } else {
    const deferralDays = computeAreDeferralDays(input, baremes.differe);
    const payableDays = Math.max(0, Math.min(unemploymentDays - deferralDays, areDurationDays));
    allocations = areDaily * payableDays;
    preavisConserve = computePreavisKept(input, 'are');
  }

  const total = allocations + preavisConserve + input.indemniteLicenciement;
  return {
    allocations,
    preavisConserve,
    indemniteLicenciement: input.indemniteLicenciement,
    total,
  };
}
