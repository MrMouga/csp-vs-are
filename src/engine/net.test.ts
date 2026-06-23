import { describe, expect, test } from 'vitest';
import { computeNetDaily } from './net';
import { baremesTest } from './baremes.fixture';

describe('computeNetDaily (estimation, méthode France Travail)', () => {
  test('petite allocation (< 61 €/j) : exonérée de CSG/CRDS, seule la retraite est retirée', () => {
    // gross 40, SJR 70 : retraite = 3% × 70 = 2,10 → 37,90. Pas de CSG/CRDS (< 61).
    expect(computeNetDaily(40, 70, baremesTest)).toBeCloseTo(37.9, 2);
  });

  test('allocation ≥ 61 €/j : retraite (3% du SJR) puis CSG/CRDS sur base abattue 0,9825', () => {
    // gross 70,40, SJR 120 : retraite 3,60 → 66,80 ; CSG/CRDS = 66,80 × 0,9825 × 6,7%.
    const base = 66.8 * 0.9825;
    const expected = 66.8 - base * 0.067;
    expect(computeNetDaily(70.4, 120, baremesTest)).toBeCloseTo(expected, 2);
  });

  test('le net est toujours inférieur au brut', () => {
    expect(computeNetDaily(57, 100, baremesTest)).toBeLessThan(57);
  });
});
