import { describe, expect, test } from 'vitest';
import { computeAreDurationDays } from './duree';
import type { DureeBaremes } from './types';

const duree: DureeBaremes = {
  moins55: { valeur: 548, source: 'test', libelle: '< 55 ans' },
  de55a56: { valeur: 685, source: 'test', libelle: '55-56 ans' },
  min57: { valeur: 822, source: 'test', libelle: '≥ 57 ans' },
};

describe('computeAreDurationDays(age)', () => {
  test('moins de 55 ans → 548 jours', () => {
    expect(computeAreDurationDays(40, duree)).toBe(548);
  });

  test('54 ans (borne basse) → 548 jours', () => {
    expect(computeAreDurationDays(54, duree)).toBe(548);
  });

  test('55 ans → 685 jours', () => {
    expect(computeAreDurationDays(55, duree)).toBe(685);
  });

  test('56 ans → 685 jours', () => {
    expect(computeAreDurationDays(56, duree)).toBe(685);
  });

  test('57 ans → 822 jours', () => {
    expect(computeAreDurationDays(57, duree)).toBe(822);
  });

  test('62 ans → 822 jours', () => {
    expect(computeAreDurationDays(62, duree)).toBe(822);
  });
});
