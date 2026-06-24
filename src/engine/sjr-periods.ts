import type { EmploymentPeriod } from './types';

const MS_PER_DAY = 86_400_000;

const parse = (d: string): Date => new Date(d + 'T00:00:00Z');

const daysInclusive = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

const daysInMonth = (year: number, monthIdx: number): number =>
  new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();

/**
 * Nombre de mois (prorata jour) couverts par l'intervalle [start, end] inclus.
 * Chaque mois calendaire compte pour (jours d'overlap / jours du mois) → un mois plein
 * vaut 1,0. C'est la base du "salaire de référence" (somme des bruts mensuels).
 */
function monthsFraction(start: Date, end: Date): number {
  let total = 0;
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  for (;;) {
    const monthStart = new Date(Date.UTC(y, m, 1));
    const monthEnd = new Date(Date.UTC(y, m + 1, 0));
    const ovStart = start > monthStart ? start : monthStart;
    const ovEnd = end < monthEnd ? end : monthEnd;
    if (ovStart <= ovEnd) total += daysInclusive(ovStart, ovEnd) / daysInMonth(y, m);
    if (y === end.getUTCFullYear() && m === end.getUTCMonth()) break;
    if (++m > 11) { m = 0; y++; }
  }
  return total;
}

/**
 * Salaire journalier de référence (SJR) calculé depuis les périodes d'emploi, sur la
 * fenêtre de référence (24 mois si < 55 ans, 36 mois si ≥ 55 ans, finissant à la
 * dernière fin de contrat).
 *
 * SJR = (somme des salaires bruts sur la fenêtre) / (jours calendaires d'emploi sur la
 * fenêtre). Les jours calendaires réels (années bissextiles incluses) rendent le calcul
 * conforme au centime au simulateur France Travail.
 */
export function computeSjrFromPeriods(
  periods: EmploymentPeriod[],
  age: number,
  dateReference?: string,
): number {
  if (periods.length === 0) return 0;
  const refMonths = age >= 55 ? 36 : 24;

  const lastEnd = dateReference
    ? parse(dateReference)
    : periods.map((p) => parse(p.dateFin)).reduce((a, b) => (a > b ? a : b));

  const startAbs = lastEnd.getUTCFullYear() * 12 + lastEnd.getUTCMonth() - refMonths + 1;
  const winStart = new Date(Date.UTC(Math.floor(startAbs / 12), startAbs % 12, 1));
  const winEnd = lastEnd;

  let salaireReference = 0;
  let jours = 0;
  for (const p of periods) {
    const ovStart = parse(p.dateDebut) > winStart ? parse(p.dateDebut) : winStart;
    const ovEnd = parse(p.dateFin) < winEnd ? parse(p.dateFin) : winEnd;
    if (ovStart > ovEnd) continue;
    salaireReference += p.salaireBrutMensuel * monthsFraction(ovStart, ovEnd);
    jours += daysInclusive(ovStart, ovEnd);
  }
  return jours > 0 ? salaireReference / jours : 0;
}
