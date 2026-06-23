import { computeSjr } from './sjr';
import { computeAspDaily } from './asp';
import { computeAreDaily } from './are';
import { computeAreDurationDays } from './duree';
import { computeNetDaily } from './net';
import { findBreakEvenMonths } from './breakeven';
import { simulateScenario, type ScenarioResult } from './simulate';
import type { Baremes, UserInput } from './types';

/** Base de mensualisation pour l'affichage (France Travail affiche daily × 30). */
const JOURS_MENSUALISATION = 30;
const MOIS_UN_AN = 12;
/** Tolérance (€) sous laquelle on considère les deux scénarios à égalité. */
const TOLERANCE_EGALITE = 1;

export type Winner = 'csp' | 'are' | 'egalite';

/** Faits stables du dossier, indépendants du scénario de retour à l'emploi. */
export interface Analysis {
  sjr: number;
  /** ASP journalière brute (≥ 1 an), plancher « ni < ARE » appliqué. */
  aspDaily: number;
  /** ARE journalière brute. */
  areDaily: number;
  /** ASP nette mensuelle estimée (décision 9, à côté du brut). */
  aspNetMonthly: number;
  /** ARE nette mensuelle estimée. */
  areNetMonthly: number;
  /** Durée maximale d'indemnisation ARE (jours) selon l'âge. */
  areDurationDays: number;
  /** Mois de retour à l'emploi où le gagnant change (zone de bascule). */
  breakEvenMonths: number[];
}

/** Comparaison pour un scénario de retour à l'emploi donné. */
export interface ComparisonAt {
  reemploymentMonths: number;
  csp: ScenarioResult;
  are: ScenarioResult;
  /** total(CSP) − total(ARE), en brut. > 0 ⇒ CSP devant. */
  differentialGross: number;
  winner: Winner;
}

export function analyze(input: UserInput, baremes: Baremes): Analysis {
  const sjr = computeSjr(input);
  const areDaily = computeAreDaily(sjr, baremes.are);
  const aspDaily =
    input.ancienneteMois >= MOIS_UN_AN
      ? Math.max(computeAspDaily(sjr, baremes.asp), areDaily)
      : areDaily;

  return {
    sjr,
    aspDaily,
    areDaily,
    aspNetMonthly: computeNetDaily(aspDaily, sjr, baremes) * JOURS_MENSUALISATION,
    areNetMonthly: computeNetDaily(areDaily, sjr, baremes) * JOURS_MENSUALISATION,
    areDurationDays: computeAreDurationDays(input.age, baremes.duree),
    breakEvenMonths: findBreakEvenMonths(input, baremes),
  };
}

export function compareAt(
  input: UserInput,
  baremes: Baremes,
  reemploymentMonths: number,
): ComparisonAt {
  const csp = simulateScenario(input, baremes, 'csp', reemploymentMonths);
  const are = simulateScenario(input, baremes, 'are', reemploymentMonths);
  const differentialGross = csp.total - are.total;

  let winner: Winner = 'egalite';
  if (differentialGross > TOLERANCE_EGALITE) winner = 'csp';
  else if (differentialGross < -TOLERANCE_EGALITE) winner = 'are';

  return { reemploymentMonths, csp, are, differentialGross, winner };
}
