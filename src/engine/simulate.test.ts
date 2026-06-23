import { describe, expect, test } from 'vitest';
import { simulateScenario } from './simulate';
import { baremesTest } from './baremes.fixture';
import type { UserInput } from './types';

// Cas standard : 2000 €/mois, 3 ans d'ancienneté, 40 ans, préavis 2 mois.
const input: UserInput = {
  salaireBrutMensuel: 2000,
  ancienneteMois: 36,
  age: 40,
  indemniteLicenciement: 3000,
  indemnitesSupraLegales: 0,
  joursCongesPayesNonPris: 0,
  preavisMois: 2,
};

describe('simulateScenario', () => {
  test('le CSP verse plus d\'allocation par mois que l\'ARE (75% vs 57%, sans différé)', () => {
    const csp = simulateScenario(input, baremesTest, 'csp', 6);
    const are = simulateScenario(input, baremesTest, 'are', 6);
    expect(csp.allocations).toBeGreaterThan(are.allocations);
  });

  test('le préavis : conservé en entier sous ARE, perdu sous CSP (≥1 an, préavis ≤ 3 mois)', () => {
    const csp = simulateScenario(input, baremesTest, 'csp', 6);
    const are = simulateScenario(input, baremesTest, 'are', 6);
    expect(are.preavisConserve).toBe(4000); // 2 mois × 2000
    expect(csp.preavisConserve).toBe(0);
  });

  test('au retour rapide (6 mois), l\'ARE peut gagner car le préavis conservé pèse plus que la prime ASP', () => {
    const csp = simulateScenario(input, baremesTest, 'csp', 6);
    const are = simulateScenario(input, baremesTest, 'are', 6);
    expect(are.total).toBeGreaterThan(csp.total);
  });

  test('post-CSP : après 12 mois, le CSP continue en ARE résiduelle (alloc à 18 mois > alloc à 12 mois)', () => {
    const a12 = simulateScenario(input, baremesTest, 'csp', 12);
    const a18 = simulateScenario(input, baremesTest, 'csp', 18);
    expect(a18.allocations).toBeGreaterThan(a12.allocations);
  });

  test('l\'ASP est plafonnée à 12 mois : pas d\'ASP au-delà, seulement l\'ARE résiduelle', () => {
    // À 24 mois, l'ASP (365 j) + l'ARE résiduelle (548-365=183 j) = 548 j payés au total.
    // L'alloc CSP à 24 mois doit être finie (pas illimitée).
    const a24 = simulateScenario(input, baremesTest, 'csp', 24);
    const a36 = simulateScenario(input, baremesTest, 'csp', 36);
    // Au-delà de l'épuisement (≈18 mois), plus rien ne s'ajoute.
    expect(a36.allocations).toBeCloseTo(a24.allocations, 0);
  });
});
