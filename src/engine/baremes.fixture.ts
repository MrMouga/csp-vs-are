import type { Baremes } from './types';

/**
 * Barèmes de TEST (valeurs proches de 2026 mais non officielles). Sert à tester la
 * LOGIQUE du moteur indépendamment des valeurs exactes encore à figer sur France
 * Travail. Les vraies valeurs vivront dans baremes-<dateEffet>.json et seront couvertes
 * par les cas golden validés contre des exemples officiels.
 */
export const baremesTest: Baremes = {
  dateEffet: '2026-01-01',
  are: {
    tauxBas: { valeur: 0.404, source: 'test', libelle: 'taux bas 40,4%' },
    partieFixe: { valeur: 13.11, source: 'test', libelle: 'partie fixe €/j' },
    tauxHaut: { valeur: 0.57, source: 'test', libelle: 'taux haut 57%' },
    plafondPartSJR: { valeur: 0.75, source: 'test', libelle: 'plafond 75% du SJR' },
    plancherJournalier: { valeur: 31.97, source: 'test', libelle: 'plancher €/j' },
  },
  asp: {
    taux: { valeur: 0.75, source: 'test', libelle: 'ASP 75% du SJR' },
    plafondJournalier: { valeur: 300.21, source: 'test', libelle: 'plafond ASP €/j' },
    plancherJournalier: { valeur: 22.99, source: 'test', libelle: 'plancher ASP €/j' },
  },
  duree: {
    moins55: { valeur: 548, source: 'test', libelle: '< 55 ans' },
    de55a56: { valeur: 685, source: 'test', libelle: '55-56 ans' },
    min57: { valeur: 822, source: 'test', libelle: '≥ 57 ans' },
  },
  differe: {
    delaiAttenteJours: { valeur: 7, source: 'test', libelle: 'délai d\'attente 7 j' },
    plafondDiffereCpJours: { valeur: 30, source: 'test', libelle: 'plafond différé CP 30 j' },
    plafondDiffereSpecifiqueJours: { valeur: 75, source: 'test', libelle: 'plafond différé spécifique éco' },
    coefficientDiffereSpecifique: { valeur: 100, source: 'test', libelle: 'diviseur € → jours' },
  },
  net: {
    tauxCsg: { valeur: 0.062, source: 'test', libelle: 'CSG 6,2%' },
    tauxCrds: { valeur: 0.005, source: 'test', libelle: 'CRDS 0,5%' },
    tauxRetraiteComplementaire: { valeur: 0.03, source: 'test', libelle: 'retraite compl. 3% du SJR' },
    seuilExonerationJournalier: { valeur: 61, source: 'test', libelle: 'seuil CSG/CRDS 61 €/j' },
  },
};
