// MALSSI · la montée vers les étoiles : les sept étapes du parcours, de toit en toit jusqu'à l'étoile du 6급.
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
      <path class="m1" fill="url(#cm1)" d="M0 620 V430 H60 V380 H110 V410 H170 V330 H230 V360 H290 V280 H340 V300 H400 V240 H450 V270 H520 V200 H570 V230 H640 V160 H690 V190 H760 V120 H810 V150 H870 V70 H930 V100 H1000 V620Z"/>
      <path class="m2" fill="url(#cm2)" d="M0 620 V520 H80 V480 H150 V505 H220 V450 H300 V470 H370 V420 H440 V445 H520 V400 H600 V430 H680 V380 H760 V410 H840 V360 H920 V390 H1000 V620Z"/>
      <path class="trail-bg" d="${TRAIL}" pathLength="1"/>
      <path class="trail" d="${TRAIL}" pathLength="1"/>
      <g class="flag" transform="translate(900 26)"><path d="M0 -18 L5 -6 L18 -6 L8 2 L12 15 L0 7 L-12 15 L-8 2 L-18 -6 L-5 -6Z"/></g>
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
