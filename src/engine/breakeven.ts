import { simulateScenario } from './simulate';
import type { Baremes, UserInput } from './types';

const STEP_MONTHS = 0.25;

/**
 * Mois de retour à l'emploi où le gagnant (CSP vs ARE) change.
 *
 * Approche (décision /plan-eng-review : pas d'algèbre par morceaux, on simule) : on
 * échantillonne `total(CSP) − total(ARE)` mois par mois et on repère les changements de
 * signe. Le point de croisement est interpolé linéairement entre deux échantillons.
 * Retourne 0, 1 ou 2 points selon le cas — c'est la « zone de bascule ».
 */
export function findBreakEvenMonths(
  input: UserInput,
  baremes: Baremes,
  maxMonths = 36,
): number[] {
  const diffAt = (month: number): number =>
    simulateScenario(input, baremes, 'csp', month).total -
    simulateScenario(input, baremes, 'are', month).total;

  const crossings: number[] = [];
  const steps = Math.round(maxMonths / STEP_MONTHS);
  let prevMonth = 0;
  let prevDiff = diffAt(0);

  for (let i = 1; i <= steps; i++) {
    const month = i * STEP_MONTHS;
    const diff = diffAt(month);
    const crossed =
      prevDiff !== 0 && diff !== 0 && Math.sign(diff) !== Math.sign(prevDiff);
    if (crossed) {
      const fraction = prevDiff / (prevDiff - diff);
      crossings.push(prevMonth + fraction * (month - prevMonth));
    }
    prevMonth = month;
    prevDiff = diff;
  }
  return crossings;
}
