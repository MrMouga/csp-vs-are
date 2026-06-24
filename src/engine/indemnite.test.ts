import { describe, expect, test } from 'vitest';
import { computeIndemniteLegaleLicenciement } from './indemnite';

describe('computeIndemniteLegaleLicenciement', () => {
  test('1/4 de mois par an pour les 10 premières années', () => {
    // 3 ans × 2000 € × 1/4 = 1500 €.
    expect(computeIndemniteLegaleLicenciement(2000, 36)).toBeCloseTo(1500, 0);
  });

  test('1/3 de mois par an au-delà de 10 ans', () => {
    // 12 ans : 10 × 1/4 + 2 × 1/3 = 2,5 + 0,667 = 3,167 mois × 2000 = 6333 €.
    expect(computeIndemniteLegaleLicenciement(2000, 144)).toBeCloseTo(6333.33, 0);
  });

  test('proratisé pour une année partielle', () => {
    // 18 mois = 1,5 an × 1/4 × 2000 = 750 €.
    expect(computeIndemniteLegaleLicenciement(2000, 18)).toBeCloseTo(750, 0);
  });

  test('nulle en dessous de 8 mois d\'ancienneté (pas légalement due)', () => {
    expect(computeIndemniteLegaleLicenciement(2000, 6)).toBe(0);
  });
});
