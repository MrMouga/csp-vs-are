import './styles.css';
import { baremes2026 } from './engine/baremes-2026';
import { checkEligibility, type EligibilityInput } from './engine/eligibility';
import { analyze, compareAt } from './engine/compare';
import { computeAreDeferralDays } from './engine/differe';
import type { UserInput } from './engine/types';
import { buildSeries, renderChartSvg } from './ui/chart';
import { formatEuro, formatEuro2, escapeHtml } from './ui/format';

type Flags = Pick<EligibilityInput, 'estCDI' | 'motifEconomique' | 'tempsPlein' | 'pasDeDroitsAnterieurs'>;

interface Draft extends Flags {
  age: number;
  ancienneteMois: number;
  salaireBrutMensuel: number;
  indemniteLicenciement: number;
  indemnitesSupraLegales: number;
  joursCongesPayesNonPris: number;
  preavisMois: number;
}

const draft: Draft = {
  estCDI: true,
  motifEconomique: true,
  tempsPlein: true,
  pasDeDroitsAnterieurs: true,
  age: 40,
  ancienneteMois: 36,
  salaireBrutMensuel: 2200,
  indemniteLicenciement: 4000,
  indemnitesSupraLegales: 0,
  joursCongesPayesNonPris: 0,
  preavisMois: 2,
};

let step: 'wizard' | 'ineligible' | 'result' = 'wizard';
let currentMonths = 6;

const app = document.getElementById('app')!;
const disclaimer = `<div class="disclaimer"><strong>Estimation, pas une décision officielle.</strong>
  Cet outil t'aide à y voir clair, il ne remplace pas France Travail. Vérifie avec ton
  conseiller avant de signer. Barèmes 2026 (source : France Travail / Unédic).</div>`;

function flagButtons(field: keyof Flags, labelOui: string, labelNon: string): string {
  const v = draft[field];
  return `<div class="choice" data-flag="${field}">
    <button type="button" data-val="true" aria-pressed="${v}">${labelOui}</button>
    <button type="button" data-val="false" aria-pressed="${!v}">${labelNon}</button>
  </div>`;
}

function numberField(field: keyof Draft, label: string, hint: string, opts: { min?: number; step?: number } = {}): string {
  return `<label>${label}<span class="hint">${hint}</span></label>
    <input type="number" data-num="${field}" value="${draft[field]}" min="${opts.min ?? 0}" step="${opts.step ?? 1}" inputmode="decimal" />`;
}

function renderWizard(): void {
  app.innerHTML = `
    <h1>CSP ou ARE ?</h1>
    <p class="muted">Tu es licencié·e pour motif économique et tu as 21 jours pour choisir entre
      le <strong>CSP</strong> (allocation plus élevée, 12 mois) et l'<strong>ARE</strong> (plus faible,
      plus longue, mais tu gardes ton préavis). On le compare avec tes chiffres.</p>
    ${disclaimer}
    <div class="card">
      <h2>Ta situation</h2>
      <label>Es-tu en CDI ?</label>${flagButtons('estCDI', 'Oui', 'Non')}
      <label>Le licenciement est-il pour motif économique ?</label>${flagButtons('motifEconomique', 'Oui', 'Non')}
      <label>Étais-tu à temps plein ?</label>${flagButtons('tempsPlein', 'Oui', 'Non')}
      <label>Es-tu libre de tout droit chômage en cours (pas de reliquat) ?</label>${flagButtons('pasDeDroitsAnterieurs', 'Oui', 'Non')}
    </div>
    <div class="card">
      <h2>Tes chiffres</h2>
      ${numberField('salaireBrutMensuel', 'Salaire brut mensuel', 'Ton brut habituel, en euros.', { min: 0, step: 50 })}
      ${numberField('ancienneteMois', 'Ancienneté (en mois)', "Depuis combien de mois dans l'entreprise.", { min: 0 })}
      ${numberField('age', 'Âge', 'Ton âge à la fin du contrat.', { min: 18 })}
      ${numberField('preavisMois', 'Durée du préavis (mois)', 'Souvent 1, 2 ou 3 mois selon ta convention.', { min: 0, step: 1 })}
      ${numberField('indemniteLicenciement', 'Indemnité légale de licenciement (€)', 'Le montant prévu. Identique dans les deux cas.', { min: 0, step: 100 })}
      ${numberField('indemnitesSupraLegales', 'Indemnités supra-légales (€)', 'Au-delà du minimum légal. 0 si tu ne sais pas.', { min: 0, step: 100 })}
      ${numberField('joursCongesPayesNonPris', 'Jours de congés payés non pris', 'Allonge le délai avant l\'ARE. 0 si aucun.', { min: 0 })}
    </div>
    <button class="primary" id="go">Voir mon résultat</button>
    <footer>Aucune donnée n'est envoyée : tout le calcul se fait dans ton navigateur.</footer>
  `;

  app.querySelectorAll<HTMLDivElement>('[data-flag]').forEach((div) => {
    const field = div.dataset.flag as keyof Flags;
    div.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        draft[field] = btn.dataset.val === 'true';
        div.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      });
    });
  });
  app.querySelectorAll<HTMLInputElement>('[data-num]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const field = inp.dataset.num as keyof Draft;
      (draft[field] as number) = Number(inp.value) || 0;
    });
  });
  document.getElementById('go')!.addEventListener('click', submit);
}

function submit(): void {
  const elig = checkEligibility(draft);
  step = elig.eligible ? 'result' : 'ineligible';
  if (step === 'ineligible') renderIneligible(elig.exclusions);
  else renderResult();
  window.scrollTo(0, 0);
}

function renderIneligible(exclusions: string[]): void {
  app.innerHTML = `
    <h1>Ton cas sort du périmètre de cet outil</h1>
    <p>Pour rester juste, cet outil ne couvre que le cas standard. Le tien a une particularité
      qu'on ne sait pas (encore) calculer sans risque d'erreur — et sur une décision irréversible,
      mieux vaut une vraie réponse qu'un faux chiffre.</p>
    ${exclusions.map((e) => `<div class="exclusion">${escapeHtml(e)}</div>`).join('')}
    <div class="card">
      <h2>Ce que tu peux faire</h2>
      <p>Appelle ton conseiller France Travail (3949) ou prends rendez-vous : ils calculent
        ton cas précis. Tu peux aussi demander un accompagnement par un syndicat.</p>
    </div>
    <button class="primary" id="back">Modifier mes réponses</button>
  `;
  document.getElementById('back')!.addEventListener('click', () => { step = 'wizard'; renderWizard(); });
}

function userInput(): UserInput {
  return {
    salaireBrutMensuel: draft.salaireBrutMensuel,
    ancienneteMois: draft.ancienneteMois,
    age: draft.age,
    indemniteLicenciement: draft.indemniteLicenciement,
    indemnitesSupraLegales: draft.indemnitesSupraLegales,
    joursCongesPayesNonPris: draft.joursCongesPayesNonPris,
    preavisMois: draft.preavisMois,
  };
}

function verdictHtml(months: number): string {
  const input = userInput();
  const c = compareAt(input, baremes2026, months);
  const ecart = Math.abs(c.differentialGross);
  let phrase: string;
  if (c.winner === 'egalite') {
    phrase = `Si tu retrouves un emploi vers <strong>${months.toFixed(1)} mois</strong>, les deux options
      sont quasiment équivalentes (écart de quelques euros).`;
  } else {
    const gagnant = c.winner === 'csp' ? '<span class="csp">le CSP</span>' : '<span class="are">l\'ARE</span>';
    phrase = `Si tu retrouves un emploi vers <strong>${months.toFixed(1)} mois</strong>, ${gagnant}
      te rapporterait environ <strong>${formatEuro(ecart)} de plus</strong> au total.`;
  }
  const row = (label: string, csp: number, are: number, hint = '') =>
    `<tr><td>${label}${hint ? `<span class="src"> ${hint}</span>` : ''}</td>
      <td class="csp"><strong>${formatEuro(csp)}</strong></td>
      <td class="are"><strong>${formatEuro(are)}</strong></td></tr>`;

  return `<div class="verdict">${phrase}</div>
    <table class="figures breakdown">
      <thead><tr><th>D'où vient le total</th><th class="csp">CSP</th><th class="are">ARE</th></tr></thead>
      <tbody>
        ${row('Allocations chômage', c.csp.allocations, c.are.allocations, '(ASP 75% vs ARE 57%)')}
        ${row('Préavis conservé', c.csp.preavisConserve, c.are.preavisConserve, '(le CSP en sacrifie jusqu\'à 3 mois)')}
        ${row('Indemnité de licenciement', c.csp.indemniteLicenciement, c.are.indemniteLicenciement, '(identique)')}
        <tr class="total-row"><td><strong>Total</strong></td>
          <td class="csp"><strong>${formatEuro(c.csp.total)}</strong></td>
          <td class="are"><strong>${formatEuro(c.are.total)}</strong></td></tr>
      </tbody>
    </table>`;
}

function breakEvenSentence(months: number[]): string {
  if (months.length === 0) {
    const input = userInput();
    const sample = compareAt(input, baremes2026, 9);
    const who = sample.winner === 'are' ? "l'ARE" : 'le CSP';
    return `Sur tout l'horizon testé, <strong>${who}</strong> reste devant, quel que soit ton délai de retour à l'emploi.`;
  }
  const list = months.map((m) => `${m.toFixed(1)} mois`).join(' et ');
  return `Le gagnant <strong>change autour de ${list}</strong> : avant, c'est une option ; après, c'est l'autre.
    Déplace le curseur pour voir.`;
}

interface Figure {
  label: string;
  value: string;
  formula: string;
  source: string;
  note?: string;
}

function figures(): Figure[] {
  const input = userInput();
  const a = analyze(input, baremes2026);
  const b = baremes2026;
  const fa = b.are.tauxBas.valeur * a.sjr + b.are.partieFixe.valeur;
  const fb = b.are.tauxHaut.valeur * a.sjr;
  const differeJours = computeAreDeferralDays(input, b.differe);

  return [
    {
      label: 'Salaire journalier de référence (SJR)',
      value: formatEuro2(a.sjr),
      formula: `Salaire mensuel × 12 / 365 = ${formatEuro(input.salaireBrutMensuel)} × 12 / 365`,
      source: 'Règle France Travail pour un salaire stable (cas standard).',
    },
    {
      label: 'ASP journalière (allocation du CSP)',
      value: formatEuro2(a.aspDaily),
      formula: `75 % × SJR = 0,75 × ${formatEuro2(a.sjr)}`,
      source: b.asp.taux.source,
      note: 'Ancienneté ≥ 1 an. L\'ASP ne peut jamais être inférieure à l\'ARE.',
    },
    {
      label: 'ARE journalière',
      value: formatEuro2(a.areDaily),
      formula: `max(40,4 % × SJR + 13,18 ; 57 % × SJR) = max(${formatEuro2(fa)} ; ${formatEuro2(fb)})`,
      source: b.are.partieFixe.source,
      note: 'On garde le plus favorable des deux formules, plafonné à 75 % du SJR.',
    },
    {
      label: 'ASP nette mensuelle (estimation)',
      value: formatEuro(a.aspNetMonthly),
      formula: 'Brut journalier − retraite 3 % du SJR − (CSG 6,2 % + CRDS 0,5 %) si ≥ 61 €/j, puis × 30',
      source: b.net.tauxCsg.source,
      note: 'Estimation. Le chiffre canonique reste le brut.',
    },
    {
      label: 'ARE nette mensuelle (estimation)',
      value: formatEuro(a.areNetMonthly),
      formula: 'Même méthode que l\'ASP nette.',
      source: b.net.tauxCsg.source,
      note: 'Estimation. Les taux réduits de CSG ne sont pas modélisés.',
    },
    {
      label: 'Durée maximale de l\'ASP (CSP)',
      value: '12 mois (365 jours)',
      formula: 'Durée fixe du CSP.',
      source: b.asp.plafondJournalier.source,
      note: 'Après 12 mois, si tu es encore au chômage, tu bascules sur l\'ARE sans nouvelle carence (durée réduite des jours d\'ASP déjà consommés).',
    },
    {
      label: 'Durée maximale de l\'ARE',
      value: `${a.areDurationDays} jours (~${Math.round(a.areDurationDays / 30.42)} mois)`,
      formula: `Selon l'âge (${input.age} ans) : < 55 → 548 j ; 55-56 → 685 j ; ≥ 57 → 822 j`,
      source: b.duree.moins55.source,
      note: 'Coefficient 0,75 déjà inclus dans ces durées.',
    },
    {
      label: 'Délai avant le 1er versement de l\'ARE',
      value: `${differeJours} jours`,
      formula: '7 j de carence + différé congés payés (max 30 j) + différé spécifique (indemnités supra-légales ÷ 111,8, max 75 j en éco)',
      source: b.differe.delaiAttenteJours.source,
      note: 'Le CSP, lui, démarre sans aucun délai. C\'est l\'un des leviers de la bascule.',
    },
  ];
}

function figuresSection(): string {
  return figures()
    .map(
      (f) => `<details class="figure">
        <summary><span class="fig-label">${escapeHtml(f.label)}</span><span class="fig-val">${f.value}</span></summary>
        <div class="fig-body">
          <div><span class="fig-k">Calcul :</span> ${escapeHtml(f.formula)}</div>
          ${f.note ? `<div class="fig-note">${escapeHtml(f.note)}</div>` : ''}
          <div class="src">Source : ${escapeHtml(f.source)}</div>
        </div>
      </details>`,
    )
    .join('');
}

function renderResult(): void {
  const input = userInput();
  const a = analyze(input, baremes2026);
  const series = buildSeries(input, baremes2026, 30, 0.5);

  app.innerHTML = `
    <h1>Ton résultat</h1>
    ${disclaimer}
    <div class="card" id="verdict-card">${verdictHtml(currentMonths)}</div>
    <div class="card">
      <h2>La question qui change tout : dans combien de temps retrouves-tu un emploi ?</h2>
      <p class="muted" id="be-sentence">${breakEvenSentence(a.breakEvenMonths)}</p>
      <div class="slider-row">
        <input type="range" id="months" min="0" max="30" step="0.5" value="${currentMonths}" />
      </div>
      <div class="legend"><span class="l-csp">CSP</span><span class="l-are">ARE</span></div>
      <div id="chart">${renderChartSvg(series, currentMonths, a.breakEvenMonths)}</div>
      <details class="figure">
        <summary><span class="fig-label">Comment lire ce graphe ?</span></summary>
        <div class="fig-body">
          <div>Chaque courbe = le cash total que tu touches selon le moment où tu retrouves un emploi
            (horizontal). <span class="csp">Vert = CSP</span>, <span class="are">ambre = ARE</span>.</div>
          <div class="fig-note">La bande colorée sous le graphe montre qui gagne à chaque instant. Là où elle
            change de couleur, c'est le point de bascule. Déplace le curseur pour fixer ton hypothèse de retour à l'emploi.</div>
        </div>
      </details>
    </div>
    <div class="card">
      <h2>D'où viennent les chiffres</h2>
      <p class="muted">Clique sur un montant pour voir son calcul exact et sa source officielle.</p>
      ${figuresSection()}
    </div>
    <div class="print-only">
      <p>Document généré par un outil d'aide à la décision. Estimation non officielle, barèmes France Travail / Unédic 2026. Vérifier auprès de France Travail.</p>
    </div>
    <button class="primary no-print" id="print">Imprimer / enregistrer en PDF</button>
    <button class="link no-print" id="edit" style="margin-left:14px">Modifier mes réponses</button>
    <footer>Aucune donnée envoyée. Calcul local. Hypothèse du modèle : retour à l'emploi mesuré depuis la fin du contrat ; préavis et indemnité traités comme des sommes forfaitaires.</footer>
  `;

  const slider = document.getElementById('months') as HTMLInputElement;
  slider.addEventListener('input', () => {
    currentMonths = Number(slider.value);
    document.getElementById('verdict-card')!.innerHTML = verdictHtml(currentMonths);
    document.getElementById('chart')!.innerHTML = renderChartSvg(series, currentMonths, a.breakEvenMonths);
  });
  document.getElementById('print')!.addEventListener('click', () => window.print());
  document.getElementById('edit')!.addEventListener('click', () => { step = 'wizard'; renderWizard(); });
}

function render(): void {
  if (step === 'wizard') renderWizard();
  else if (step === 'ineligible') renderIneligible(checkEligibility(draft).exclusions);
  else renderResult();
}

render();
