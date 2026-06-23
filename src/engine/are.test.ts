import { describe, expect, test } from 'vitest';
import { computeAreDaily } from './are';
import type { Baremes } from './types';

// Fixture de barèmes pour les tests. Valeurs proches de 2026 mais INDÉPENDANTES des
// valeurs exactes encore à figer (partie fixe, plancher) : on teste la LOGIQUE de la
// formule, pas les constantes officielles. Les vraies valeurs vivront dans
// baremes-<dateEffet>.json (décision 4A) et seront couvertes par les cas golden.
const baremes: Baremes = {
  dateEffet: '2026-01-01',
  are: {
    tauxBas: { valeur: 0.404, source: 'test', libelle: 'taux bas 40,4%' },
    partieFixe: { valeur: 13.11, source: 'test', libelle: 'partie fixe €/j' },
    tauxHaut: { valeur: 0.57, source: 'test', libelle: 'taux haut 57%' },
    plafondPartSJR: { valeur: 0.75, source: 'test', libelle: 'plafond 75% du SJR' },
    plancherJournalier: { valeur: 31.97, source: 'test', libelle: 'plancher €/j' },
  },
};

describe('computeAreDaily', () => {
  test('retient 57% du SJR quand cette formule est la plus haute (salaire moyen)', () => {
    // SJR 100 €/j : formuleA = 0,404*100 + 13,11 = 53,51 ; formuleB = 0,57*100 = 57.
    // Le max est 57, sous le plafond (75) et au-dessus du plancher (31,97).
    expect(computeAreDaily(100, baremes.are)).toBeCloseTo(57, 2);
  });

  // Caractérisation : verrouille les autres branches de la formule.
  test('retient la formule partie-fixe quand elle est la plus haute (salaire bas)', () => {
    // SJR 50 : formuleA = 0,404*50 + 13,11 = 33,31 ; formuleB = 28,5. Max = 33,31,
    // au-dessus du plancher, sous le plafond (37,5).
    expect(computeAreDaily(50, baremes.are)).toBeCloseTo(33.31, 2);
  });

  test('applique le plancher journalier quand les deux formules sont en dessous', () => {
    // SJR 30 : formuleA = 25,23 mais plafonnée à 22,5 ; le plancher 31,97 prend le relais.
    expect(computeAreDaily(30, baremes.are)).toBeCloseTo(31.97, 2);
  });

  test('plafonne à 75% du SJR (isolé avec un plancher nul)', () => {
    // Avec un plancher à 0, le plafond devient observable : SJR 30, formuleA = 25,23,
    // plafond = 0,75*30 = 22,5 → résultat plafonné à 22,5.
    const sansPlancher: typeof baremes.are = {
      ...baremes.are,
      plancherJournalier: { valeur: 0, source: 'test', libelle: 'plancher neutralisé' },
    };
    expect(computeAreDaily(30, sansPlancher)).toBeCloseTo(22.5, 2);
  });
});
