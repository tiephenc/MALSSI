// MALSSI · coque, routage et démarrage
import { S, save } from './store.js';
import { loadContent } from './content.js';
import * as anki from './anki.js';
import * as sync from './sync.js';
import { $, $$ } from './ui.js';
import { magpie } from './magpie.js';
import { mountFocus } from './focus.js';
import { viewToday } from './views/today.js';
import { viewParcours, viewUnit } from './views/parcours.js';
import { viewReviser, viewVocab, viewAnki, stopKeys } from './views/reviser.js';
import { viewProfil, viewAbout, applyTheme } from './views/profil.js';

const NAV = [
  ['#/', '오늘', 'Aujourd\'hui'], ['#/parcours', '배움', 'Parcours'], ['#/reviser', '복습', 'Révisions'],
  ['#/vocabulaire', '단어', 'Vocabulaire'], ['#/profil', '나', 'Profil']];
const TITLES = { '': 'Aujourd\'hui', parcours: 'Parcours', unite: 'Unité', reviser: 'Révisions', vocabulaire: 'Vocabulaire', anki: 'Import Anki', profil: 'Profil', apropos: 'À propos' };

function shell() {
  document.body.innerHTML = `<a class="sr" href="#main">Aller au contenu</a>
  <div class="shell">
    <nav class="rail" aria-label="Navigation principale">
      <a class="brand" href="#/">${magpie(40, { label: '' })}<span><b>말씨</b><br><span>MALSSI</span></span></a>
      <div class="band" aria-hidden="true"></div>
      <div class="nav">${NAV.map(([h, k, l]) => `<a href="${h}"><span class="k" lang="ko">${k}</span><span>${l}</span></a>`).join('')}</div>
      <div class="grow"></div>
      <div class="foot"><a href="#/anki">Importer Anki</a><br><a href="#/apropos">À propos · Soutenir</a></div>
    </nav>
    <main id="main" tabindex="-1"></main>
  </div>`;
}
function route() {
  stopKeys();
  const h = location.hash.replace(/^#\/?/, ''), [page, arg] = h.split('/');
  const el = $('#main');
  $$('.nav a').forEach(a => a.toggleAttribute('aria-current', false));
  const cur = $$('.nav a').find(a => a.getAttribute('href') === '#/' + (page === 'unite' ? 'parcours' : page === 'anki' ? 'reviser' : page));
  if (cur) cur.setAttribute('aria-current', 'page');
  document.title = (TITLES[page] || 'MALSSI') + ' · MALSSI';
  try {
    if (!page) viewToday(el);
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
async function boot() {
  applyTheme(); shell();
  $('#main').innerHTML = '<p class="muted">Chargement…</p>';
  await loadContent();
  try { await anki.loadDecks(); } catch (e) {}
  mountFocus();
  addEventListener('hashchange', () => { if (!/^#s-/.test(location.hash)) route(); });
  route();
  if (sync.enabled && sync.session) sync.start(() => { applyTheme(); route(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
