import type { EmploymentPeriod } from './types';

const parse = (d: string): Date => new Date(d + 'T00:00:00Z');

/** Salaire brut mensuel en vigueur au milieu du mois (year, monthIdx), 0 si non employé. */
function grossAtMonth(periods: EmploymentPeriod[], year: number, monthIdx: number): number {
  const mid = Date.UTC(year, monthIdx, 15);
  for (const p of periods) {
    if (parse(p.dateDebut).getTime() <= mid && mid <= parse(p.dateFin).getTime()) {
      return p.salaireBrutMensuel;
    }
  }
  return 0;
}

/**
 * Salaire de référence pour l'indemnité de licenciement (article R1234-4) :
 * le plus favorable entre
 *  (a) la moyenne mensuelle des 12 derniers mois (ou de tous les mois si service < 12),
 *  (b) le 1/3 des 3 derniers mois.
 *
 * Distinct du SJR de l'allocation chômage. Pour un salaire stable, les deux égalent le
 * salaire mensuel. La formule (b) capture une augmentation récente.
 *
 * NB : les primes annuelles/exceptionnelles ne sont pas modélisées séparément en v1
 * (seul le salaire mensuel de chaque période est pris).
 */
export function computeSalaireReferenceLicenciement(
  periods: EmploymentPeriod[],
  dateFin: string,
): number {
  const end = parse(dateFin);
  let y = end.getUTCFullYear();
  let m = end.getUTCMonth();
  const salaires: number[] = [];
  for (let i = 0; i < 12; i++) {
    const g = grossAtMonth(periods, y, m);
    if (g > 0) salaires.push(g);
    if (--m < 0) { m = 11; y--; }
  }
  if (salaires.length === 0) return periods[periods.length - 1]?.salaireBrutMensuel ?? 0;

  const moyenne12 = salaires.reduce((a, b) => a + b, 0) / salaires.length;
  const derniers3 = salaires.slice(0, 3);
  const tiers3 = derniers3.reduce((a, b) => a + b, 0) / Math.min(3, salaires.length);
  return Math.max(moyenne12, tiers3);
}
