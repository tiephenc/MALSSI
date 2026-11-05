// MALSSI · chargement du contenu (unités rédigées + lexique vérifié) et cartes de révision
import { S, dayKey, newLeft } from './store.js';
import { romanize } from './hangul.js';
import * as anki from './anki.js';

export const C = { etapes: [], units: [], byId: {}, lex: {} };
export async function loadContent() {
  const [e0, lex] = await Promise.all([
    fetch('data/etape0.json').then(r => r.json()),
    fetch('data/lexique.json').then(r => r.json())]);
  C.etapes = [e0]; C.lex = lex;
  C.units = e0.unites.map((u, i) => Object.assign(u, { etape: e0.id, n: i }));
  C.units.forEach(u => C.byId[u.id] = u);
}
export const wordInfo = ko => C.lex[ko] || null;
export const rr = ko => { const w = wordInfo(ko); return romanize((w && w.pron) || ko); };

// Une unité est ouverte quand la précédente est commencée : on garde un parcours ordonné sans bloquer la curiosité.
export function unitState(u) { return S.units[u.id] || null; }
export function unitOpen(u) { return u.n === 0 || !!S.units[C.units[u.n - 1].id] || !!S.units[u.id]; }
export function currentUnit() { return C.units.find(u => !(S.units[u.id] && S.units[u.id].done)) || null; }

// ---------- Cartes ----------
// Vocabulaire du parcours : id « v:<mot> ». Les mots entrent dans les révisions quand l'unité est terminée.
export function courseCards() {
  const out = [];
  for (const u of C.units) {
    if (!(S.units[u.id] && S.units[u.id].done)) continue;
    for (const [ko, fr] of u.mots) out.push({ id: 'v:' + ko, ko, fr, unit: u.id, src: u.id });
  }
  return out;
}
export function allCards() {
  return courseCards().concat(anki.cards());
}
const isDue = (s, now) => s && s.s && s.due <= now;
export function sessionQueue(limitNew = newLeft()) {
  const now = Date.now(), all = allCards();
  const due = all.filter(c => isDue(S.cards[c.id], now)).sort((a, b) => S.cards[a.id].due - S.cards[b.id].due);
  const fresh = all.filter(c => !S.cards[c.id] || !S.cards[c.id].s).slice(0, limitNew);
  return { due, fresh, all };
}
export function stats() {
  const all = allCards(), now = Date.now();
  let nw = 0, learn = 0, mature = 0, due = 0;
  for (const c of all) { const s = S.cards[c.id]; if (!s || !s.s) { nw++; continue; } if (s.s === 2 && s.iv >= 21) mature++; else learn++; if (s.due <= now) due++; }
  return { total: all.length, nw, learn, mature, due, today: S.days[dayKey()] || { n: 0 } };
}
