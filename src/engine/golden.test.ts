import { describe, expect, test } from 'vitest';
import { computeSjr } from './sjr';
import { computeAreDaily } from './are';
import { computeAspDaily } from './asp';
import { baremes2026 } from './baremes-2026';

/**
 * CAS GOLDEN BLOQUANTS (décision /plan-eng-review 5A).
 *
 * Validés contre des exemples chiffrés OFFICIELS (Unédic / France Travail). Si l'un
 * d'eux casse, la CI doit bloquer le déploiement : un calcul faux ne doit jamais
 * atteindre l'utilisateur.
 *
 * Oracle principal : Unédic — exemple « salaire 4 950 €/mois, 54 ans » :
 *   SR = 4 950 × 24 = 118 800 € ; diviseur 730 ; SJR = 163 € ; ARE/j = 163 × 57% = 92,77 €.
 *   https://www.unedic.org/l-assurance-chomage-et-vous/.../apres-le-6eme-mois-d-indemnisation
 */
describe('GOLDEN — conformité aux exemples officiels France Travail / Unédic', () => {
  test('Exemple Unédic A : 4 950 €/mois → SJR ≈ 162,74 → ARE ≈ 92,77 €/j (branche 57%)', () => {
    const sjr = computeSjr({ salaireBrutMensuel: 4950 });
    expect(sjr).toBeCloseTo(162.74, 1);
    expect(computeAreDaily(sjr, baremes2026.are)).toBeCloseTo(92.77, 1);
  });

  test('Exemple Unédic B (3 000 €/mois) : branche 57% l\'emporte sur la partie fixe', () => {
    // L'exemple pédagogique Unédic arrondit à SJR=100 → 57 €/j (base 30 jours).
    // Le calcul calendaire exact (×12/365) donne SJR≈98,63 → 56,2 €/j : on verrouille
    // la VALEUR EXACTE du moteur, en notant l'écart d'arrondi avec l'exemple.
    const sjr = computeSjr({ salaireBrutMensuel: 3000 });
    expect(sjr).toBeCloseTo(98.63, 1);
    expect(computeAreDaily(sjr, baremes2026.are)).toBeCloseTo(56.22, 1);
  });

  test('ASP = 75% du SJR (SJR 100 → 75 €/j), sous le plafond 300,21 et au-dessus de 22,99', () => {
    expect(computeAspDaily(100, baremes2026.asp)).toBeCloseTo(75, 2);
  });

  test('partie fixe 2026 = 13,18 € (et non 13,11 pré-réforme) : bas salaire prend la branche fixe', () => {
    // SJR 50 → max(0,404×50 + 13,18 ; 0,57×50) = max(33,38 ; 28,5) = 33,38 €/j.
    expect(computeAreDaily(50, baremes2026.are)).toBeCloseTo(33.38, 2);
  });
});
