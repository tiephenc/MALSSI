// MALSSI · état local, sauvegarde, export
import { startOfDay } from './fsrs.js';
const KEY = 'malssi.v1';
const listeners = new Set();
export const dayKey = (t = Date.now()) => { const d = new Date(startOfDay(t)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

export function blank() {
  return { v: 1, updated: 0, cards: {}, units: {}, days: {}, nd: { d: '', n: 0 },
    set: { nd: 10, dir: 'kf', rr: 1, theme: 'auto', voice: '' },
    focus: { set: { work: 25, brk: 5, sound: 1 }, log: {} }, anki: { decks: {} }, lists: {}, topik: {}, writing: {} };
}
function normalize(s) {
  const b = blank();
  for (const k in b) if (s[k] === undefined) s[k] = b[k];
  for (const k in b.set) if (s.set[k] === undefined) s.set[k] = b.set[k];
  for (const k in b.focus.set) if (s.focus.set[k] === undefined) s.focus.set[k] = b.focus.set[k];
  if (!s.focus.log) s.focus.log = {};
  if (!s.anki || !s.anki.decks) s.anki = { decks: {} };
  return s;
}
export let S = (() => {
  try { const raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) {}
  return blank();
})();
let saveT = null;
export function save(opts = {}) {
  S.updated = Date.now();
  clearTimeout(saveT);
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('[MALSSI] sauvegarde locale impossible', e); } };
  if (opts.now) write(); else saveT = setTimeout(write, 150);
  listeners.forEach(fn => { try { fn(opts); } catch (e) {} });
}
export function onSave(fn) { listeners.add(fn); }
export function replace(next) { S = normalize(next); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function today() { const k = dayKey(); return S.days[k] || (S.days[k] = { n: 0, ok: 0, ko: 0, sec: 0, nw: 0 }); }
export function newLeft() { return Math.max(0, S.set.nd - (S.nd.d === dayKey() ? S.nd.n : 0)); }
export function countNew() { if (S.nd.d !== dayKey()) S.nd = { d: dayKey(), n: 0 }; S.nd.n++; }
export function exportJSON() { return JSON.stringify(S); }
