import { describe, expect, test } from 'vitest';
import { computeSjrFromPeriods } from './sjr-periods';
import type { EmploymentPeriod } from './types';

function period(dateDebut: string, dateFin: string, salaireBrutMensuel: number): EmploymentPeriod {
  return { dateDebut, dateFin, salaireBrutMensuel, heuresHebdo: 35, motifFin: 'Licenciement économique', indemniteCongesPayes: 0, indemniteRupture: 0 };
}

describe('computeSjrFromPeriods (jours calendaires réels, conforme France Travail)', () => {
  test('cas réel France Travail : 3500 €/mois, 32 ans, période 01/02/2023→31/12/2025', () => {
    // Fenêtre de référence (< 55 ans) = 24 mois finissant le 31/12/2025 → 01/01/2024.
    // 2024 est bissextile : 01/01/2024 → 31/12/2025 = 731 jours.
    // SR = 3500 × 24 = 84 000 ; SJR = 84 000 / 731 = 114,91 € (et non 115,07 via ×12/365).
    const sjr = computeSjrFromPeriods([period('2023-02-01', '2025-12-31', 3500)], 32);
    expect(sjr).toBeCloseTo(114.91, 1);
    // C'est ce qui donne l'ASP = 0,75 × SJR = 86,18 €/j pile (PDF France Travail).
    expect(0.75 * sjr).toBeCloseTo(86.18, 1);
  });

  test('senior (≥ 55 ans) : fenêtre de référence de 36 mois', () => {
    // Période couvrant 36 mois pleins finissant le 31/12/2025 → 01/01/2023.
    const sjr = computeSjrFromPeriods([period('2022-06-01', '2025-12-31', 3000)], 57);
    // 01/01/2023 → 31/12/2025 = 1096 jours (2024 bissextile). SR = 3000 × 36 = 108 000.
    expect(sjr).toBeCloseTo(108000 / 1096, 1);
  });

  test('plusieurs périodes : SR et jours s\'additionnent', () => {
    const sjr = computeSjrFromPeriods(
      [period('2024-01-01', '2024-12-31', 2000), period('2025-01-01', '2025-12-31', 3000)],
      40,
    );
    // 2024 (2000×12) + 2025 (3000×12) = 24000 + 36000 = 60000 ; jours = 731.
    expect(sjr).toBeCloseTo(60000 / 731, 1);
  });
});
