import { describe, expect, test } from 'vitest';
import { checkEligibility } from './eligibility';

const standard = {
  estCDI: true,
  motifEconomique: true,
  tempsPlein: true,
  pasDeDroitsAnterieurs: true,
  age: 40,
  ancienneteMois: 36,
  salaireBrutMensuel: 2000,
};

describe('checkEligibility (périmètre v1 = cas standard)', () => {
  test('cas standard → éligible, aucune exclusion', () => {
    const r = checkEligibility(standard);
    expect(r.eligible).toBe(true);
    expect(r.exclusions).toHaveLength(0);
  });

  test('senior (≥ 55 ans) → hors périmètre', () => {
    const r = checkEligibility({ ...standard, age: 57 });
    expect(r.eligible).toBe(false);
    expect(r.exclusions.join(' ')).toMatch(/55/);
  });

  test('temps partiel → hors périmètre', () => {
    expect(checkEligibility({ ...standard, tempsPlein: false }).eligible).toBe(false);
  });

  test('haut salaire (dégressivité non modélisée) → hors périmètre', () => {
    expect(checkEligibility({ ...standard, salaireBrutMensuel: 5200 }).eligible).toBe(false);
  });

  test('rupture non économique → hors périmètre', () => {
    expect(checkEligibility({ ...standard, motifEconomique: false }).eligible).toBe(false);
  });

  test('plusieurs problèmes → toutes les exclusions sont listées', () => {
    const r = checkEligibility({ ...standard, tempsPlein: false, estCDI: false });
    expect(r.exclusions.length).toBeGreaterThanOrEqual(2);
  });
});
