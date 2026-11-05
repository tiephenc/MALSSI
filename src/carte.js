// MALSSI · le chemin de montagne (산길) : les sept étapes du parcours, du hangeul au sommet du 6급.
// Le sentier se trace selon la progression ; la pie se pose sur l'étape en cours.
import { magpie } from './magpie.js';
const TRAIL = 'M60 590 C180 585 220 520 300 520 C390 520 380 450 470 440 C560 430 600 470 660 420 C720 370 640 330 700 290 C760 250 840 280 850 220 C860 160 790 150 800 100 C808 62 860 48 900 40';
const KO = { 0: '한글', 1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급' };
const AT = [0.02, 0.17, 0.33, 0.49, 0.64, 0.8, 0.985];
export function carte(etapes, done, opts = {}) {
  // done : nombre d'unités terminées par étape ; avancement global = position sur le sentier
  const tot = etapes.map(e => e.unites.length), cur = etapes.findIndex((e, k) => done[k] < tot[k]);
  const k = cur < 0 ? etapes.length - 1 : cur;
  const frac = cur < 0 ? 1 : AT[k] + (AT[Math.min(k + 1, 6)] - AT[k]) * (done[k] / tot[k]);
  return `<figure class="carte ${opts.big ? 'big' : ''}" style="--frac:${frac}">
    <svg viewBox="0 0 1000 620" role="img" aria-label="Carte du parcours : étape ${KO[etapes[k].niveau || 0]} en cours">
      <defs><linearGradient id="cm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mtn-1)"/><stop offset="1" stop-color="var(--mtn-1)" stop-opacity=".1"/></linearGradient>
        <linearGradient id="cm2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mtn-2)"/><stop offset="1" stop-color="var(--mtn-2)" stop-opacity=".15"/></linearGradient></defs>
      <path class="m1" fill="url(#cm1)" d="M0 420 L120 300 L210 360 L330 210 L430 300 L520 180 L610 260 L700 140 L790 210 L900 20 L1000 160 L1000 620 L0 620Z"/>
      <path class="m2" fill="url(#cm2)" d="M0 520 L140 430 L250 480 L380 380 L500 450 L620 360 L760 430 L880 350 L1000 420 L1000 620 L0 620Z"/>
      <path class="trail-bg" d="${TRAIL}" pathLength="1"/>
      <path class="trail" d="${TRAIL}" pathLength="1"/>
      <g class="flag" transform="translate(900 40)"><path d="M0 0 V-34" /><path d="M0 -34 L22 -27 L0 -20Z"/></g>
    </svg>
    <ol class="stations">${etapes.map((e, i) => `<li class="${done[i] >= tot[i] ? 'ok' : i === k ? 'now' : ''}" style="--at:${AT[i]}" data-i="${i}">
      <a href="#/parcours" data-lvl="${e.id}"><b class="ko">${KO[e.niveau || 0]}</b><span>${done[i]}/${tot[i]}</span></a></li>`).join('')}</ol>
    <div class="pie-at" style="--at:${frac}">${magpie(46, { label: '' })}</div>
  </figure>`;
}
// Positions des stations le long du sentier (calculées une fois le SVG en place)
export function placeStations(root) {
  const fig = root.querySelector('.carte'); if (!fig) return;
  const p = fig.querySelector('.trail-bg'), svg = fig.querySelector('svg');
  const place = (el, at) => { const L = p.getTotalLength(), pt = p.getPointAtLength(L * at); el.style.left = (pt.x / 10) + '%'; el.style.top = (pt.y / 6.2) + '%'; };
  fig.querySelectorAll('.stations li').forEach(li => place(li, +li.style.getPropertyValue('--at')));
  place(fig.querySelector('.pie-at'), +fig.style.getPropertyValue('--frac'));
  requestAnimationFrame(() => fig.classList.add('drawn'));
  if (svg) svg.setAttribute('data-ok', '1');
}
