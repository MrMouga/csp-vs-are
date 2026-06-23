import type { Baremes } from './types';

/**
 * Barèmes officiels applicables aux contrats se terminant à partir du 1er janvier 2026.
 *
 * SOURCE DE VÉRITÉ : France Travail / Unédic (décision /plan-eng-review 6 & 9).
 *   [A] Unédic — Paramètres utiles, janvier 2026 (PDF, source réglementaire)
 *   [B] France Travail — Données À Connaître (DAC), 1er janvier 2026 (PDF)
 *   [C] France Travail — « Comment est calculé le montant de mon allocation ? »
 *
 * Conflits documentés (revue croisée) et arbitrages :
 * - Plafond ARE : 75% du SJR (Unédic [A], FT [C]) vs 70% (service-public F38881).
 *   → on retient 75% (Unédic fait autorité réglementaire).
 * - Partie fixe : 13,18 € [A]/[C] vs un typo « 13,19 » à l'intérieur du DAC [B].
 *   → on retient 13,18 €.
 * - Plafond ASP 2026 = 300,21 €/j [A] (le 294,40 €/j est la valeur 2025 périmée).
 */
export const baremes2026: Baremes = {
  dateEffet: '2026-01-01',
  are: {
    tauxBas: { valeur: 0.404, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'taux bas (40,4 % du SJR)' },
    partieFixe: { valeur: 13.18, source: 'Unédic Paramètres janv. 2026 [A] / FT [C]', libelle: 'partie fixe (13,18 €/j depuis le 01/07/2025)' },
    tauxHaut: { valeur: 0.57, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'taux haut (57 % du SJR)' },
    plafondPartSJR: { valeur: 0.75, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'plafond (75 % du SJR)' },
    plancherJournalier: { valeur: 32.13, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'allocation minimale (32,13 €/j)' },
  },
  asp: {
    taux: { valeur: 0.75, source: 'France Travail — CSP [B]', libelle: 'ASP = 75 % du SJR (ancienneté ≥ 1 an)' },
    plafondJournalier: { valeur: 300.21, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'plafond ASP (300,21 €/j = max ARE 2026)' },
    plancherJournalier: { valeur: 22.99, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'plancher ASP (22,99 €/j, et jamais < ARE)' },
  },
  duree: {
    moins55: { valeur: 548, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'durée max < 55 ans (548 j, coef 0,75 inclus)' },
    de55a56: { valeur: 685, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'durée max 55-56 ans (685 j)' },
    min57: { valeur: 822, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'durée max ≥ 57 ans (822 j)' },
  },
  differe: {
    delaiAttenteJours: { valeur: 7, source: 'France Travail — DAC [B]', libelle: 'délai d\'attente (7 j)' },
    plafondDiffereCpJours: { valeur: 30, source: 'France Travail — DAC [B]', libelle: 'différé congés payés (max 30 j)' },
    plafondDiffereSpecifiqueJours: { valeur: 75, source: 'France Travail — DAC [B]', libelle: 'différé spécifique max en licenciement économique (75 j)' },
    coefficientDiffereSpecifique: { valeur: 111.8, source: 'France Travail — DAC [B]', libelle: 'diviseur du différé spécifique (indemnités supra-légales ÷ 111,8)' },
  },
  net: {
    tauxCsg: { valeur: 0.062, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'CSG 6,2 % (base abattue 0,9825)' },
    tauxCrds: { valeur: 0.005, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'CRDS 0,5 % (base abattue 0,9825)' },
    tauxRetraiteComplementaire: { valeur: 0.03, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'retraite complémentaire 3 % du SJR' },
    seuilExonerationJournalier: { valeur: 61, source: 'Unédic Paramètres janv. 2026 [A]', libelle: 'seuil d\'exonération CSG/CRDS (61 €/j)' },
  },
};
