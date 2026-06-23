/**
 * Salaire journalier de référence (SJR) — cas standard v1.
 *
 * Périmètre v1 (décision /plan-eng-review 7) : CDI continu, temps plein, sans
 * interruption sur la période de référence. Dans ce cas, le salaire de référence est
 * un salaire mensuel stable, et le SJR ≈ salaire mensuel × 12 / 365.
 *
 * Hors périmètre v1 (gérés par l'écran d'éligibilité, PAS ici) : interruptions entre
 * contrats (règle des 70% de jours non travaillés depuis le 1er avril 2025), temps
 * partiel, primes variables, suspensions. Ces cas renvoient "hors périmètre", jamais
 * un faux SJR.
 */

const JOURS_PAR_AN = 365;
const MOIS_PAR_AN = 12;

export interface SjrInput {
  /** Salaire brut mensuel stable sur la période de référence (€). */
  salaireBrutMensuel: number;
}

export function computeSjr(input: SjrInput): number {
  return (input.salaireBrutMensuel * MOIS_PAR_AN) / JOURS_PAR_AN;
}
