/**
 * Écran d'éligibilité (décision /plan-eng-review 7 + tension cross-model 1).
 *
 * Le périmètre v1 couvre le CAS STANDARD : CDI, licenciement économique, temps plein,
 * sans droits chômage antérieurs, non-senior, salaire sous le seuil de dégressivité.
 * Tout cas hors périmètre reçoit un message explicite « vois ton conseiller » plutôt
 * qu'un faux chiffre — sur une décision irréversible, mieux vaut une honnête abstention.
 */

const AGE_SENIOR = 55;
const ANCIENNETE_MIN_MOIS = 12;
/** Seuil mensuel brut au-delà duquel la dégressivité s'applique (non modélisée en v1). */
const SEUIL_DEGRESSIVITE_MENSUEL = 4939.67;

export interface EligibilityInput {
  estCDI: boolean;
  motifEconomique: boolean;
  tempsPlein: boolean;
  pasDeDroitsAnterieurs: boolean;
  age: number;
  ancienneteMois: number;
  salaireBrutMensuel: number;
}

export interface EligibilityResult {
  eligible: boolean;
  /** Raisons (lisibles) pour lesquelles le cas sort du périmètre v1. */
  exclusions: string[];
}

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const exclusions: string[] = [];

  if (!input.estCDI) {
    exclusions.push('Cet outil ne couvre que les CDI. Pour un CDD ou un autre contrat, vois ton conseiller France Travail.');
  }
  if (!input.motifEconomique) {
    exclusions.push('Cet outil ne couvre que le licenciement pour motif économique (le seul qui ouvre le CSP).');
  }
  if (!input.tempsPlein) {
    exclusions.push('Le temps partiel change le calcul du SJR. Cet outil ne le modélise pas encore.');
  }
  if (!input.pasDeDroitsAnterieurs) {
    exclusions.push('Des droits chômage antérieurs (reliquat, rechargement) compliquent le calcul, non couvert en v1.');
  }
  if (input.age >= AGE_SENIOR) {
    exclusions.push('À partir de 55 ans, des règles spécifiques s\'appliquent (durées allongées, dégressivité). Vois ton conseiller.');
  }
  if (input.ancienneteMois < ANCIENNETE_MIN_MOIS) {
    exclusions.push('Avec moins d\'un an d\'ancienneté, l\'ASP est égale à l\'ARE : le choix se joue surtout sur le préavis. Cas non couvert en v1.');
  }
  if (input.salaireBrutMensuel >= SEUIL_DEGRESSIVITE_MENSUEL) {
    exclusions.push('Au-delà d\'environ 4 940 €/mois, l\'allocation devient dégressive après 6 mois. Non modélisé en v1.');
  }

  return { eligible: exclusions.length === 0, exclusions };
}
