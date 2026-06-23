import { describe, expect, test } from 'vitest';
import { computeSjr } from './sjr';

describe('computeSjr (cas standard : CDI continu, temps plein, sans interruption)', () => {
  test('convertit un salaire mensuel brut en salaire journalier de référence', () => {
    // Cas standard : SJR = salaire mensuel × 12 / 365. 2000 × 12 / 365 = 65,75 €/j.
    expect(computeSjr({ salaireBrutMensuel: 2000 })).toBeCloseTo(65.75, 2);
  });
});
