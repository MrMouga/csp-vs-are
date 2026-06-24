import { describe, expect, test } from 'vitest';
import { computeAreAllocation, areReducedDaily } from './degressivite';
import { baremesTest } from './baremes.fixture';

const deg = baremesTest.degressivite;
const reduced = (d: number) => areReducedDaily(d, deg);

describe('computeAreAllocation (dégressivité hauts salaires)', () => {
  test('SJR sous le seuil : pas de dégressivité, allocation pleine', () => {
    expect(computeAreAllocation(300, 50, reduced(50), 100, 40, deg)).toBeCloseTo(15000, 0);
  });

  test('SJR au-dessus du seuil, < 55 ans : réduction après 6 mois (plancher 92,57)', () => {
    const seuilJours = 6 * (365 / 12);
    const attendu = 114 * seuilJours + 92.57 * (365 - seuilJours);
    expect(computeAreAllocation(365, 114, reduced(114), 200, 40, deg)).toBeCloseTo(attendu, 0);
    expect(computeAreAllocation(365, 114, reduced(114), 200, 40, deg)).toBeLessThan(114 * 365);
  });

  test('≥ 55 ans : exempté (allocation pleine)', () => {
    expect(computeAreAllocation(365, 114, reduced(114), 200, 57, deg)).toBeCloseTo(114 * 365, 0);
  });

  test('retour rapide (< 6 mois) : pas encore de réduction', () => {
    expect(computeAreAllocation(150, 114, reduced(114), 200, 40, deg)).toBeCloseTo(114 * 150, 0);
  });

  test('areReducedDaily : −30 % planché à 92,57', () => {
    expect(reduced(114)).toBeCloseTo(92.57, 2); // 79,8 < 92,57 → plancher
    expect(reduced(200)).toBeCloseTo(140, 2);    // 200×0,7 = 140 > plancher
  });
});
