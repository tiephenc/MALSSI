// MALSSI · coque, routage et démarrage
import { S, save } from './store.js';
import { loadContent, loadActiveTiers } from './content.js';
import * as anki from './anki.js';
import * as sync from './sync.js';
import { $, $$, leave } from './ui.js';
import { magpie } from './magpie.js';
import { mountFocus } from './focus.js';
import { skyline } from './city.js';
import { viewToday } from './views/today.js';
import { viewParcours, viewUnit } from './views/parcours.js';
import { viewReviser, viewVocab, viewAnki, viewErreurs, stopKeys } from './views/reviser.js';
import { viewProfil, viewAbout, applyTheme } from './views/profil.js';
import { viewListes, viewDico } from './views/mots.js';
import { viewTopik, viewEcriture, stopTopik } from './views/topik.js';
import { viewAccueil, stopAccueil } from './views/accueil.js';

const NAV = [
  ['#/', '오늘', 'Aujourd\'hui'], ['#/parcours', '배움', 'Parcours'], ['#/reviser', '복습', 'Révisions'],
  ['#/listes', '단어', 'Mots'], ['#/topik', '시험', 'TOPIK'], ['#/profil', '나', 'Profil']];
const TITLES = { erreurs: 'Carnet d\'erreurs', accueil: 'Accueil', listes: 'Listes par niveau', dico: 'Dictionnaire', topik: 'Entraînement TOPIK', ecriture: 'Atelier d\'écriture', '': 'Aujourd\'hui', parcours: 'Parcours', unite: 'Unité', reviser: 'Révisions', vocabulaire: 'Vocabulaire', anki: 'Import Anki', profil: 'Profil', apropos: 'À propos' };

const NEONC = ['#ff4fa0', '#49e6f2', '#ff8a4c', '#c6ff6b', '#b48cff', '#ffd36b'];
const MORE = [['#/dico', 'Dictionnaire'], ['#/vocabulaire', 'Mes mots'], ['#/erreurs', 'Carnet d\'erreurs'], ['#/anki', 'Importer Anki'], ['#/ecriture', 'Atelier d\'écriture'], ['#/accueil', 'Accueil'], ['#/apropos', 'À propos · Soutenir']];
function shell() {
  document.body.innerHTML = `<a class="sr" href="#main">Aller au contenu</a>
  <div class="shell">
    <header class="city" id="city">
      <canvas class="city-bg" aria-hidden="true"></canvas>
      <a class="brand-sign" href="#/" aria-label="말씨, aujourd'hui">${magpie(30, { label: '' })}<b class="ko">말씨</b></a>
      <nav class="nav signs" aria-label="Navigation principale">${NAV.map(([h, k, l], i) => `<a class="sign" href="${h}" style="--c:${NEONC[i]}"><b lang="ko">${k}</b><span>${l}</span></a>`).join('')}</nav>
      <details class="more"><summary class="sign mini" style="--c:#f3ecff"><b lang="ko">더보기</b><span>Plus</span></summary>
        <div class="more-menu">${MORE.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</div></details>
    </header>
    <main id="main" tabindex="-1"></main>
  </div>`;
  skyline($('#city'));
  // la barre se resserre quand on fait défiler
  const hdr = $('#city'); let on = false;
  addEventListener('scroll', () => { const c = scrollY > 60; if (c !== on) { on = c; hdr.classList.toggle('compact', c); } }, { passive: true });
  document.addEventListener('click', e => { const m = $('.more'); if (m && m.open && !e.target.closest('.more')) m.open = false; if (e.target.closest('.more-menu a')) m.open = false; });
}
function route() {
  stopKeys(); stopTopik(); stopAccueil(); leave(); document.body.classList.remove('is-landing');
  const h = location.hash.replace(/^#\/?/, ''), [page, arg] = h.split('/');
  const el = $('#main');
  $$('.nav a').forEach(a => a.toggleAttribute('aria-current', false));
  const map = { unite: 'parcours', anki: 'reviser', erreurs: 'reviser', vocabulaire: 'listes', dico: 'listes', ecriture: 'topik' };
  const cur = $$('.nav a').find(a => a.getAttribute('href') === '#/' + (map[page] || page));
  $$('.more-menu a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#/' + page));
  if (cur) cur.setAttribute('aria-current', 'page');
  document.title = (TITLES[page] || 'MALSSI') + ' · MALSSI';
  try {
    if (!page && !Object.keys(S.units).length && !S.seen) { S.seen = 1; save(); viewAccueil(el); }
    else if (page === 'accueil') viewAccueil(el);
    else if (!page) viewToday(el);
    else if (page === 'listes') viewListes(el, arg);
    else if (page === 'erreurs') viewErreurs(el);
    else if (page === 'dico') viewDico(el, arg);
    else if (page === 'topik') viewTopik(el);
    else if (page === 'ecriture') viewEcriture(el, arg);
    else if (page === 'parcours') viewParcours(el);
    else if (page === 'unite') viewUnit(el, arg);
    else if (page === 'reviser') viewReviser(el);
    else if (page === 'vocabulaire') viewVocab(el);
    else if (page === 'anki') viewAnki(el);
    else if (page === 'profil') viewProfil(el, route);
    else if (page === 'apropos') viewAbout(el);
    else el.innerHTML = '<div class="empty">Page introuvable. <a href="#/">Retour à aujourd\'hui</a></div>';
  } catch (e) { console.error(e); el.innerHTML = '<div class="empty">Cette page n\'a pas pu s\'afficher. Rechargez le site ; si le problème persiste, exportez vos données depuis Profil.</div>'; }
  if (!location.hash.includes('#s-')) { window.scrollTo(0, 0); el.focus({ preventScroll: true }); }
}
function stars() {
  // ciel étoilé fixe, tiré au hasard une fois (motif répété)
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700">';
  for (let i = 0; i < 110; i++) { const x = Math.random() * 700, y = Math.random() * 700, r = Math.random() < 0.08 ? 1.4 : 0.4 + Math.random() * 0.7, o = 0.25 + Math.random() * 0.6; svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${o.toFixed(2)}"/>`; }
  document.body.style.setProperty('--stars', `url("data:image/svg+xml,${encodeURIComponent(svg + '</svg>')}")`);
}
async function boot() {
  applyTheme(); shell(); stars();
  $('#main').innerHTML = '<p class="muted">Chargement…</p>';
  try { await loadContent(); }
  catch (e) { console.error(e); $('#main').innerHTML = '<div class="empty">Le contenu n\'a pas pu être chargé. Vérifiez votre connexion, puis <a href="javascript:location.reload()">rechargez la page</a>.</div>'; return; }
  try { await anki.loadDecks(); } catch (e) {}
  try { await loadActiveTiers(); } catch (e) {}
  mountFocus();
  // Transition douce entre les vues quand le navigateur le permet
  const go = () => { if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(route); else route(); };
  addEventListener('hashchange', () => { if (!/^#(s-|p-|lvl-)/.test(location.hash)) go(); });
  route();
  if (sync.enabled && sync.session) sync.start(() => { applyTheme(); route(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
