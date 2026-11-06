// MALSSI · couvertures et dos des boîtes de leçon, peints une fois par unité puis gardés en mémoire.
// La lumière avance avec le parcours : matin pour le hangeul, heure dorée au 3급, nuit bleue au 5급, étoiles au 6급.
import { scene, pal, rng, hashStr, mix, lum, rgba } from './paint.js';

const BASE = [0.04, 0.16, 0.3, 0.44, 0.58, 0.73, 0.88, 1];
const POOLS = [['toits', 'ruelle', 'pont', 'mer'], ['toits', 'mer', 'ruelle', 'pont'], ['toits', 'pont', 'verriere', 'ruelle', 'mer'], ['verriere', 'ruelle', 'toits', 'pont'], ['cosmos', 'toits', 'verriere', 'cosmos', 'pont']];
export const LEVEL_KO = { 0: '한글', 1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급' };
export const CW = 474, CH = 900, SW = 142 * 1.4, SH = 840 * 1.4;

export function unitTime(u, list) {
  const L = u.niveau || 0, same = list.filter(x => (x.niveau || 0) === L), k = same.indexOf(u), n = Math.max(1, same.length - 1);
  return BASE[L] + (BASE[L + 1] - BASE[L]) * (k / n) * 0.92;
}
function kindOf(u, t) {
  const pool = POOLS[t < 0.4 ? 0 : t < 0.55 ? 1 : t < 0.7 ? 2 : t < 0.86 ? 3 : 4];
  return pool[(u.n + (hashStr(u.id) % 2)) % pool.length];
}
// Titre coréen d'affiche : la ou les formes grammaticales, ou les lettres pour le hangeul
export function koTitle(u) {
  if (u.points && u.points.length) return u.points.map(p => p.f.split(' (')[0].split(' face')[0].split(' · ')[0].replace(/^Rappel : /, '').trim());
  if (u.lettres && u.lettres.length) return [u.lettres.slice(0, 5).map(l => l.j).join(' ')];
  return [u.id];
}
let fontsP = null;
export function fontsReady() {
  if (fontsP) return fontsP;
  const f = document.fonts;
  fontsP = f ? Promise.all(['700 64px "Gowun Batang"', 'italic 400 26px "Newsreader"', '400 26px "Newsreader"', '600 12px "Inter Tight"', '20px "Do Hyeon"'].map(s => f.load(s).catch(() => {}))).then(() => {}) : Promise.resolve();
  return fontsP;
}
const cache = new Map();
export const painted = u => cache.get(u.id) || null;

function fit(c, text, font, size, max) { let s = size; c.font = font.replace('$', s); while (c.measureText(text).width > max && s > 10) { s -= 2; c.font = font.replace('$', s); } return s; }
function wrap(c, text, max) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }

export function paintUnit(u, list) {
  if (cache.has(u.id)) return cache.get(u.id);
  const t = unitTime(u, list), seed = hashStr(u.id), kind = kindOf(u, t), R = rng(seed + 3);
  // --- couverture ---
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const c = cv.getContext('2d');
  const info = scene(c, CW, CH, { t, kind, seed, sunX: 0.22 + R() * 0.56 });
  const P = info.P, light = lum(P.sky[0]) > 0.24, ink = light ? '#221d3a' : '#fbf3e6', soft = light ? 'rgba(255,246,236,.55)' : 'rgba(10,12,35,.45)';
  // voile doux derrière le texte
  const g = c.createLinearGradient(0, 0, 0, 430); g.addColorStop(0, light ? 'rgba(255,248,240,.42)' : 'rgba(8,10,30,.42)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, CW, 430);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = ink;
  c.font = '600 15px "Inter Tight", sans-serif'; c.letterSpacing = '3px';
  c.fillText(`UNE LEÇON MALSSI · ${LEVEL_KO[u.niveau || 0]}`, CW / 2, 52);
  c.letterSpacing = '0px';
  const ko = koTitle(u);
  c.shadowColor = soft; c.shadowBlur = 18;
  let y = 150;
  const s1 = fit(c, ko[0], '700 $px "Gowun Batang", serif', ko[0].length > 9 ? 70 : 84, CW - 56);
  c.fillText(ko[0], CW / 2, y); y += s1 * 0.2;
  if (ko[1]) { y += 52; fit(c, ko[1], '700 $px "Gowun Batang", serif', 44, CW - 70); c.fillText(ko[1], CW / 2, y); }
  y += 54;
  c.font = 'italic 400 29px "Newsreader", Georgia, serif';
  wrap(c, u.titre, CW - 90).slice(0, 2).forEach((l, i) => c.fillText(l, CW / 2, y + i * 34));
  c.shadowBlur = 0;
  // pied : code et badge du niveau, comme sur une jaquette
  c.font = '600 16px "Inter Tight", sans-serif'; c.letterSpacing = '2px';
  const bw = c.measureText(LEVEL_KO[u.niveau || 0]).width;
  c.fillStyle = 'rgba(251,243,230,.92)'; c.fillRect(CW - 40 - bw - 26, CH - 74, bw + 26, 36); c.fillRect(30, CH - 74, 94, 36);
  c.strokeStyle = '#221d3a'; c.lineWidth = 1.5; c.strokeRect(CW - 40 - bw - 26 + 3, CH - 71, bw + 20, 30);
  c.fillStyle = '#221d3a'; c.textAlign = 'center'; c.font = '700 18px "Gowun Batang", serif'; c.fillText(LEVEL_KO[u.niveau || 0], CW - 40 - bw / 2 - 13, CH - 49);
  c.font = '600 15px "Inter Tight", sans-serif'; c.fillText(u.id, 77, CH - 50); c.letterSpacing = '0px';
  // usure du carton
  c.globalAlpha = 0.12; c.strokeStyle = '#fff'; c.lineWidth = 1; for (let i = 0; i < 18; i++) { const x = R() * CW, yy = R() * CH; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + (R() - 0.5) * 30, yy + (R() - 0.5) * 6); c.stroke(); } c.globalAlpha = 1;
  // --- dos ---
  const sp = document.createElement('canvas'); sp.width = SW | 0; sp.height = SH | 0;
  const d = sp.getContext('2d'), w = sp.width, h = sp.height;
  const board = mix(mix(P.sky[1], '#efe4d2', light ? 0.55 : 0.25), P.fg, 0.08);
  const bg = d.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, mix(board, '#000000', 0.18)); bg.addColorStop(0.12, board); bg.addColorStop(0.88, board); bg.addColorStop(1, mix(board, '#000000', 0.22));
  d.fillStyle = bg; d.fillRect(0, 0, w, h);
  // vignette illustrée en haut : un morceau de la couverture
  const iw = w - 24, ih = iw * 1.45, sx = Math.max(0, Math.min(CW - 150, info.sunX * CW - 75));
  d.drawImage(cv, sx, CH * 0.5, 150, 150 * 1.45, 12, 14, iw, ih);
  d.strokeStyle = rgba('#000000', 0.25); d.lineWidth = 1; d.strokeRect(12.5, 14.5, iw - 1, ih - 1);
  const sInk = lum(board) > 0.3 ? '#221d3a' : '#fbf3e6';
  d.fillStyle = sInk; d.textAlign = 'center';
  d.font = '600 21px "Inter Tight", sans-serif'; d.letterSpacing = '2px'; d.fillText(u.id, w / 2, ih + 52); d.letterSpacing = '0px';
  // titre vertical
  d.save(); d.translate(w / 2, ih + 80); d.rotate(Math.PI / 2);
  const avail = h - ih - 80 - 210;
  fit(d, u.titre, '400 $px "Newsreader", Georgia, serif', 50, avail);
  d.textAlign = 'left'; d.textBaseline = 'middle'; d.fillText(u.titre, 0, 0);
  d.restore();
  d.font = '700 34px "Gowun Batang", serif'; d.fillText('말씨', w / 2, h - 116);
  d.strokeStyle = sInk; d.lineWidth = 2; d.strokeRect(w / 2 - 38, h - 92, 76, 46);
  d.font = '700 24px "Gowun Batang", serif'; d.fillText(LEVEL_KO[u.niveau || 0], w / 2, h - 60);
  // usure
  d.globalAlpha = 0.08; for (let i = 0; i < w * h / 60; i++) { d.fillStyle = R() < 0.5 ? '#000' : '#fff'; d.fillRect(R() * w, R() * h, 1.2, 1.2); } d.globalAlpha = 1;
  const out = { cover: cv.toDataURL('image/jpeg', 0.88), spine: sp.toDataURL('image/jpeg', 0.88), t, kind };
  cache.set(u.id, out);
  return out;
}
