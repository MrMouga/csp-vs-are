import { describe, expect, test } from 'vitest';
import { computeSalaireReferenceLicenciement } from './salaire-reference';
import type { EmploymentPeriod } from './types';

function period(dateDebut: string, dateFin: string, salaireBrutMensuel: number): EmploymentPeriod {
  return { dateDebut, dateFin, salaireBrutMensuel, heuresHebdo: 35, motifFin: 'Licenciement économique', indemniteCongesPayes: 0, indemniteRupture: 0 };
}

describe('computeSalaireReferenceLicenciement (R1234-4)', () => {
  test('salaire stable : référence = salaire mensuel', () => {
    expect(computeSalaireReferenceLicenciement([period('2023-01-01', '2025-12-31', 3500)], '2025-12-31')).toBe(3500);
  });

  test('augmentation récente : le 1/3 des 3 derniers mois l\'emporte', () => {
    // 3000 jusqu'à sept. 2025, 4000 sur oct-nov-déc 2025.
    const periods = [period('2024-01-01', '2025-09-30', 3000), period('2025-10-01', '2025-12-31', 4000)];
    // moyenne 12 mois = (9×3000 + 3×4000) / 12 = 3250 ; 1/3 des 3 derniers = 4000.
    expect(computeSalaireReferenceLicenciement(periods, '2025-12-31')).toBeCloseTo(4000, 0);
  });

  test('baisse récente : la moyenne 12 mois protège', () => {
    // 4000 jusqu'à sept., 3000 sur oct-déc. moyenne = (9×4000 + 3×3000)/12 = 3750 ; 1/3 = 3000.
    const periods = [period('2024-01-01', '2025-09-30', 4000), period('2025-10-01', '2025-12-31', 3000)];
    expect(computeSalaireReferenceLicenciement(periods, '2025-12-31')).toBeCloseTo(3750, 0);
  });

  test('service < 12 mois : moyenne sur les mois travaillés', () => {
    // 6 mois à 2500 → référence 2500.
    expect(computeSalaireReferenceLicenciement([period('2025-07-01', '2025-12-31', 2500)], '2025-12-31')).toBeCloseTo(2500, 0);
  });
});
