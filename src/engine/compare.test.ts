import { describe, expect, test } from 'vitest';
import { analyze, compareAt } from './compare';
import { baremesTest } from './baremes.fixture';
import type { UserInput } from './types';

const input: UserInput = {
  salaireBrutMensuel: 2000,
  ancienneteMois: 36,
  age: 40,
  indemniteLicenciement: 3000,
  indemnitesSupraLegales: 0,
  joursCongesPayesNonPris: 0,
  preavisMois: 2,
};

describe('analyze', () => {
  test('expose le SJR, les allocations journalières et les points de bascule', () => {
    const a = analyze(input, baremesTest);
    expect(a.sjr).toBeCloseTo(65.75, 1);
    expect(a.aspDaily).toBeGreaterThan(a.areDaily); // ASP 75% > ARE 57%
    expect(a.areDurationDays).toBe(548); // < 55 ans
    expect(Array.isArray(a.breakEvenMonths)).toBe(true);
  });

  test('le net estimé est inférieur au brut pour chaque allocation', () => {
    const a = analyze(input, baremesTest);
    expect(a.aspNetMonthly).toBeLessThan(a.aspDaily * 30);
    expect(a.areNetMonthly).toBeLessThan(a.areDaily * 30);
  });
});

describe('compareAt', () => {
  test('au retour à 6 mois (préavis 2), l\'ARE gagne → winner = are, différentiel négatif', () => {
    const c = compareAt(input, baremesTest, 6);
    expect(c.winner).toBe('are');
    expect(c.differentialGross).toBeLessThan(0);
  });

  test('expose les totaux des deux scénarios', () => {
    const c = compareAt(input, baremesTest, 6);
    expect(c.csp.total).toBeGreaterThan(0);
    expect(c.are.total).toBeGreaterThan(0);
    expect(c.differentialGross).toBeCloseTo(c.csp.total - c.are.total, 5);
  });
});
