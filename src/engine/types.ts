// Types du moteur CSP vs ARE.
// Décision /plan-eng-review 4A : chaque barème porte sa valeur ET sa source/explication
// dans la même structure datée → la transparence ne peut jamais dériver de la valeur.

/** Un barème = une valeur chiffrée + de quoi l'expliquer à l'écran (transparence). */
export interface BaremeValue {
  /** La valeur numérique utilisée par le moteur. */
  valeur: number;
  /** Source faisant autorité (ex. "France Travail — DAC 1er janvier 2026"). */
  source: string;
  /** Libellé lisible affiché dans la couche transparence. */
  libelle: string;
}

/** Barèmes de l'ARE (Allocation de Retour à l'Emploi). */
export interface AreBaremes {
  /** Taux bas de la formule (40,4 %). */
  tauxBas: BaremeValue;
  /** Partie fixe journalière ajoutée au taux bas (€/j). */
  partieFixe: BaremeValue;
  /** Taux haut de la formule (57 %). */
  tauxHaut: BaremeValue;
  /** Plafond d'indemnisation, exprimé en part du SJR (75 %). */
  plafondPartSJR: BaremeValue;
  /** Plancher journalier brut (€/j). */
  plancherJournalier: BaremeValue;
}

/** Barèmes de l'ASP (Allocation de Sécurisation Professionnelle, sous CSP). */
export interface AspBaremes {
  /** Taux appliqué au SJR pour une ancienneté ≥ 1 an (75 %). */
  taux: BaremeValue;
  /** Plafond journalier brut (€/j, ex. 294,40 = 4 × PMSS journalier 2026). */
  plafondJournalier: BaremeValue;
  /** Plancher journalier brut (€/j). */
  plancherJournalier: BaremeValue;
}

/**
 * Durées maximales d'indemnisation ARE par tranche d'âge (jours).
 * NB : ces valeurs intègrent déjà le coefficient contracyclique 0,75 le cas échéant
 * (correction Codex / référence section G) — ne pas le réappliquer.
 */
export interface DureeBaremes {
  /** Âge < 55 ans (548 jours). */
  moins55: BaremeValue;
  /** Âge 55-56 ans (685 jours). */
  de55a56: BaremeValue;
  /** Âge ≥ 57 ans (822 jours). */
  min57: BaremeValue;
}

/** Barèmes des différés / carence avant le début de l'ARE. */
export interface DiffereBaremes {
  /** Délai d'attente systématique (7 jours). */
  delaiAttenteJours: BaremeValue;
  /** Plafond du différé spécifique en licenciement économique (75 jours). */
  plafondDiffereSpecifiqueJours: BaremeValue;
  /** Diviseur € → jours pour le différé spécifique (indemnités supra-légales). */
  coefficientDiffereSpecifique: BaremeValue;
}

/** Jeu de barèmes daté par date de fin de contrat (décision 4A + correction Codex #6). */
export interface Baremes {
  /** Date de fin de contrat à partir de laquelle ces barèmes s'appliquent (ISO). */
  dateEffet: string;
  are: AreBaremes;
  asp: AspBaremes;
  duree: DureeBaremes;
  differe: DiffereBaremes;
}

/**
 * Entrée utilisateur (cas standard v1 : CDI, temps plein, licenciement économique,
 * sans interruption de carrière). Les cas hors périmètre sont écartés en amont par
 * l'écran d'éligibilité (décision 7), pas par le moteur.
 */
export interface UserInput {
  /** Salaire brut mensuel stable (€). */
  salaireBrutMensuel: number;
  /** Ancienneté dans l'entreprise (mois). */
  ancienneteMois: number;
  /** Âge en fin de contrat (années). */
  age: number;
  /** Indemnité légale de licenciement (€) — due dans les deux scénarios. */
  indemniteLicenciement: number;
  /** Indemnités supra-légales (€) — allongent le différé spécifique sous ARE. */
  indemnitesSupraLegales: number;
  /** Jours de congés payés non pris — alimentent le différé CP sous ARE. */
  joursCongesPayesNonPris: number;
  /** Durée du préavis (mois). */
  preavisMois: number;
}
