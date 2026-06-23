import { describe, expect, test } from 'vitest';
import { computeAreDeferralDays } from './differe';
import type { DiffereBaremes } from './types';

const differe: DiffereBaremes = {
  delaiAttenteJours: { valeur: 7, source: 'test', libelle: 'délai d\'attente 7 j' },
  plafondDiffereCpJours: { valeur: 30, source: 'test', libelle: 'plafond différé CP 30 j' },
  plafondDiffereSpecifiqueJours: { valeur: 75, source: 'test', libelle: 'plafond différé spécifique éco' },
  coefficientDiffereSpecifique: { valeur: 100, source: 'test', libelle: 'diviseur € → jours' },
};

describe('computeAreDeferralDays (jours avant le 1er versement ARE)', () => {
  test('cas standard sans CP ni supra-légal → seulement le délai d\'attente de 7 jours', () => {
    expect(
      computeAreDeferralDays({ joursCongesPayesNonPris: 0, indemnitesSupraLegales: 0 }, differe),
    ).toBe(7);
  });

  test('ajoute le différé congés payés', () => {
    // 10 jours de CP + 7 j d'attente = 17.
    expect(
      computeAreDeferralDays({ joursCongesPayesNonPris: 10, indemnitesSupraLegales: 0 }, differe),
    ).toBe(17);
  });

  test('ajoute le différé spécifique (supra-légal / coefficient)', () => {
    // 3000 € / 100 = 30 jours de différé spécifique + 7 = 37.
    expect(
      computeAreDeferralDays({ joursCongesPayesNonPris: 0, indemnitesSupraLegales: 3000 }, differe),
    ).toBe(37);
  });

  test('plafonne le différé spécifique à 75 jours (licenciement économique)', () => {
    // 10000 € / 100 = 100 jours → plafonné à 75 ; + 7 = 82.
    expect(
      computeAreDeferralDays({ joursCongesPayesNonPris: 0, indemnitesSupraLegales: 10000 }, differe),
    ).toBe(82);
  });

  test('plafonne le différé congés payés à 30 jours', () => {
    // 50 jours de CP demandés → plafonnés à 30 ; + 7 = 37.
    expect(
      computeAreDeferralDays({ joursCongesPayesNonPris: 50, indemnitesSupraLegales: 0 }, differe),
    ).toBe(37);
  });
});
