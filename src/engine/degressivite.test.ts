import { describe, expect, test } from 'vitest';
import { computeAreAllocation } from './degressivite';
import { baremesTest } from './baremes.fixture';

const deg = baremesTest.degressivite;

describe('computeAreAllocation (dégressivité hauts salaires)', () => {
  test('SJR sous le seuil : pas de dégressivité, allocation pleine', () => {
    // SJR 100 < 162,40 → 50 €/j × 300 j = 15000.
    expect(computeAreAllocation(300, 50, 100, 40, deg)).toBeCloseTo(15000, 0);
  });

  test('SJR au-dessus du seuil, < 55 ans : réduction de 30% après 6 mois (plancher 92,57)', () => {
    // SJR 200, ARE 114 €/j, 365 j. 6 mois = 182,5 j pleins, le reste réduit.
    // réduit = max(114×0,7 ; 92,57) = max(79,8 ; 92,57) = 92,57.
    const seuilJours = 6 * (365 / 12);
    const attendu = 114 * seuilJours + 92.57 * (365 - seuilJours);
    expect(computeAreAllocation(365, 114, 200, 40, deg)).toBeCloseTo(attendu, 0);
    // Et c'est strictement moins que l'allocation pleine.
    expect(computeAreAllocation(365, 114, 200, 40, deg)).toBeLessThan(114 * 365);
  });

  test('≥ 55 ans : exempté de dégressivité (allocation pleine)', () => {
    expect(computeAreAllocation(365, 114, 200, 57, deg)).toBeCloseTo(114 * 365, 0);
  });

  test('retour rapide (< 6 mois) : pas encore de réduction même à haut salaire', () => {
    // 150 jours < 182,5 → tout au plein tarif.
    expect(computeAreAllocation(150, 114, 200, 40, deg)).toBeCloseTo(114 * 150, 0);
  });
});
