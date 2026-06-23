import { describe, expect, test } from 'vitest';
import { computeAspDaily } from './asp';
import type { AspBaremes } from './types';

const asp: AspBaremes = {
  taux: { valeur: 0.75, source: 'test', libelle: 'ASP 75% du SJR' },
  plafondJournalier: { valeur: 294.4, source: 'test', libelle: 'plafond €/j' },
  plancherJournalier: { valeur: 32.13, source: 'test', libelle: 'plancher €/j' },
};

describe('computeAspDaily (ancienneté ≥ 1 an)', () => {
  test('vaut 75% du SJR pour un salaire moyen', () => {
    // SJR 65,75 → 0,75 × 65,75 = 49,31 €/j, sous le plafond et au-dessus du plancher.
    expect(computeAspDaily(65.75, asp)).toBeCloseTo(49.31, 2);
  });

  test('plafonne au plafond journalier pour un très haut salaire', () => {
    // SJR 500 → 0,75 × 500 = 375 > 294,40 → plafonné à 294,40.
    expect(computeAspDaily(500, asp)).toBeCloseTo(294.4, 2);
  });

  test('applique le plancher journalier pour un très bas salaire', () => {
    // SJR 30 → 0,75 × 30 = 22,5 < plancher 32,13 → 32,13.
    expect(computeAspDaily(30, asp)).toBeCloseTo(32.13, 2);
  });
});
