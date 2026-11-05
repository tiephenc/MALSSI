/* MALSSI · service worker : le site reste utilisable hors connexion.
   Fichiers du site : réseau d'abord (les mises à jour arrivent tout de suite), copie locale sinon.
   Polices Google : copie locale d'abord. Comptes et Ko-fi : jamais mis en cache.
   Changer VERSION à chaque publication. */
const VERSION = 'malssi-2026-11-05-d';
const SHELL = ['./', './index.html', './manifest.webmanifest', './css/malssi.css', './icons/icon.svg', './icons/icon-192.png',
  './js/app.js', './js/store.js', './js/fsrs.js', './js/hangul.js', './js/tts.js', './js/ui.js', './js/magpie.js', './js/content.js',
  './js/anki.js', './js/sync.js', './js/config.js', './js/focus.js', './js/views/today.js', './js/views/parcours.js',
  './js/views/reviser.js', './js/views/profil.js', './js/views/mots.js', './js/views/topik.js', './js/views/accueil.js',
  './data/etape0.json', './data/niveau1.json', './data/niveau2.json', './data/niveau3.json', './data/niveau4.json', './data/niveau5.json',
  './data/niveau6.json', './data/lexique.json', './data/ecriture.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === location.origin) {
    const key = r.mode === 'navigate' ? './index.html' : r;
    e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(key, cp)); } return res; })
      .catch(() => caches.match(key, { ignoreSearch: true })));
    return;
  }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com')
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); return res; })));
});
