import type { Baremes } from './types';

/**
 * Estimation du montant NET journalier d'une allocation (ARE ou ASP).
 *
 * Calé sur le simulateur France Travail : le net affiché = brut − retraite
 * complémentaire (3 % du SJR), sans faire passer l'allocation sous son plancher.
 * Vérifié contre le PDF FT (ASP 86,18 brut → 82,73 net ; ARE 65,5 → 62,0).
 *
 * La CSG (6,2 %) et la CRDS (0,5 %) ne sont PAS appliquées par défaut : comme le
 * simulateur FT, on ne connaît pas le revenu fiscal de référence qui détermine le taux
 * (0 / 3,8 / 6,2 %). Le net réel peut donc être un peu plus bas selon ta situation
 * fiscale. Le chiffre canonique reste le brut.
 */
export function computeNetDaily(grossDaily: number, sjr: number, baremes: Baremes): number {
  const plancher = baremes.are.plancherJournalier.valeur;
  const retraite = baremes.net.tauxRetraiteComplementaire.valeur * sjr;
  return grossDaily >= plancher ? Math.max(grossDaily - retraite, plancher) : grossDaily;
}
