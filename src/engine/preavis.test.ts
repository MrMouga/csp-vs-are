import { describe, expect, test } from 'vitest';
import { computePreavisKept } from './preavis';

const base = {
  salaireBrutMensuel: 2000,
  preavisMois: 2,
  ancienneteMois: 36, // ≥ 1 an
};

describe('computePreavisKept — indemnité de préavis effectivement conservée', () => {
  test('sous ARE : le salarié garde tout le préavis', () => {
    // 2 mois × 2000 = 4000 €.
    expect(computePreavisKept(base, 'are')).toBe(4000);
  });

  test('sous CSP (≥1 an, préavis ≤ 3 mois) : tout le préavis finance le CSP → 0 conservé', () => {
    // max(0, 2 - 3) = 0.
    expect(computePreavisKept(base, 'csp')).toBe(0);
  });

  test('sous CSP (≥1 an, préavis > 3 mois) : seul le surplus au-delà de 3 mois est conservé', () => {
    // préavis 4 mois → max(0, 4 - 3) = 1 mois × 2000 = 2000 €.
    expect(computePreavisKept({ ...base, preavisMois: 4 }, 'csp')).toBe(2000);
  });

  test('sous CSP (< 1 an) : le salarié garde tout le préavis (ASP = ARE)', () => {
    // ancienneté 6 mois → préavis conservé en entier sous CSP aussi.
    expect(computePreavisKept({ ...base, ancienneteMois: 6 }, 'csp')).toBe(4000);
  });
});
