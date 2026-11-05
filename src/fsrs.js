// MALSSI · planificateur FSRS-4.5 (repris de KOTONOHA, même auteur).
// État d'une carte : s (0 nouvelle, 1 apprentissage, 2 révision, 3 réapprentissage), due (ms), st (stabilité, j),
// df (difficulté 1–10), iv (intervalle, j), r (révisions), l (oublis), lr (dernière révision), lg (dernière note).
export const MIN = 60000, DAY = 86400000;
const FW = [0.4872,1.4003,3.7145,13.8206,5.1618,1.2298,0.8975,0.031,1.6474,0.1367,1.0461,2.1072,0.0793,0.3246,1.587,0.2272,2.8755];
const FDEC = -0.5, FFAC = 19 / 81, FRET = 0.9;
const clampD = d => Math.min(10, Math.max(1, d));
const D0 = g => clampD(FW[4] - (g - 3) * FW[5]);
const R = (t, s) => Math.pow(1 + FFAC * t / s, FDEC);
const nextD = (d, g) => clampD(FW[7] * D0(4) + (1 - FW[7]) * (d - FW[6] * (g - 3)));
const recall = (d, s, r, g) => s * (1 + Math.exp(FW[8]) * (11 - d) * Math.pow(s, -FW[9]) * (Math.exp((1 - r) * FW[10]) - 1) * (g === 2 ? FW[15] : 1) * (g === 4 ? FW[16] : 1));
const forget = (d, s, r) => Math.min(s, FW[11] * Math.pow(d, -FW[12]) * (Math.pow(s + 1, FW[13]) - 1) * Math.exp((1 - r) * FW[14]));
export function startOfDay(t = Date.now()) { const d = new Date(t); d.setHours(4, 0, 0, 0); if (d.getTime() > t) d.setDate(d.getDate() - 1); return d.getTime(); }
function ivl(s, id, salt) {
  let i = s / FFAC * (Math.pow(FRET, 1 / FDEC) - 1);
  if (i >= 3 && id) { let h = 0; const k = id + ':' + salt; for (let j = 0; j < k.length; j++) h = (h * 31 + k.charCodeAt(j)) | 0; i *= 1 + ((Math.abs(h) % 11) - 5) / 100; }
  return Math.min(36500, Math.max(1, Math.round(i)));
}
// g : 1 À revoir, 2 Difficile, 3 Correct, 4 Facile
export function next(s0, g, id, now = Date.now()) {
  const s = Object.assign({ r: 0, l: 0 }, s0 || {});
  const t = s0 && s0.s && s0.lr ? Math.max(0, (now - s0.lr) / DAY) : 0;
  if (!s0 || !s0.s) {
    s.st = FW[g - 1]; s.df = D0(g);
    if (g === 4) { s.s = 2; s.iv = ivl(s.st, id, 1); }
    else { s.s = 1; s.step = g === 3 ? 1 : 0; s.due = now + (g === 1 ? 1 : g === 2 ? 6 : 10) * MIN; }
  } else if (s0.s === 1 || s0.s === 3) {
    const r = R(t, s0.st); s.df = nextD(s0.df, g);
    if (g === 1) { s.st = forget(s.df, s0.st, r); s.step = 0; s.due = now + (s0.s === 3 ? 10 : 1) * MIN; }
    else {
      if (t >= 1) s.st = recall(s.df, s0.st, r, g);
      if (g === 2) s.due = now + (s.step ? 10 : 6) * MIN;
      else if (g === 3 && s0.s === 1 && !s0.step) { s.step = 1; s.due = now + 10 * MIN; }
      else { s.s = 2; const base = ivl(s.st, id, s.r); s.iv = g === 4 ? Math.max(base, ivl(FW[2], id, s.r) + 1) : s0.s === 3 ? Math.max(1, Math.min(base, s0.iv || base)) : base; }
    }
  } else {
    const r = R(t, s0.st); s.df = nextD(s0.df, g);
    if (g === 1) { s.st = forget(s.df, s0.st, r); s.l = (s0.l || 0) + 1; s.s = 3; s.step = 0; s.due = now + 10 * MIN; }
    else {
      const st = { 2: recall(s.df, s0.st, r, 2), 3: recall(s.df, s0.st, r, 3), 4: recall(s.df, s0.st, r, 4) };
      let h = ivl(st[2], id, s.r), gd = ivl(st[3], id, s.r), e = ivl(st[4], id, s.r);
      h = Math.min(h, gd); gd = Math.max(gd, h + 1); e = Math.max(e, gd + 1);
      s.st = st[g]; s.iv = g === 2 ? h : g === 3 ? gd : e;
    }
  }
  if (s.s === 2) { s.due = startOfDay(now) + s.iv * DAY; delete s.step; }
  s.lr = now; s.r = (s0 && s0.r || 0) + 1; s.lg = g;
  s.st = +(+s.st).toFixed(3); s.df = +(+s.df).toFixed(3);
  return s;
}
export function fmtIv(ms) {
  const m = ms / MIN; if (m < 60) return Math.max(1, Math.round(m)) + ' min';
  const h = m / 60; if (h < 24) return Math.round(h) + ' h';
  const d = Math.round(h / 24); if (d < 30) return d + ' j'; if (d < 365) return Math.round(d / 30) + ' mois';
  return (d / 365).toFixed(1).replace('.', ',') + ' an' + (d >= 730 ? 's' : '');
}
export const isMature = s => !!(s && s.s === 2 && s.iv >= 21);
