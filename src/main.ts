import './styles.css';
import { baremes2026 } from './engine/baremes-2026';
import { checkEligibility } from './engine/eligibility';
import { analyze, compareAt } from './engine/compare';
import { computeAreDeferralDays } from './engine/differe';
import { computeIndemniteLegaleLicenciement } from './engine/indemnite';
import { resolveInput, type ComparisonInput } from './engine/resolve';
import type { EmploymentPeriod, UserInput } from './engine/types';
import { buildSeries, renderChartSvg } from './ui/chart';
import { formatEuro, formatEuro2, escapeHtml } from './ui/format';

// ---------------------------------------------------------------------------
// État de l'application (machine à étapes)
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4;
const STEP_LABELS = ['Situation', 'Périodes d\'emploi', 'Préavis', 'Résultat'];
const MOTIFS = [
  'Licenciement économique',
  'Licenciement (autre motif)',
  'Fin de CDD / mission',
  'Rupture conventionnelle',
  'Autre',
];

const situation = {
  estCDI: true,
  motifEconomique: true,
  tempsPlein: true,
  pasDeDroitsAnterieurs: true,
  age: 32,
};

function newPeriod(): EmploymentPeriod {
  return {
    dateDebut: '2023-02-01',
    dateFin: '2025-12-31',
    salaireBrutMensuel: 2500,
    heuresHebdo: 35,
    motifFin: 'Licenciement économique',
    indemniteCongesPayes: 0,
    indemniteRupture: 0,
  };
}

let periods: EmploymentPeriod[] = [newPeriod()];
const preavis = { preavisMois: 1, preavisPaye: true };

let step: Step = 1;
let editing: number | null = null; // index de période en édition (null = aucune)
let editDraft: EmploymentPeriod | null = null;
let stepError = '';
let currentMonths = 6;

const app = document.getElementById('app')!;

const disclaimer = `<div class="disclaimer"><strong>Estimation, pas une décision officielle.</strong>
  Cet outil t'aide à y voir clair, il ne remplace pas France Travail. Vérifie avec ton
  conseiller avant de signer. Barèmes 2026 (source : France Travail / Unédic).</div>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function monthsInclusive(debut: string, fin: string): number {
  const d = new Date(debut + 'T00:00:00Z');
  const f = new Date(fin + 'T00:00:00Z');
  if (isNaN(d.getTime()) || isNaN(f.getTime())) return 0;
  return f.getUTCFullYear() * 12 + f.getUTCMonth() - (d.getUTCFullYear() * 12 + d.getUTCMonth()) + 1;
}

function comparisonInput(): ComparisonInput {
  return { age: situation.age, periods, preavisMois: preavis.preavisMois, preavisPaye: preavis.preavisPaye };
}
function resolved(): UserInput {
  return resolveInput(comparisonInput());
}

function progressBar(): string {
  return `<nav class="steps" aria-label="Étapes">${STEP_LABELS.map((label, i) => {
    const n = (i + 1) as Step;
    const cls = n === step ? 'cur' : n < step ? 'done' : 'todo';
    const clickable = n < step;
    return `<button class="stepdot ${cls}" ${clickable ? `data-goto="${n}"` : 'disabled'}>
      <span class="num">${n}</span><span class="lbl">${label}</span></button>`;
  }).join('<span class="steparrow">›</span>')}</nav>`;
}

function numberField(value: number, attr: string, label: string, hint: string, opts: { min?: number; step?: number } = {}): string {
  return `<label>${label}<span class="hint">${hint}</span></label>
    <input type="number" ${attr} value="${value}" min="${opts.min ?? 0}" step="${opts.step ?? 1}" inputmode="decimal" />`;
}

function flagButtons(field: keyof typeof situation, labelOui: string, labelNon: string): string {
  const v = situation[field];
  return `<div class="choice" data-flag="${field}">
    <button type="button" data-val="true" aria-pressed="${v}">${labelOui}</button>
    <button type="button" data-val="false" aria-pressed="${!v}">${labelNon}</button>
  </div>`;
}

// ---------------------------------------------------------------------------
// Étape 1 — Situation
// ---------------------------------------------------------------------------

function renderSituation(): void {
  app.innerHTML = `
    <h1>CSP ou ARE ?</h1>
    <p class="muted">Licencié·e pour motif économique, tu as 21 jours pour choisir entre le
      <strong>CSP</strong> (allocation plus élevée, 12 mois) et l'<strong>ARE</strong> (plus faible,
      plus longue, mais tu gardes ton préavis). On le compare avec tes chiffres.</p>
    ${disclaimer}
    ${progressBar()}
    ${stepError ? `<div class="exclusion" role="alert">${escapeHtml(stepError)}</div>` : ''}
    <div class="card">
      <h2>1. Ta situation</h2>
      <label>Es-tu en CDI ?</label>${flagButtons('estCDI', 'Oui', 'Non')}
      <label>Le licenciement est-il pour motif économique ?</label>${flagButtons('motifEconomique', 'Oui', 'Non')}
      <label>Étais-tu à temps plein ?</label>${flagButtons('tempsPlein', 'Oui', 'Non')}
      <label>Es-tu libre de tout droit chômage en cours (pas de reliquat) ?</label>${flagButtons('pasDeDroitsAnterieurs', 'Oui', 'Non')}
      ${numberField(situation.age, 'data-age', 'Ton âge à la fin du contrat', 'Change la durée d\'indemnisation et la période de référence.', { min: 16 })}
    </div>
    <button class="primary" data-next="2">Continuer</button>
    <footer>Aucune donnée n'est envoyée : tout le calcul se fait dans ton navigateur.</footer>
  `;
  app.querySelectorAll<HTMLDivElement>('[data-flag]').forEach((div) => {
    const field = div.dataset.flag as keyof typeof situation;
    div.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        (situation[field] as boolean) = btn.dataset.val === 'true';
        div.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      });
    });
  });
  app.querySelector<HTMLInputElement>('[data-age]')!.addEventListener('input', (e) => {
    situation.age = Number((e.target as HTMLInputElement).value) || 0;
  });
  wireNav();
}

// ---------------------------------------------------------------------------
// Étape 2 — Périodes d'emploi
// ---------------------------------------------------------------------------

function periodCard(p: EmploymentPeriod, i: number): string {
  const mois = monthsInclusive(p.dateDebut, p.dateFin);
  return `<div class="period">
    <div class="period-head">
      <strong>Période ${i + 1}</strong>
      <span class="muted">${p.dateDebut} → ${p.dateFin} (${mois} mois)</span>
    </div>
    <div class="muted">${formatEuro(p.salaireBrutMensuel)}/mois · ${p.heuresHebdo}h/sem · ${escapeHtml(p.motifFin)}</div>
    <div class="muted">CP ${formatEuro(p.indemniteCongesPayes)} · rupture ${formatEuro(p.indemniteRupture)}</div>
    <div class="period-actions">
      <button class="link" data-edit="${i}">Modifier</button>
      ${periods.length > 1 ? `<button class="link danger" data-del="${i}">Supprimer</button>` : ''}
    </div>
  </div>`;
}

function periodForm(): string {
  const p = editDraft!;
  const mois = monthsInclusive(p.dateDebut, p.dateFin);
  const estimLegale = computeIndemniteLegaleLicenciement(p.salaireBrutMensuel, mois);
  return `<div class="card period-form">
    <h2>${editing === periods.length ? 'Ajouter une période' : 'Modifier la période'}</h2>
    <div class="grid2">
      <div><label>Début du contrat<span class="hint">JJ/MM/AAAA</span></label><input type="date" data-p="dateDebut" value="${p.dateDebut}" /></div>
      <div><label>Fin du contrat<span class="hint">${mois} mois</span></label><input type="date" data-p="dateFin" value="${p.dateFin}" /></div>
    </div>
    ${numberField(p.salaireBrutMensuel, 'data-p="salaireBrutMensuel"', 'Salaire brut mensuel', 'Ton brut habituel sur cette période.', { step: 50 })}
    ${numberField(p.heuresHebdo, 'data-p="heuresHebdo"', 'Horaire hebdomadaire', '35 = temps plein.', { step: 1 })}
    <label>Motif de fin de contrat</label>
    <select data-p="motifFin">${MOTIFS.map((m) => `<option ${m === p.motifFin ? 'selected' : ''}>${m}</option>`).join('')}</select>
    ${numberField(p.indemniteCongesPayes, 'data-p="indemniteCongesPayes"', 'Indemnité de congés payés (€)', 'Reportée sur ta fin de contrat. 0 si aucune.', { step: 100 })}
    ${numberField(p.indemniteRupture, 'data-p="indemniteRupture"', 'Indemnité de rupture (€)', `Estimation légale : ${formatEuro(estimLegale)} — modifiable si tu connais le montant réel.`, { step: 100 })}
    <div class="period-actions">
      <button class="primary" data-savep>Valider la période</button>
      <button class="link" data-cancelp>Annuler</button>
      <button class="link" data-useauto>Utiliser l'estimation légale (${formatEuro(estimLegale)})</button>
    </div>
  </div>`;
}

function renderPeriods(): void {
  const editingForm = editing !== null;
  app.innerHTML = `
    <h1>CSP ou ARE ?</h1>
    ${progressBar()}
    ${stepError ? `<div class="exclusion" role="alert">${escapeHtml(stepError)}</div>` : ''}
    <div class="card">
      <h2>2. Tes périodes d'emploi</h2>
      <p class="muted">Renseigne tes emplois salariés sur les
        <strong>${situation.age >= 55 ? 36 : 24} derniers mois</strong> avant ta fin de contrat.
        Le calcul du SJR (et donc de l'allocation) en dépend.</p>
      ${periods.map(periodCard).join('')}
      ${editingForm ? '' : '<button class="link add" data-addp>+ Ajouter une période</button>'}
    </div>
    ${editingForm ? periodForm() : ''}
    ${editingForm ? '' : `<div class="navrow">
      <button class="link" data-next="1">‹ Retour</button>
      <button class="primary" data-next="3">Continuer</button>
    </div>`}
  `;
  app.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => { editing = Number(b.dataset.edit); editDraft = { ...periods[editing]! }; renderPeriods(); }));
  app.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => { periods.splice(Number(b.dataset.del), 1); renderPeriods(); }));
  app.querySelector('[data-addp]')?.addEventListener('click', () => { editing = periods.length; editDraft = newPeriod(); renderPeriods(); });

  if (editingForm) {
    app.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-p]').forEach((el) => {
      el.addEventListener('input', () => {
        const field = el.dataset.p as keyof EmploymentPeriod;
        const val = el.tagName === 'SELECT' || (el as HTMLInputElement).type === 'date' ? el.value : Number(el.value) || 0;
        (editDraft as unknown as Record<string, unknown>)[field] = val;
        // Met à jour l'estimation légale affichée quand dates/salaire changent.
        if (field === 'dateDebut' || field === 'dateFin' || field === 'salaireBrutMensuel') refreshEstim();
      });
    });
    app.querySelector('[data-savep]')!.addEventListener('click', savePeriod);
    app.querySelector('[data-cancelp]')!.addEventListener('click', () => { editing = null; editDraft = null; renderPeriods(); });
    app.querySelector('[data-useauto]')!.addEventListener('click', () => {
      const mois = monthsInclusive(editDraft!.dateDebut, editDraft!.dateFin);
      editDraft!.indemniteRupture = Math.round(computeIndemniteLegaleLicenciement(editDraft!.salaireBrutMensuel, mois));
      renderPeriods();
    });
  }
  wireNav();
}

function refreshEstim(): void {
  // Re-render léger : on régénère le formulaire pour mettre à jour le hint d'estimation.
  if (editing !== null) renderPeriods();
}

function savePeriod(): void {
  const p = editDraft!;
  if (!p.dateDebut || !p.dateFin || !(p.salaireBrutMensuel > 0) || monthsInclusive(p.dateDebut, p.dateFin) <= 0) {
    stepError = 'Vérifie les dates (la fin doit suivre le début) et le salaire (> 0).';
    renderPeriods();
    return;
  }
  stepError = '';
  if (editing === periods.length) periods.push(p);
  else periods[editing!] = p;
  editing = null;
  editDraft = null;
  renderPeriods();
}

// ---------------------------------------------------------------------------
// Étape 3 — Préavis
// ---------------------------------------------------------------------------

function renderPreavis(): void {
  app.innerHTML = `
    <h1>CSP ou ARE ?</h1>
    ${progressBar()}
    <div class="card">
      <h2>3. Ton préavis</h2>
      <p class="muted">Le sort du préavis est le levier qui fait souvent basculer le choix.</p>
      ${numberField(preavis.preavisMois, 'data-preavis', 'Durée du préavis (mois)', 'Souvent 1, 2 ou 3 mois selon ta convention.', { step: 1 })}
      <label>Le préavis est-il non effectué et payé (indemnité compensatrice) ?</label>
      <div class="choice" data-ppaye>
        <button type="button" data-val="true" aria-pressed="${preavis.preavisPaye}">Oui</button>
        <button type="button" data-val="false" aria-pressed="${!preavis.preavisPaye}">Non</button>
      </div>
    </div>
    <div class="navrow">
      <button class="link" data-next="2">‹ Retour</button>
      <button class="primary" data-result>Voir mon résultat</button>
    </div>
  `;
  app.querySelector<HTMLInputElement>('[data-preavis]')!.addEventListener('input', (e) => {
    preavis.preavisMois = Number((e.target as HTMLInputElement).value) || 0;
  });
  const grp = app.querySelector('[data-ppaye]')!;
  grp.querySelectorAll('button').forEach((btn) =>
    btn.addEventListener('click', () => {
      preavis.preavisPaye = btn.getAttribute('data-val') === 'true';
      grp.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    }));
  app.querySelector('[data-result]')!.addEventListener('click', goToResult);
  wireNav();
}

function goToResult(): void {
  const r = resolved();
  const elig = checkEligibility({
    estCDI: situation.estCDI,
    motifEconomique: situation.motifEconomique,
    tempsPlein: situation.tempsPlein,
    pasDeDroitsAnterieurs: situation.pasDeDroitsAnterieurs,
    age: situation.age,
    ancienneteMois: r.ancienneteMois,
    salaireBrutMensuel: r.salaireBrutMensuel,
  });
  if (!elig.eligible) { renderIneligible(elig.exclusions); return; }
  step = 4;
  renderResult();
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------------
// Hors périmètre
// ---------------------------------------------------------------------------

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
    <button class="primary" data-next="1">Modifier mes réponses</button>
  `;
  wireNav();
}

// ---------------------------------------------------------------------------
// Étape 4 — Résultat
// ---------------------------------------------------------------------------

function verdictHtml(months: number): string {
  const c = compareAt(resolved(), baremes2026, months);
  const ecart = Math.abs(c.differentialGross);
  const monthsLabel = `${months.toFixed(1).replace('.0', '')} mois`;
  let hero: string;
  if (c.winner === 'egalite') {
    hero = `<div class="hero egalite"><div class="hero-badge">À égalité</div>
      <div class="hero-sub">Si tu retrouves un emploi vers <strong>${monthsLabel}</strong>, les deux options se valent.</div></div>`;
  } else {
    const name = c.winner === 'csp' ? 'Le CSP' : 'L\'ARE';
    hero = `<div class="hero ${c.winner}"><div class="hero-badge">${name} l'emporte</div>
      <div class="hero-amount">+${formatEuro(ecart)}</div>
      <div class="hero-sub">au total, si tu retrouves un emploi vers <strong>${monthsLabel}</strong>.</div></div>`;
  }
  const row = (label: string, csp: number, are: number, hint = '') =>
    `<tr><td>${label}${hint ? `<span class="src"> ${hint}</span>` : ''}</td>
      <td class="csp"><strong>${formatEuro(csp)}</strong></td><td class="are"><strong>${formatEuro(are)}</strong></td></tr>`;
  return `${hero}
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
    const sample = compareAt(resolved(), baremes2026, 9);
    const who = sample.winner === 'are' ? "l'ARE" : 'le CSP';
    return `Sur tout l'horizon testé, <strong>${who}</strong> reste devant, quel que soit ton délai de retour à l'emploi.`;
  }
  return `Le gagnant <strong>change autour de ${months.map((m) => `${m.toFixed(1)} mois`).join(' et ')}</strong> :
    avant, c'est une option ; après, c'est l'autre. Déplace le curseur pour voir.`;
}

interface Figure { label: string; value: string; formula: string; source: string; note?: string; }
function figures(): Figure[] {
  const input = resolved();
  const a = analyze(input, baremes2026);
  const b = baremes2026;
  const fa = b.are.tauxBas.valeur * a.sjr + b.are.partieFixe.valeur;
  const fb = b.are.tauxHaut.valeur * a.sjr;
  const differeJours = computeAreDeferralDays(input, b.differe);
  return [
    { label: 'Salaire journalier de référence (SJR)', value: formatEuro2(a.sjr), formula: 'Somme des bruts sur la période de référence / jours calendaires réels (années bissextiles incluses).', source: 'Méthode France Travail.' },
    { label: 'ASP journalière (CSP)', value: formatEuro2(a.aspDaily), formula: `75 % × SJR = 0,75 × ${formatEuro2(a.sjr)}`, source: b.asp.taux.source, note: 'Ancienneté ≥ 1 an. Jamais inférieure à l\'ARE.' },
    { label: 'ARE journalière', value: formatEuro2(a.areDaily), formula: `max(40,4 % × SJR + 13,18 ; 57 % × SJR) = max(${formatEuro2(fa)} ; ${formatEuro2(fb)})`, source: b.are.partieFixe.source, note: 'On garde le plus favorable, plafonné à 75 % du SJR.' },
    { label: 'Indemnité légale de licenciement', value: formatEuro(input.indemniteLicenciement), formula: '1/4 de mois par an (10 premières années) puis 1/3 au-delà.', source: 'Barème légal.', note: 'Modifiable par période. La part au-delà allonge le différé ARE.' },
    { label: 'Délai avant le 1er versement de l\'ARE', value: `${Math.round(differeJours)} jours`, formula: '7 j de carence + indemnité CP / SJR (max 30 j) + part supra-légale / 111,8 (max 75 j).', source: b.differe.delaiAttenteJours.source, note: 'Le CSP démarre sans aucun délai.' },
    { label: 'Durée maximale de l\'ASP (CSP)', value: '12 mois (365 j)', formula: 'Durée fixe du CSP.', source: b.asp.plafondJournalier.source, note: 'Après 12 mois, bascule en ARE résiduelle sans nouvelle carence.' },
    { label: 'Durée maximale de l\'ARE', value: `${a.areDurationDays} j (~${Math.round(a.areDurationDays / 30.42)} mois)`, formula: `Selon l'âge (${input.age} ans) : < 55 → 548 j ; 55-56 → 685 j ; ≥ 57 → 822 j.`, source: b.duree.moins55.source },
  ];
}

function figuresSection(): string {
  return figures().map((f) => `<details class="figure">
    <summary><span class="fig-label">${escapeHtml(f.label)}</span><span class="fig-val">${f.value}</span></summary>
    <div class="fig-body">
      <div><span class="fig-k">Calcul :</span> ${escapeHtml(f.formula)}</div>
      ${f.note ? `<div class="fig-note">${escapeHtml(f.note)}</div>` : ''}
      <div class="src">Source : ${escapeHtml(f.source)}</div>
    </div></details>`).join('');
}

function renderResult(): void {
  const input = resolved();
  const a = analyze(input, baremes2026);
  const series = buildSeries(input, baremes2026, 30, 0.5);
  app.innerHTML = `
    <h1>Ton résultat</h1>
    ${progressBar()}
    ${disclaimer}
    <div class="card" id="verdict-card">${verdictHtml(currentMonths)}</div>
    <div class="card">
      <h2>La question qui change tout : dans combien de temps retrouves-tu un emploi ?</h2>
      <p class="muted" id="be-sentence">${breakEvenSentence(a.breakEvenMonths)}</p>
      <div class="slider-row"><input type="range" id="months" min="0" max="30" step="0.5" value="${currentMonths}" /></div>
      <div class="legend"><span class="l-csp">CSP</span><span class="l-are">ARE</span></div>
      <div id="chart">${renderChartSvg(series, currentMonths, a.breakEvenMonths)}</div>
      <details class="figure"><summary><span class="fig-label">Comment lire ce graphe ?</span></summary>
        <div class="fig-body">
          <div>Chaque courbe = le cash total selon le moment où tu retrouves un emploi.
            <span class="csp">Vert = CSP</span>, <span class="are">ambre = ARE</span>.</div>
          <div class="fig-note">La bande colorée sous le graphe montre qui gagne à chaque instant.
            Là où elle change de couleur, c'est le point de bascule.</div>
        </div></details>
    </div>
    <div class="card">
      <h2>D'où viennent les chiffres</h2>
      <p class="muted">Clique sur un montant pour voir son calcul exact et sa source officielle.</p>
      ${figuresSection()}
    </div>
    <div class="print-only"><p>Document généré par un outil d'aide à la décision. Estimation non officielle, barèmes France Travail / Unédic 2026. Vérifier auprès de France Travail.</p></div>
    <button class="primary no-print" id="print">Imprimer / enregistrer en PDF</button>
    <button class="link no-print" data-next="1" style="margin-left:14px">Modifier mes réponses</button>
    <footer>Aucune donnée envoyée. Calcul local. Hypothèse : retour à l'emploi mesuré depuis la fin du contrat.</footer>
  `;
  const slider = document.getElementById('months') as HTMLInputElement;
  slider.addEventListener('input', () => {
    currentMonths = Number(slider.value);
    document.getElementById('verdict-card')!.innerHTML = verdictHtml(currentMonths);
    document.getElementById('chart')!.innerHTML = renderChartSvg(series, currentMonths, a.breakEvenMonths);
  });
  document.getElementById('print')!.addEventListener('click', () => window.print());
  wireNav();
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

function wireNav(): void {
  app.querySelectorAll<HTMLButtonElement>('[data-next]').forEach((b) =>
    b.addEventListener('click', () => goTo(Number(b.dataset.next) as Step)));
  app.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((b) =>
    b.addEventListener('click', () => goTo(Number(b.dataset.goto) as Step)));
}

function goTo(s: Step): void {
  stepError = '';
  step = s;
  if (s === 3) { goToPreavisGuard(); return; }
  render();
  window.scrollTo(0, 0);
}

// Avant l'étape Préavis (= après les périodes), valider qu'au moins une période existe.
function goToPreavisGuard(): void {
  if (periods.length === 0) { step = 2; stepError = 'Ajoute au moins une période d\'emploi.'; render(); return; }
  step = 3;
  render();
  window.scrollTo(0, 0);
}

function render(): void {
  if (step === 1) renderSituation();
  else if (step === 2) renderPeriods();
  else if (step === 3) renderPreavis();
  else renderResult();
}

render();
