import { describe, expect, test } from 'vitest';
import { computeIndemniteLegaleLicenciement, computeIndemniteRupture } from './indemnite';

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

describe('computeIndemniteRupture (Syntec ETAM / Cadre)', () => {
  test('hors Syntec → indemnité légale', () => {
    expect(computeIndemniteRupture(2000, 60, { syntec: false })).toBeCloseTo(
      computeIndemniteLegaleLicenciement(2000, 60), 0,
    );
  });

  test('Cadre Syntec : 1/3 de mois par année, plus favorable que le légal', () => {
    // 5 ans × 1/3 × 4000 = 6667 € (légal = 1/4 × 5 × 4000 = 5000 €).
    expect(computeIndemniteRupture(4000, 60, { syntec: true, statut: 'cadre' })).toBeCloseTo(6666.67, 0);
  });

  test('Cadre Syntec : pas de plafond depuis l\'avenant 46 (15 ans)', () => {
    // 15 ans × 1/3 × 4000 = 20000 € (aucun plafond).
    expect(computeIndemniteRupture(4000, 180, { syntec: true, statut: 'cadre' })).toBeCloseTo(20000, 0);
  });

  test('ETAM Syntec : 1/4 de mois/an, ≈ légal pour les cas courants (5 ans)', () => {
    expect(computeIndemniteRupture(2500, 60, { syntec: true, statut: 'etam' })).toBeCloseTo(3125, 0);
  });

  test('Syntec sous 2 ans → on retombe sur le légal', () => {
    // 18 mois : conventionnel Syntec = 0 ; légal = 1/4 × 1,5 × 3000 = 1125 €.
    expect(computeIndemniteRupture(3000, 18, { syntec: true, statut: 'cadre' })).toBeCloseTo(1125, 0);
  });
});
