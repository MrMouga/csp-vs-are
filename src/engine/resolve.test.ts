import { describe, expect, test } from 'vitest';
import { resolveInput, type ComparisonInput } from './resolve';
import { analyze } from './compare';
import { baremes2026 } from './baremes-2026';
import type { EmploymentPeriod } from './types';

// Reproduction EXACTE du cas du PDF France Travail.
const ftPeriod: EmploymentPeriod = {
  dateDebut: '2023-02-01',
  dateFin: '2025-12-31',
  salaireBrutMensuel: 3500,
  heuresHebdo: 35,
  motifFin: 'Licenciement économique',
  indemniteCongesPayes: 1300,
  indemniteRupture: 2500,
};

const ftInput: ComparisonInput = {
  age: 32,
  periods: [ftPeriod],
  preavisMois: 0,
  preavisPaye: false,
  syntec: false,
};

describe('resolveInput + analyze : conformité au simulateur France Travail', () => {
  test('ASP journalière = 86,18 €/j (PDF FT), ARE journalière = 65,5 €/j (PDF FT)', () => {
    const resolved = resolveInput(ftInput);
    const a = analyze(resolved, baremes2026);
    expect(a.aspDaily).toBeCloseTo(86.18, 1);
    expect(a.areDaily).toBeCloseTo(65.5, 1);
    expect(a.areDurationDays).toBe(548);
  });

  test('le SJR vient des jours calendaires réels (731 j, année bissextile)', () => {
    const resolved = resolveInput(ftInput);
    expect(resolved.sjr).toBeCloseTo(114.91, 1);
  });

  test('indemnité légale calculée auto, part supra-légale = rupture − légale', () => {
    const resolved = resolveInput(ftInput);
    // 35 mois ≈ 2,92 ans × 1/4 × 3500 ≈ 2552 € ; rupture 2500 < légale → supra-légal 0.
    expect(resolved.indemniteLicenciement).toBeGreaterThan(2400);
    expect(resolved.indemnitesSupraLegales).toBe(0);
  });

  test('l\'ancienneté de l\'indemnité légale inclut le préavis (R1234-1)', () => {
    const periods: EmploymentPeriod[] = [
      { dateDebut: '2024-01-01', dateFin: '2025-12-31', salaireBrutMensuel: 2000, heuresHebdo: 35, motifFin: 'Licenciement économique', indemniteCongesPayes: 0, indemniteRupture: 0 },
    ];
    const sansPreavis = resolveInput({ age: 40, periods, preavisMois: 0, preavisPaye: true, syntec: false });
    const avecPreavis = resolveInput({ age: 40, periods, preavisMois: 2, preavisPaye: true, syntec: false });
    // 24 mois → 1/4 × 2 ans × 2000 = 1000 € ; avec +2 mois de préavis = 26 mois → ~1083 €.
    expect(sansPreavis.indemniteLicenciement).toBeCloseTo(1000, 0);
    expect(avecPreavis.indemniteLicenciement).toBeGreaterThan(sansPreavis.indemniteLicenciement);
    expect(avecPreavis.indemniteLicenciement).toBeCloseTo(1083, 0);
  });
});
