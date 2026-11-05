// MALSSI · import de paquets Anki (.apkg) : lecture locale, rien n'est envoyé.
// Lecteur ZIP repris de KOTONOHA ; base Anki lue par sql.js (MIT), décompression zstd par fzstd (MIT).
// Les notes (texte seulement, sans médias) sont gardées dans IndexedDB ; la progression FSRS dans l'état local.
import { S, save } from './store.js';
const DB = 'malssi-anki', ST = 'decks';
let cache = {}; // deckId -> [{id, ko, fr}]

function idb() { return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function put(k, v) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction(ST, 'readwrite'); t.objectStore(ST).put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function get(k) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction(ST).objectStore(ST).get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); }
async function del(k) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction(ST, 'readwrite'); t.objectStore(ST).delete(k); t.oncomplete = res; t.onerror = () => rej(t.error); }); }

export async function loadDecks() {
  cache = {};
  for (const id of Object.keys(S.anki.decks)) { try { cache[id] = (await get(id)) || []; } catch (e) { cache[id] = []; } }
}
export function cards() {
  const out = [];
  for (const [id, d] of Object.entries(S.anki.decks)) { if (d.off) continue; for (const n of cache[id] || []) out.push({ id: 'a:' + id + ':' + n.id, ko: n.ko, fr: n.fr, src: d.name, anki: id }); }
  return out;
}
export const deckNotes = id => cache[id] || [];

let SQLP = null;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.appendChild(s); }); }
async function sql() {
  if (!SQLP) SQLP = (async () => { if (!window.initSqlJs) await loadScript('vendor/sql-wasm.js'); return window.initSqlJs({ locateFile: f => 'vendor/' + f }); })();
  return SQLP;
}
async function zstd() { if (!window.fzstd) await loadScript('vendor/fzstd.js'); return window.fzstd; }

// Lecture du ZIP sans tout charger en mémoire (les gros paquets contiennent surtout des médias)
async function openApkg(file) {
  const rd = async (o, n) => new Uint8Array(await file.slice(o, o + n).arrayBuffer());
  const tail = await rd(Math.max(0, file.size - 66000), Math.min(file.size, 66000));
  let e = -1; for (let i = tail.length - 22; i >= 0; i--) if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 5 && tail[i + 3] === 6) { e = i; break; }
  if (e < 0) throw new Error('zip');
  const dv = new DataView(tail.buffer, e); let cnt = dv.getUint16(10, true), cdSize = dv.getUint32(12, true), cdOff = dv.getUint32(16, true);
  if (cdOff === 0xFFFFFFFF || cnt === 0xFFFF) { // ZIP64
    const loc = e >= 20 ? new DataView(tail.buffer, e - 20) : null;
    if (!loc || loc.getUint32(0, true) !== 0x07064b50) throw new Error('zip64');
    const z64off = Number(loc.getBigUint64(8, true)); const z = new DataView((await rd(z64off, 56)).buffer);
    cnt = Number(z.getBigUint64(32, true)); cdSize = Number(z.getBigUint64(40, true)); cdOff = Number(z.getBigUint64(48, true));
  }
  const cd = await rd(cdOff, cdSize), cv = new DataView(cd.buffer), ents = new Map(), td = new TextDecoder(); let p = 0;
  for (let i = 0; i < cnt; i++) {
    if (cv.getUint32(p, true) !== 0x02014b50) throw new Error('cd');
    const meth = cv.getUint16(p + 10, true), nl = cv.getUint16(p + 28, true), xl = cv.getUint16(p + 30, true), cl = cv.getUint16(p + 32, true);
    let csz = cv.getUint32(p + 20, true), off = cv.getUint32(p + 42, true);
    if (csz === 0xFFFFFFFF || off === 0xFFFFFFFF) { // champs étendus ZIP64
      let q = p + 46 + nl; const end = q + xl;
      while (q < end) { const id = cv.getUint16(q, true), sz = cv.getUint16(q + 2, true);
        if (id === 1) { let r = q + 4; if (cv.getUint32(p + 24, true) === 0xFFFFFFFF) r += 8; if (csz === 0xFFFFFFFF) { csz = Number(cv.getBigUint64(r, true)); r += 8; } if (off === 0xFFFFFFFF) off = Number(cv.getBigUint64(r, true)); }
        q += 4 + sz; }
    }
    ents.set(td.decode(cd.subarray(p + 46, p + 46 + nl)), { meth, csz, off }); p += 46 + nl + xl + cl;
  }
  const getE = async name => {
    const x = ents.get(name); if (!x) return null;
    const h = await rd(x.off, 30), hv = new DataView(h.buffer); const nl = hv.getUint16(26, true), xl = hv.getUint16(28, true);
    let d = await rd(x.off + 30 + nl + xl, x.csz);
    if (x.meth === 8) d = new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else if (x.meth !== 0) throw new Error('meth');
    return d;
  };
  return { ents, getE };
}
// DOMParser ne charge aucune ressource (les <img> des notes ne déclenchent pas de requêtes)
const PARSER = new DOMParser();
const strip = h => { const d = PARSER.parseFromString('<body>' + String(h).replace(/<br\s*\/?>/gi, ' ').replace(/\[sound:[^\]]*\]/g, '').replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, '$1'), 'text/html'); return (d.body.textContent || '').replace(/\s+/g, ' ').trim(); };
const hasHangul = t => /[가-힣]/.test(t);

// Étape 1 : lire le paquet et proposer les champs
export async function read(file, say = () => {}) {
  say('Ouverture du paquet…');
  const z = await openApkg(file);
  let raw = null;
  for (const n of ['collection.anki21b', 'collection.anki21', 'collection.anki2']) {
    let d = await z.getE(n); if (!d) continue;
    if (d[0] === 0x28 && d[1] === 0xb5 && d[2] === 0x2f && d[3] === 0xfd) d = (await zstd()).decompress(d);
    if (d.length > 60000 || !raw) raw = d; if (d.length > 60000) break;
  }
  if (!raw) throw new Error('col');
  say('Lecture des notes…');
  const SQL = await sql(), db = new SQL.Database(raw);
  const q = s => { try { const r = db.exec(s); return r[0] ? r[0].values : []; } catch (e) { return null; } };
  const fieldsBy = {};
  const fr = q('select ntid,ord,name from fields');
  if (fr && fr.length) fr.forEach(([nt, o, n]) => { (fieldsBy[nt] = fieldsBy[nt] || [])[o] = n; });
  else { const m = q('select models from col'); if (m && m[0]) { const M = JSON.parse(m[0][0]); for (const id in M) fieldsBy[id] = M[id].flds.map(f => f.name); } }
  const notes = (q('select id,mid,flds from notes') || []).map(([id, mid, f]) => ({ id: String(id), mid: String(mid), f: String(f).split('\x1f') }));
  const cards = {}; (q('select nid,type,ivl,due,lapses,reps from cards') || []).forEach(r => { if (!cards[r[0]] || r[1] > cards[r[0]][1]) cards[r[0]] = r; });
  const crt = ((q('select crt from col') || [[0]])[0] || [0])[0];
  let deck = ''; const dn = q('select name from decks'); if (dn && dn.length) deck = (dn.map(r => r[0]).find(n => n !== 'Default') || '');
  if (!deck) { const dj = q('select decks from col'); try { const D = JSON.parse(dj[0][0]); deck = Object.values(D).map(x => x.name).find(n => n !== 'Default') || ''; } catch (e) {} }
  db.close();
  if (!notes.length) throw new Error('vide');
  // modèle le plus fréquent et champs : on devine le champ coréen et le champ français/anglais
  const byM = {}; notes.forEach(n => byM[n.mid] = (byM[n.mid] || 0) + 1);
  const mid = Object.entries(byM).sort((a, b) => b[1] - a[1])[0][0];
  const names = fieldsBy[mid] || notes.find(n => n.mid === mid).f.map((_, i) => 'Champ ' + (i + 1));
  const sample = notes.filter(n => n.mid === mid).slice(0, 40);
  // part de hangeul dans le champ : le champ coréen est celui où le hangeul domine
  const ratio = t => { const L = t.replace(/[\s\d\p{P}\p{S}]/gu, ''); return L.length ? (L.match(/[\uAC00-\uD7A3\u3131-\u318E]/g) || []).length / L.length : 0; };
  const score = names.map((_, i) => sample.reduce((a, n) => a + ratio(strip(n.f[i] || '')), 0));
  const koF = score.indexOf(Math.max(...score));
  const frF = names.findIndex((_, i) => i !== koF && sample.filter(n => { const t = strip(n.f[i] || ''); return t && !hasHangul(t); }).length > sample.length / 2);
  return { file: file.name, deck: deck || file.name.replace(/\.apkg$/i, '').replace(/_/g, ' '), names, mid, koF, frF: frF < 0 ? (koF === 0 ? 1 : 0) : frF,
    notes: notes.filter(n => n.mid === mid), other: notes.length - byM[mid], cards, crt, preview: i => sample.slice(0, 3).map(n => strip(n.f[i] || '')) };
}

// Étape 2 : enregistrer avec les champs choisis ; option : reprendre la progression Anki
export async function commit(r, koF, frF, keepProgress) {
  const id = 'd' + Date.now().toString(36);
  const list = [];
  for (const n of r.notes) { const ko = strip(n.f[koF] || ''), fr = strip(n.f[frF] || ''); if (ko && fr) list.push({ id: n.id, ko, fr }); }
  await put(id, list); cache[id] = list;
  S.anki.decks[id] = { name: r.deck, file: r.file, n: list.length, at: Date.now() };
  if (keepProgress) {
    for (const n of list) {
      const c = r.cards[n.id]; if (!c || c[1] !== 2) continue; // seules les cartes en révision
      const [, , ivl, due, lapses, reps] = c; const iv = Math.max(1, ivl);
      S.cards['a:' + id + ':' + n.id] = { s: 2, iv, st: iv, df: 5, due: (r.crt + due * 86400) * 1000, r: reps, l: lapses, lr: Date.now() - iv * 86400000 };
    }
  }
  save();
  return list.length;
}
export async function remove(id) {
  await del(id); delete cache[id]; delete S.anki.decks[id];
  for (const k of Object.keys(S.cards)) if (k.startsWith('a:' + id + ':')) delete S.cards[k];
  save();
}
