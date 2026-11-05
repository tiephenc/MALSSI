// MALSSI · chargement du contenu (unités rédigées, listes par niveau, lexique vérifié) et cartes de révision
import { S, dayKey, newLeft } from './store.js';
import { romanize } from './hangul.js';
import * as anki from './anki.js';

export const C = { etapes: [], units: [], byId: {}, lex: {}, tiers: {}, listById: {}, dico: null };
export const TIER_LABEL = { 1: '초급 · TOPIK I (1–2급)', 2: '중급 · 3–4급', 3: '고급 · 5–6급' };
export async function loadContent() {
  const files = ['etape0', 'niveau1', 'niveau2', 'niveau3', 'niveau4', 'niveau5', 'niveau6'];
  const [lex, ...etapes] = await Promise.all([fetch('data/lexique.json').then(r => r.json()), ...files.map(f => fetch('data/' + f + '.json').then(r => r.json()))]);
  C.lex = lex; C.etapes = etapes; C.units = []; C.byId = {};
  for (const e of etapes) e.unites.forEach(u => { Object.assign(u, { etape: e.id, niveau: e.niveau || 0, n: C.units.length, k: e.unites.indexOf(u) }); C.units.push(u); C.byId[u.id] = u; });
}
// Listes de vocabulaire par niveau (chargées à la demande)
export async function loadTier(t) {
  if (C.tiers[t]) return C.tiers[t];
  const d = await fetch(`data/vocab/t${t}.json`).then(r => r.json());
  d.listes.forEach(l => { l.tier = t; C.listById[l.id] = l; });
  return (C.tiers[t] = d);
}
export async function loadActiveTiers() {
  const need = new Set(Object.keys(S.lists || {}).map(id => +id[1]));
  await Promise.all([...need].map(loadTier));
}
// Dictionnaire intégré (6 Mo, chargé à la demande)
export async function loadDico() { if (!C.dico) C.dico = await fetch('data/dico.json').then(r => r.json()); return C.dico; }
export const wordInfo = ko => C.lex[ko] || null;
export const rr = ko => { const w = wordInfo(ko); return romanize((w && w.pron) || ko, ko); };

// Une unité est ouverte si c'est la première de son étape, si la précédente est commencée, ou si elle a déjà été ouverte.
export function unitState(u) { return S.units[u.id] || null; }
export function unitOpen(u) { return u.k === 0 || !!S.units[C.units[u.n - 1].id] || !!S.units[u.id]; }
export function currentUnit() { return C.units.find(u => !(S.units[u.id] && S.units[u.id].done)) || null; }
export const levelOf = id => C.etapes.find(e => e.id === id);

// ---------- Cartes ----------
// Mots des unités terminées : id « v:<mot> » ; mots des listes ajoutées : id « k:<mot>:<sens> ».
export function courseCards() {
  const out = new Map();
  for (const u of C.units) {
    if (!(S.units[u.id] && S.units[u.id].done)) continue;
    for (const [ko, fr] of u.mots) if (!out.has('v:' + ko)) out.set('v:' + ko, { id: 'v:' + ko, ko, fr, unit: u.id, src: u.id });
  }
  for (const id of Object.keys(S.lists || {})) {
    const l = C.listById[id]; if (!l) continue;
    for (const [ko, fr, sn] of l.mots) { const cid = 'k:' + ko + ':' + sn; if (!out.has(cid) && !out.has('v:' + ko)) out.set(cid, { id: cid, ko, fr, src: l.titre, list: id }); }
  }
  return [...out.values()];
}
export function allCards() { return courseCards().concat(anki.cards()); }
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
// Exemple avec repères [ ] : rendu surligné, ou à trous
export const markEx = (s, esc) => esc(s).replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');
export const blankEx = s => { let first = true; return s.replace(/\[([^\]]+)\]/g, (m, g) => { if (first) { first = false; return '＿＿'; } return g; }); };
export const exAnswer = s => (s.match(/\[([^\]]+)\]/) || [])[1] || '';
export const plainEx = s => s.replace(/[[\]]/g, '');
