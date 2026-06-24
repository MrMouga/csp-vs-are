import { compareAt } from '../engine/compare';
import type { Baremes, UserInput } from '../engine/types';

export interface ChartSeries {
  months: number[];
  csp: number[];
  are: number[];
  maxMonths: number;
}

/** Précalcule les totaux CSP et ARE en fonction du mois de retour à l'emploi. */
export function buildSeries(
  input: UserInput,
  baremes: Baremes,
  maxMonths = 30,
  step = 0.5,
  net = false,
): ChartSeries {
  const months: number[] = [];
  const csp: number[] = [];
  const are: number[] = [];
  for (let m = 0; m <= maxMonths + 1e-9; m += step) {
    const c = compareAt(input, baremes, m, { net });
    months.push(m);
    csp.push(c.csp.total);
    are.push(c.are.total);
  }
  return { months, csp, are, maxMonths };
}

const W = 700;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 34, left: 56 };


/**
 * Rend la timeline en SVG : courbe CSP (vert), courbe ARE (ambre), trait vertical au
 * mois courant, et marqueurs aux points de bascule. Pas de dépendance externe.
 */
export function renderChartSvg(
  series: ChartSeries,
  currentMonth: number,
  breakEvenMonths: number[],
): string {
  const maxY = Math.max(...series.csp, ...series.are) * 1.05;
  const minY = 0;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (m: number) => PAD.left + (m / series.maxMonths) * plotW;
  const y = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(series.months[i]!).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = minY + f * (maxY - minY);
    return `<g>
      <line x1="${PAD.left}" y1="${y(v)}" x2="${W - PAD.right}" y2="${y(v)}" stroke="#eef0f3" />
      <text x="${PAD.left - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#5b636e">${Math.round(v).toLocaleString('fr-FR')}</text>
    </g>`;
  }).join('');

  const xTicks = [0, 6, 12, 18, 24, 30]
    .filter((m) => m <= series.maxMonths)
    .map((m) => `<text x="${x(m)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="#5b636e">${m}</text>`)
    .join('');

  const beMarkers = breakEvenMonths
    .map(
      (m) => `<line x1="${x(m)}" y1="${PAD.top}" x2="${x(m)}" y2="${PAD.top + plotH}" stroke="#9aa3af" stroke-dasharray="3 3" />
      <text x="${x(m)}" y="${PAD.top + 12}" text-anchor="middle" font-size="10" fill="#5b636e">bascule ${m.toFixed(1)} m</text>`,
    )
    .join('');

  // Bande « qui gagne » juste au-dessus de l'axe : vert = CSP devant, ambre = ARE devant.
  const bandY = PAD.top + plotH + 4;
  const bandH = 7;
  const winnerBand = series.months
    .slice(0, -1)
    .map((m, i) => {
      const color = series.csp[i]! >= series.are[i]! ? 'var(--csp)' : 'var(--are)';
      return `<rect x="${x(m)}" y="${bandY}" width="${(x(series.months[i + 1]!) - x(m)) + 0.5}" height="${bandH}" fill="${color}" opacity="0.85" />`;
    })
    .join('');

  const cur = Math.max(0, Math.min(series.maxMonths, currentMonth));

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img"
      aria-label="Comparaison du cash total CSP vs ARE selon le mois de retour à l'emploi">
    ${yTicks}
    ${winnerBand}
    ${beMarkers}
    <path d="${path(series.are)}" fill="none" stroke="var(--are)" stroke-width="2.5" />
    <path d="${path(series.csp)}" fill="none" stroke="var(--csp)" stroke-width="2.5" />
    <line x1="${x(cur)}" y1="${PAD.top}" x2="${x(cur)}" y2="${PAD.top + plotH}" stroke="var(--accent)" stroke-width="2" />
    <text x="${x(cur)}" y="${H - 22}" text-anchor="middle" font-size="11" fill="var(--accent)">${cur.toFixed(1)} mois</text>
    ${xTicks}
    <text x="${PAD.left}" y="${H - 24}" font-size="11" fill="#5b636e">Retour à l'emploi (mois) →</text>
  </svg>`;
}
