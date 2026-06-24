import { describe, expect, test } from 'vitest';
import { computeNetDaily } from './net';
import { baremesTest } from './baremes.fixture';

describe('computeNetDaily (calé sur le simulateur France Travail)', () => {
  test('GOLDEN FT : ASP 86,18 brut / SJR 114,91 → 82,73 net (retraite 3% du SJR)', () => {
    expect(computeNetDaily(86.18, 114.91, baremesTest)).toBeCloseTo(82.73, 1);
  });

  test('GOLDEN FT : ARE 65,5 brut / SJR 114,91 → 62,0 net', () => {
    expect(computeNetDaily(65.5, 114.91, baremesTest)).toBeCloseTo(62.05, 1);
  });

  test('la retraite ne fait pas passer sous le plancher', () => {
    // brut 33, SJR 100 : retraite 3 → 30, mais plancher (fixture 31,97) reprend le dessus.
    const plancher = baremesTest.are.plancherJournalier.valeur;
    expect(computeNetDaily(33, 100, baremesTest)).toBeCloseTo(plancher, 2);
  });

  test('le net est toujours ≤ au brut', () => {
    expect(computeNetDaily(57, 100, baremesTest)).toBeLessThanOrEqual(57);
  });
});
