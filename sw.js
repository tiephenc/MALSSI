/* MALSSI · service worker : le site reste utilisable hors connexion.
   Fichiers du site : réseau d'abord (les mises à jour arrivent tout de suite), copie locale sinon.
   Polices Google : copie locale d'abord. Comptes et Ko-fi : jamais mis en cache.
   Changer VERSION à chaque publication. */
const VERSION = 'malssi-c0990ec9e2';
const SHELL = ["./","./index.html","./manifest.webmanifest","./icons/icon.svg","./icons/icon-192.png","./build/m-c0990ec9e2.js","./build/m-c0990ec9e2.css","./data/ecriture.json","./data/etape0.json","./data/lexique.json","./data/niveau1.json","./data/niveau2.json","./data/niveau3.json","./data/niveau4.json","./data/niveau5.json","./data/niveau6.json","./data/plus1.json","./data/plus2.json","./data/plus3.json","./data/plus4.json","./data/plus5.json","./data/plus6.json"];
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
