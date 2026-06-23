import { describe, expect, test } from 'vitest';
import { findBreakEvenMonths } from './breakeven';
import { simulateScenario } from './simulate';
import { baremesTest } from './baremes.fixture';
import type { UserInput } from './types';

const base: UserInput = {
  salaireBrutMensuel: 2000,
  ancienneteMois: 36,
  age: 40,
  indemniteLicenciement: 3000,
  indemnitesSupraLegales: 0,
  joursCongesPayesNonPris: 0,
  preavisMois: 2,
};

describe('findBreakEvenMonths', () => {
  test('préavis 1 mois : l\'ARE gagne tôt, le CSP gagne tard → un point de bascule existe', () => {
    const input = { ...base, preavisMois: 1 };
    // Vérifie la prémisse du test : ARE devant à 3 mois, CSP devant à 8 mois.
    const are3 = simulateScenario(input, baremesTest, 'are', 3);
    const csp3 = simulateScenario(input, baremesTest, 'csp', 3);
    const are8 = simulateScenario(input, baremesTest, 'are', 8);
    const csp8 = simulateScenario(input, baremesTest, 'csp', 8);
    expect(are3.total).toBeGreaterThan(csp3.total);
    expect(csp8.total).toBeGreaterThan(are8.total);

    const crossings = findBreakEvenMonths(input, baremesTest, 36);
    expect(crossings.length).toBeGreaterThanOrEqual(1);
    expect(crossings[0]).toBeGreaterThan(3);
    expect(crossings[0]).toBeLessThan(8);
  });

  test('préavis 2 mois : l\'ARE domine sur tout l\'horizon → aucun point de bascule', () => {
    const crossings = findBreakEvenMonths(base, baremesTest, 36);
    expect(crossings).toHaveLength(0);
  });
});
