// MALSSI · peintre de scènes (aucune image) dans l'esprit des films d'animation au ciel peint :
// lumière d'heure dorée, nuages modelés par le soleil, collines de Séoul aux toits-terrasses verts,
// grillages de balcon, feuilles au premier plan, nuit bleue aux lumières floues, puis la voie lactée.
// Tout dépend d'une seule variable t (0 = matin, 0,45 = heure dorée, 0,76 = nuit bleue, 1 = étoiles).
export const TAU = Math.PI * 2;
export function rng(seed) { let s = (seed >>> 0) % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
export function hashStr(str) { let h = 2166136261; for (const c of str) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const rgba = (h, a) => { const c = hx(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
export const lum = h => { const [r, g, b] = hx(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

// Images clés de la journée
const KEYS = [
  { t: 0, sky: ['#7aa2d8', '#a7c2e8', '#d8e3f0', '#f2e7dd'], cl: ['#ffffff', '#e8eef7', '#b3c1dc'], sun: '#fff7e2', sunA: 0.55, sunY: 0.16, moonA: 0, haze: '#e4e5ec', wl: '#f5f0e6', ws: '#c3c6d3', roof: ['#69a598', '#7db3a7', '#5e8fba', '#d9a78b'], win: 0, stars: 0, neb: 0, fg: '#4f5f63', leaf: '#5f8a43', leafL: '#b9cf72', rim: '#fff6e6', water: '#8fb1d8' },
  { t: 0.3, sky: ['#6d8ed0', '#9db3df', '#e7d6cb', '#f8dcb4'], cl: ['#fff3de', '#f1e4e1', '#b5afcf'], sun: '#fff0c4', sunA: 0.7, sunY: 0.34, moonA: 0, haze: '#f0dcc8', wl: '#fbe8d0', ws: '#b7a8ba', roof: ['#5f9f8f', '#77b29d', '#5b87b6', '#e0a17f'], win: 0, stars: 0, neb: 0, fg: '#463f52', leaf: '#56803d', leafL: '#d6d06e', rim: '#ffe1a6', water: '#89a7d4' },
  { t: 0.45, sky: ['#6a7ec2', '#c79cc2', '#f4a99b', '#ffd49b'], cl: ['#ffd8a0', '#f2a8aa', '#8c7db3'], sun: '#fff3c9', sunA: 0.95, sunY: 0.6, moonA: 0, haze: '#f6c2a4', wl: '#ffd6aa', ws: '#a88aa8', roof: ['#6b9d8e', '#8ab39b', '#6d86b8', '#e89b7d'], win: 0.18, stars: 0, neb: 0, fg: '#3b2f4d', leaf: '#4f6b3a', leafL: '#ffc46e', rim: '#ffc37b', water: '#c592ae' },
  { t: 0.6, sky: ['#3d4c8d', '#7a6eae', '#d98fa7', '#f6b49b'], cl: ['#f3a5a6', '#9884b7', '#535489'], sun: '#ffb98a', sunA: 0.55, sunY: 0.82, moonA: 0.3, haze: '#b88fae', wl: '#c8a3b8', ws: '#6b6591', roof: ['#4f7b80', '#5f8a86', '#4f6a9a', '#b77d87'], win: 0.55, stars: 0.18, neb: 0, fg: '#29284a', leaf: '#2f3d3e', leafL: '#ff9f8a', rim: '#ff9f8a', water: '#7a6aa0' },
  { t: 0.76, sky: ['#121a38', '#212e59', '#34457a', '#4c598b'], cl: ['#5b659c', '#2e3967', '#1d254f'], sun: '#ffb98a', sunA: 0, sunY: 1, moonA: 1, haze: '#394576', wl: '#3a4675', ws: '#252e56', roof: ['#2f4a5e', '#34516a', '#2e3d68', '#4a4060'], win: 1, stars: 0.6, neb: 0, fg: '#0e1430', leaf: '#141f2c', leafL: '#7f9ad8', rim: '#8aa2e0', water: '#22305c' },
  { t: 1, sky: ['#0a0e25', '#191a45', '#392962', '#5a3c74'], cl: ['#3a3466', '#211f48', '#141433'], sun: '#ffb98a', sunA: 0, sunY: 1, moonA: 0.6, haze: '#29224f', wl: '#2b325f', ws: '#1b2047', roof: ['#24304d', '#283652', '#232b52', '#33294a'], win: 1, stars: 1, neb: 1, fg: '#090c21', leaf: '#0f1424', leafL: '#b7a6ff', rim: '#b7a6ff', water: '#1a1c45' }];
export function pal(t) {
  t = Math.max(0, Math.min(1, t));
  let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].t <= t) i++;
  const A = KEYS[i], B = KEYS[i + 1], k = (t - A.t) / (B.t - A.t || 1), o = { t };
  for (const key in A) {
    if (key === 't') continue;
    const a = A[key], b = B[key];
    o[key] = Array.isArray(a) ? a.map((v, j) => mix(v, b[j], k)) : typeof a === 'string' ? mix(a, b, k) : a + (b - a) * k;
  }
  o.night = Math.max(0, Math.min(1, (t - 0.55) / 0.2));
  o.dark = lum(o.sky[1]) < 0.18;
  return o;
}

// ---------- Ciel ----------
export function sky(c, w, h, P, hor = 1) {
  const g = c.createLinearGradient(0, 0, 0, h * hor);
  g.addColorStop(0, P.sky[0]); g.addColorStop(0.42, P.sky[1]); g.addColorStop(0.78, P.sky[2]); g.addColorStop(1, P.sky[3]);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}
export function stars(c, R, w, h, P, n, yMax = 0.7) {
  if (P.stars < 0.02) return;
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = Math.pow(R(), 1.3) * h * yMax, big = R() < 0.05, r = big ? 1.4 + R() : 0.35 + R() * 0.8;
    c.globalAlpha = P.stars * (0.35 + R() * 0.65); c.fillStyle = R() < 0.15 ? '#ffd9ef' : R() < 0.15 ? '#cfe6ff' : '#fffaf0';
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    if (big) sparkle(c, x, y, r * 5, P.stars * 0.7);
  }
  c.globalAlpha = 1;
}
export function sparkle(c, x, y, s, a) {
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; c.fillStyle = '#fff6ff';
  c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s); c.quadraticCurveTo(x, y, x - s, y); c.fill();
  c.restore();
}
export function nebula(c, R, w, h, P) {
  if (P.neb < 0.02) return;
  c.save(); c.globalCompositeOperation = 'screen';
  const cols = ['#ff7ab6', '#5fd4ff', '#ffb36b', '#9d7bff', '#ff9f9f', '#6be3c8'];
  // bande de la voie lactée en diagonale, faite de nuages colorés
  for (let i = 0; i < 26; i++) {
    const k = R(), x = w * (-0.1 + k * 1.2), y = h * (0.62 - k * 0.5) + (R() - 0.5) * h * 0.22, r = Math.min(w, h) * (0.12 + R() * 0.3);
    const g = c.createRadialGradient(x, y, 0, x, y, r), col = cols[(R() * cols.length) | 0];
    g.addColorStop(0, rgba(col, 0.32 * P.neb)); g.addColorStop(0.5, rgba(col, 0.1 * P.neb)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // poussière d'étoiles dense le long de la bande
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < w * h / 900; i++) {
    const k = R(), x = w * (-0.1 + k * 1.2), y = h * (0.62 - k * 0.5) + (R() + R() + R() - 1.5) * h * 0.16;
    c.globalAlpha = P.neb * (0.2 + R() * 0.6); c.fillStyle = R() < 0.3 ? '#ffe4f3' : '#ffffff';
    c.fillRect(x, y, R() < 0.9 ? 1 : 1.8, R() < 0.9 ? 1 : 1.8);
  }
  c.restore();
}
export function sun(c, x, y, r, P) {
  if (P.sunA > 0.01) {
    const g = c.createRadialGradient(x, y, 0, x, y, r * 16);
    g.addColorStop(0, rgba(P.sun, 0.95 * P.sunA)); g.addColorStop(0.06, rgba(P.sun, 0.7 * P.sunA)); g.addColorStop(0.25, rgba(P.rim, 0.28 * P.sunA)); g.addColorStop(1, rgba(P.rim, 0));
    c.fillStyle = g; c.fillRect(x - r * 16, y - r * 16, r * 32, r * 32);
    c.globalAlpha = P.sunA; c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1;
  }
}
// Rayons et voile chaud qui unifient la scène (à poser après la ville)
export function glow(c, w, h, x, y, P) {
  if (P.sunA < 0.05) return;
  c.save(); c.globalCompositeOperation = 'screen';
  const g = c.createRadialGradient(x, y, 0, x, y, Math.max(w, h) * 0.9);
  g.addColorStop(0, rgba(P.rim, 0.42 * P.sunA)); g.addColorStop(0.35, rgba(P.rim, 0.16 * P.sunA)); g.addColorStop(1, rgba(P.rim, 0));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.15 + i * 0.09), L = Math.max(w, h) * 1.2, s2 = 0.025 + (i % 3) * 0.012;
    c.fillStyle = rgba(P.sun, 0.032 * P.sunA * (0.4 + P.sunY));
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - s2) * L, y + Math.sin(a - s2) * L); c.lineTo(x + Math.cos(a + s2) * L, y + Math.sin(a + s2) * L); c.fill();
  }
  c.restore();
}
export function vignette(c, w, h, P) {
  c.save(); c.globalCompositeOperation = 'multiply';
  const g = c.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.35, w / 2, h * 0.5, Math.max(w, h) * 0.8);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, rgba(mix(P.fg, P.sky[1], 0.4), 0.55));
  c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore();
}
export function moon(c, x, y, r, P) {
  if (P.moonA < 0.01) return;
  const g = c.createRadialGradient(x, y, r * 0.5, x, y, r * 5);
  g.addColorStop(0, rgba('#dfe8ff', 0.25 * P.moonA)); g.addColorStop(1, rgba('#dfe8ff', 0));
  c.fillStyle = g; c.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  c.globalAlpha = P.moonA; c.fillStyle = '#fbf6e8'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  // croissant : on mord la lune avec la couleur du ciel
  c.fillStyle = P.sky[1]; c.beginPath(); c.arc(x + r * 0.42, y - r * 0.18, r * 0.92, 0, TAU); c.fill();
  c.globalAlpha = 1;
}
export function flare(c, sx, sy, w, h, P) {
  if (P.sunA < 0.3) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const dx = w / 2 - sx, dy = h / 2 - sy;
  [[0.35, 0.05, '#ffd9a0'], [0.6, 0.025, '#9fe7ff'], [0.85, 0.07, '#ff9fd0'], [1.25, 0.035, '#fff0b0']].forEach(([k, s, col]) => {
    const x = sx + dx * k * 2, y = sy + dy * k * 2, r = Math.min(w, h) * s;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, 0.16 * P.sunA)); g.addColorStop(0.7, rgba(col, 0.08 * P.sunA)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  });
  c.restore();
}

// ---------- Nuages (cumulus peints : dessus éclairé, ventre ombré) ----------
export function cloud(c, R, x, y, cw, ch, P, sunX = 0.5) {
  const blobs = [], n = 9 + (R() * 8 | 0);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), bx = x + (u - 0.5) * cw * 0.95 + (R() - 0.5) * cw * 0.1;
    const top = Math.pow(Math.sin(u * Math.PI), 0.7) * (0.55 + R() * 0.6), r = ch * (0.3 + top * 0.55) * (0.75 + R() * 0.5);
    blobs.push([bx, y - top * ch * 0.45, r]);
  }
  // seconde couche de choux plus hauts
  for (let i = 0; i < 6; i++) { const u = 0.2 + R() * 0.6; blobs.push([x + (u - 0.5) * cw * 0.8, y - ch * (0.55 + R() * 0.55), ch * (0.28 + R() * 0.32)]); }
  c.save();
  const path = new Path2D(); blobs.forEach(([bx, by, r]) => { path.moveTo(bx + r, by); path.arc(bx, by, r, 0, TAU); });
  c.beginPath(); c.rect(x - cw, y - ch * 4, cw * 2, ch * 4 + ch * 0.3); c.clip();
  const g = c.createLinearGradient(0, y - ch * 1.4, 0, y + ch * 0.3);
  g.addColorStop(0, P.cl[0]); g.addColorStop(0.4, P.cl[1]); g.addColorStop(1, P.cl[2]);
  c.fillStyle = g; c.fill(path);
  c.globalCompositeOperation = 'source-atop';
  // ombre propre sous chaque chou
  blobs.forEach(([bx, by, r]) => { const sg = c.createRadialGradient(bx, by + r * 0.9, 0, bx, by + r * 0.9, r * 1.1); sg.addColorStop(0, rgba(P.cl[2], 0.55)); sg.addColorStop(1, rgba(P.cl[2], 0)); c.fillStyle = sg; c.fillRect(bx - r * 2, by - r, r * 4, r * 3); });
  // reflets du côté du soleil
  const lx = (sunX * 2 - 1) * 0.35;
  blobs.forEach(([bx, by, r]) => { const hx2 = bx + lx * r, hy = by - r * 0.55, hg = c.createRadialGradient(hx2, hy, 0, hx2, hy, r * 0.95); hg.addColorStop(0, rgba(P.cl[0], 0.95)); hg.addColorStop(0.6, rgba(P.cl[0], 0.35)); hg.addColorStop(1, rgba(P.cl[0], 0)); c.fillStyle = hg; c.fillRect(bx - r * 2, by - r * 2, r * 4, r * 4); });
  c.restore();
}
export function clouds(c, R, w, h, P, n, y0, y1, sunX, cs = 1) {
  c.save(); c.globalAlpha = 1 - P.night * 0.45; if (P.night > 0.2 && 'filter' in c) c.filter = `blur(${(P.night * 2.5 * Math.max(1, w / 900)).toFixed(1)}px)`;
  n = Math.max(1, Math.round(n * (1 - P.night * 0.4)));
  for (let i = 0; i < n; i++) {
    const cw = w * (0.4 + R() * 0.6) * cs, ch = cw * (0.15 + R() * 0.12);
    cloud(c, R, R() * w * 1.1 - w * 0.05, h * (y0 + R() * (y1 - y0)), cw, ch, P, sunX);
  }
  c.restore();
  // voile de cirrus
  c.save(); c.globalAlpha = 0.25; c.strokeStyle = P.cl[0]; c.lineCap = 'round';
  for (let i = 0; i < n * 2; i++) { const x = R() * w, y = h * (y0 * 0.6 + R() * 0.15), L = w * (0.1 + R() * 0.25); c.lineWidth = 1 + R() * 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + L / 2, y - 4 - R() * 6, x + L, y + R() * 4); c.stroke(); }
  c.restore();
}

// ---------- Ville ----------
// Colline de maisons basses (빌라) vues d'un toit : façade éclairée, flanc à l'ombre, toit-terrasse vert, réservoirs d'eau.
export function hillside(c, R, w, h, P, o = {}) {
  const y0 = o.y0 ?? 0.5, y1 = o.y1 ?? 1, rows = o.rows ?? 7, sc = o.scale ?? (w / 474), sunLeft = (o.sunX ?? 0.5) < 0.5;
  // colline lointaine avec sa tour
  if (o.hill !== false) {
    const hy = h * (y0 - 0.04);
    c.fillStyle = mix(P.ws, P.haze, 0.72); c.beginPath(); c.moveTo(0, hy + h * 0.05);
    for (let x = 0; x <= w; x += w / 24) c.lineTo(x, hy + Math.sin(x / w * 3.1 + 0.6) * h * 0.035 - Math.exp(-((x / w - 0.68) ** 2) / 0.02) * h * 0.06);
    c.lineTo(w, h); c.lineTo(0, h); c.fill();
    if (o.tower !== false) { const tx = w * 0.68, ty = hy - h * 0.065; c.fillStyle = mix(P.ws, P.haze, 0.6); c.fillRect(tx - 1.5 * sc, ty - 34 * sc, 3 * sc, 34 * sc); c.fillRect(tx - 6 * sc, ty - 30 * sc, 12 * sc, 6 * sc); c.fillRect(tx - 0.6 * sc, ty - 50 * sc, 1.2 * sc, 16 * sc); if (P.win > 0.3) { c.fillStyle = rgba('#ffd7a0', P.win); c.fillRect(tx - 5 * sc, ty - 28 * sc, 10 * sc, 2 * sc); } }
  }
  for (let i = 0; i < rows; i++) {
    const k = i / (rows - 1), fog = (1 - k) * 0.62, s = (0.35 + k * 0.95) * sc;
    const by = h * (y0 + (y1 - y0) * Math.pow(k, 1.25));
    let x = -R() * 40 * s;
    while (x < w + 10) {
      const tall = k < 0.45 && R() < 0.12, bw = (tall ? 34 + R() * 26 : 26 + R() * 40) * s, bh = (tall ? 90 + R() * 70 : 22 + R() * 30) * s, sd = (8 + R() * 10) * s;
      const top = by - bh + (R() - 0.5) * 8 * s;
      const near = k * k * 0.35, wl = mix(mix(R() < 0.25 ? mix(P.wl, '#f2c9b8', 0.4) : R() < 0.15 ? mix(P.wl, '#c9d9e6', 0.4) : P.wl, P.fg, near * 0.4), P.haze, fog), wsh = mix(mix(P.ws, P.fg, 0.18 + near), P.haze, fog);
      // flanc
      c.fillStyle = sunLeft ? wsh : mix(wl, P.ws, 0.15);
      c.beginPath(); if (sunLeft) { c.moveTo(x + bw, top); c.lineTo(x + bw + sd, top + sd * 0.4); c.lineTo(x + bw + sd, h); c.lineTo(x + bw, h); } else { c.moveTo(x, top); c.lineTo(x - sd, top + sd * 0.4); c.lineTo(x - sd, h); c.lineTo(x, h); } c.fill();
      // façade
      c.fillStyle = sunLeft ? wl : mix(wsh, wl, 0.35); c.fillRect(x, top, bw, h - top);
      // toit-terrasse
      const roof = mix(P.roof[(R() * P.roof.length) | 0], P.haze, fog);
      c.fillStyle = roof; c.fillRect(x - 1 * s, top - 3 * s, bw + 2 * s, 3.5 * s);
      c.fillStyle = mix(roof, '#ffffff', 0.18 * (1 - P.night)); c.fillRect(x - 1 * s, top - 3 * s, bw + 2 * s, 1 * s);
      if (!tall && R() < 0.45) { const tx = x + bw * (0.2 + R() * 0.5), tr = 4 * s; c.fillStyle = mix(R() < 0.5 ? '#e7e2d6' : '#4f8fb0', P.haze, fog + P.night * 0.5); c.fillRect(tx, top - 3 * s - tr * 1.6, tr * 2, tr * 1.6); }
      if (!tall && R() < 0.3) { c.fillStyle = mix(P.ws, P.haze, fog); c.fillRect(x + bw * 0.55, top - 9 * s, bw * 0.3, 6 * s); }
      // fenêtres
      const cols = Math.max(1, Math.floor(bw / (9 * s))), rws = Math.max(1, Math.floor(bh / (11 * s)));
      for (let r = 0; r < rws; r++) for (let q = 0; q < cols; q++) {
        if (R() < 0.3) continue;
        const wx = x + (q + 0.25) * (bw / cols), wy = top + 5 * s + r * 11 * s, ww = bw / cols * 0.5, wh = 5 * s;
        if (wy + wh > h) continue;
        const lit = R() < 0.6 * P.win;
        c.fillStyle = lit ? rgba(R() < 0.8 ? '#ffd29a' : '#bfe3ff', 0.65 + R() * 0.35) : rgba(mix(P.ws, '#3a3550', 0.4), 0.5 * (1 - fog));
        c.fillRect(wx, wy, ww, wh);
      }
      x += bw + (sunLeft ? sd : 0) + (R() < 0.3 ? 4 * s : 0);
    }
  }
}
// Grande ville : tours lointaines, pour la nuit et le fleuve
export function skylineFar(c, R, w, h, P, base, o = {}) {
  const sc = o.scale ?? w / 474;
  for (let layer = 0; layer < 2; layer++) {
    const fog = layer ? 0.15 : 0.5;
    let x = -10;
    while (x < w + 10) {
      const bw = (14 + R() * 30) * sc, bh = (30 + R() * (layer ? 110 : 150)) * sc, top = base - bh;
      c.fillStyle = mix(P.ws, P.haze, fog); c.fillRect(x, top, bw, bh + 1);
      c.fillStyle = mix(P.wl, P.haze, fog + 0.2); c.fillRect(x, top, bw * 0.12, bh);
      for (let yy = top + 4 * sc; yy < base - 3; yy += 5 * sc) for (let xx = x + 2 * sc; xx < x + bw - 2 * sc; xx += 4 * sc) if (R() < 0.4 * P.win) { c.fillStyle = rgba(R() < 0.75 ? '#ffd29a' : '#a8d8ff', 0.4 + R() * 0.5); c.fillRect(xx, yy, 1.6 * sc, 2 * sc); }
      if (R() < 0.15) { c.fillStyle = rgba('#ff6b6b', 0.8 * P.night); c.fillRect(x + bw / 2 - 1, top - 3 * sc, 2, 2); }
      x += bw + R() * 4 * sc;
    }
  }
}
export function bokeh(c, R, w, h, P, n, y0 = 0.2, y1 = 0.8, amt = P.night) {
  if (amt < 0.02) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const cols = ['#ffc27a', '#ffd9a0', '#ff8fb1', '#8fd3ff', '#ffe9b0'];
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = h * (y0 + R() * (y1 - y0)), r = Math.min(w, h) * (0.012 + R() * 0.05), col = cols[(R() * cols.length) | 0];
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, 0.3 * amt)); g.addColorStop(0.75, rgba(col, 0.22 * amt)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  c.restore();
}
// Garde-corps grillagé du toit (premier plan)
export function railing(c, w, h, P, y, o = {}) {
  const sc = o.scale ?? w / 474, col = P.fg, top = h * y, step = 16 * sc;
  c.save();
  c.strokeStyle = rgba(col, 0.75); c.lineWidth = Math.max(0.6, 0.9 * sc);
  for (let x = (o.x0 ?? 0); x < (o.x1 ?? w); x += step) { c.beginPath(); c.moveTo(x, top); c.lineTo(x, h); c.stroke(); }
  for (let yy = top + step; yy < h; yy += step) { c.beginPath(); c.moveTo(o.x0 ?? 0, yy); c.lineTo(o.x1 ?? w, yy); c.stroke(); }
  c.fillStyle = col; c.fillRect(o.x0 ?? 0, top - 3 * sc, (o.x1 ?? w) - (o.x0 ?? 0), 5 * sc);
  for (let x = (o.x0 ?? 0) + 4; x < (o.x1 ?? w); x += step * 6) c.fillRect(x, top, 4 * sc, h - top);
  c.fillStyle = rgba(P.rim, 0.55 * (1 - P.night * 0.6)); c.fillRect(o.x0 ?? 0, top - 3 * sc, (o.x1 ?? w) - (o.x0 ?? 0), 1.2 * sc);
  c.restore();
}
// Toit-terrasse peint en vert (옥상), avec son muret
export function rooftop(c, R, w, h, P, y, o = {}) {
  const sc = o.scale ?? w / 474, top = h * y;
  const floor = mix('#5f9e86', P.fg, 0.25 + P.night * 0.55);
  const g = c.createLinearGradient(0, top, 0, h); g.addColorStop(0, mix(floor, P.rim, 0.25 * (1 - P.night))); g.addColorStop(1, mix(floor, P.fg, 0.35));
  c.fillStyle = g; c.beginPath(); c.moveTo(0, top + 18 * sc); c.lineTo(w, top); c.lineTo(w, h); c.lineTo(0, h); c.fill();
  // flaque de lumière rasante
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(P.rim, 0.18 * P.sunA);
  c.beginPath(); c.moveTo(w * 0.2, top + 14 * sc); c.lineTo(w * 0.7, top + 4 * sc); c.lineTo(w * 0.95, h); c.lineTo(w * 0.35, h); c.fill(); c.restore();
  // muret
  c.fillStyle = mix(P.ws, P.fg, 0.35); c.beginPath(); c.moveTo(0, top + 4 * sc); c.lineTo(w, top - 14 * sc); c.lineTo(w, top + 2 * sc); c.lineTo(0, top + 20 * sc); c.fill();
  c.fillStyle = rgba(P.rim, 0.5 * (1 - P.night * 0.7)); c.beginPath(); c.moveTo(0, top + 4 * sc); c.lineTo(w, top - 14 * sc); c.lineTo(w, top - 12 * sc); c.lineTo(0, top + 6 * sc); c.fill();
}
export function pot(c, R, x, y, s, P) {
  const pc = mix(R() < 0.5 ? '#c96f4f' : '#e9e2d4', P.fg, 0.2 + P.night * 0.6);
  c.fillStyle = pc; c.beginPath(); c.moveTo(x - 22 * s, y - 34 * s); c.lineTo(x + 22 * s, y - 34 * s); c.lineTo(x + 16 * s, y); c.lineTo(x - 16 * s, y); c.fill();
  c.fillStyle = mix(pc, '#000000', 0.25); c.fillRect(x - 24 * s, y - 38 * s, 48 * s, 6 * s);
  c.fillStyle = rgba(P.rim, 0.35 * (1 - P.night)); c.fillRect(x - 24 * s, y - 38 * s, 48 * s, 1.5 * s);
  for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (R() - 0.5) * 2.2, L = (20 + R() * 46) * s; leaf(c, x + Math.cos(a) * L * 0.6, y - 36 * s + Math.sin(a) * L, s * (0.7 + R() * 0.6), a + Math.PI / 2 + (R() - 0.5) * 0.6, P, Math.cos(a) > 0 ? 1 : -1); }
}
// Feuille de pothos en cœur
export function leaf(c, x, y, s, ang, P, sunSide = 1) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  const p = new Path2D('M0 0 C -14 -8 -26 -26 -18 -44 C -12 -56 -3 -54 0 -46 C 3 -54 12 -56 18 -44 C 26 -26 14 -8 0 0 Z');
  const g = c.createLinearGradient(-20 * sunSide, -50, 20 * sunSide, 0);
  g.addColorStop(0, mix(P.leaf, P.leafL, 0.55 * (1 - P.night * 0.7))); g.addColorStop(1, P.leaf);
  c.fillStyle = g; c.fill(p);
  c.strokeStyle = rgba(P.leafL, 0.5); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(1, -24, 0, -46); c.stroke();
  c.strokeStyle = rgba(P.rim, 0.55 * (1 - P.night * 0.5)); c.lineWidth = 1.5; c.beginPath(); c.moveTo(18 * sunSide, -44); c.bezierCurveTo(26 * sunSide, -26, 14 * sunSide, -8, 0, 0); c.stroke();
  c.restore();
}
// Plante grimpante qui entre dans le cadre (tige courbe et feuilles)
export function vine(c, R, x, y, len, s, ang, P, sway = 0) {
  c.save(); c.strokeStyle = mix(P.leaf, '#2a2a20', 0.3); c.lineWidth = 2.2 * s; c.lineCap = 'round';
  let px = x, py = y, a = ang;
  const pts = [];
  for (let i = 0; i < 9; i++) { a += (R() - 0.5) * 0.5 + Math.sin(sway + i * 0.6) * 0.02; const nx = px + Math.cos(a) * len / 9, ny = py + Math.sin(a) * len / 9; pts.push([nx, ny, a]); px = nx; py = ny; }
  c.beginPath(); c.moveTo(x, y); pts.forEach(([nx, ny]) => c.lineTo(nx, ny)); c.stroke();
  pts.forEach(([nx, ny, na], i) => { if (i % 1 === 0) leaf(c, nx, ny, s * (0.55 + R() * 0.55), na + (i % 2 ? 1.2 : -1.2) + Math.sin(sway * 1.3 + i) * 0.06, P, i % 2 ? 1 : -1); });
  c.restore();
}
export function water(c, R, w, h, P, y0, sx) {
  const g = c.createLinearGradient(0, h * y0, 0, h);
  g.addColorStop(0, mix(P.sky[3], P.water, 0.4)); g.addColorStop(1, mix(P.water, '#101530', 0.35));
  c.fillStyle = g; c.fillRect(0, h * y0, w, h * (1 - y0));
  c.save(); c.globalCompositeOperation = 'lighter';
  const glow = P.sunA > 0.05 ? P.sun : '#ffd29a', amt = Math.max(P.sunA, P.night * 0.5);
  for (let i = 0; i < 220; i++) {
    const yy = h * y0 + Math.pow(R(), 1.6) * h * (1 - y0), spread = 0.04 + (yy / h - y0) * 0.5;
    const xx = sx + (R() - 0.5) * w * spread * 2, L = (4 + R() * 26) * (0.4 + (yy / h - y0) * 2);
    c.globalAlpha = amt * (0.2 + R() * 0.6); c.fillStyle = glow; c.fillRect(xx - L / 2, yy, L, 1 + R() * 1.5);
  }
  c.restore();
}

// ---------- Scènes complètes ----------
// kind : toits, ruelle, mer, pont, verriere, cosmos
export const KINDS = ['toits', 'ruelle', 'mer', 'pont', 'verriere', 'cosmos'];
export function kindFor(t, R) {
  const pool = t < 0.4 ? ['toits', 'ruelle', 'pont', 'mer', 'toits'] : t < 0.55 ? ['toits', 'mer', 'pont', 'ruelle', 'toits'] : t < 0.7 ? ['toits', 'pont', 'verriere', 'ruelle', 'mer'] : t < 0.88 ? ['verriere', 'ruelle', 'pont', 'toits'] : ['cosmos', 'toits', 'cosmos', 'verriere'];
  return pool[(R() * pool.length) | 0];
}
const SIGNS = ['카페', '분식', '서점', '꽃집', '노래방', '약국', '빵집', '세탁', '한식', '24시', '문구', '사진관'];
const BOARDS = ['#e8625a', '#2f8f88', '#f0b44c', '#5b7fc4', '#d9628f', '#7aa35a', '#f2ede2'];
export function scene(c, w, h, o) {
  const R = rng(o.seed || 1), P = pal(o.t), kind = o.kind || 'toits', sunX = o.sunX ?? (0.25 + R() * 0.5), sc = o.scale ?? w / 474;
  const hor = { toits: 0.55, ruelle: 0.5, mer: 0.6, pont: 0.62, verriere: 0.7, cosmos: 0.86 }[kind];
  sky(c, w, h, P, hor);
  nebula(c, R, w, h, P);
  stars(c, R, w, h, P, Math.round(w * h / 1400), hor);
  const sy = h * (0.12 + (hor - 0.12) * P.sunY) ;
  sun(c, w * sunX, sy, 12 * sc, P); moon(c, w * (1 - sunX * 0.8), h * 0.14, 11 * sc, P);
  if (kind !== 'cosmos') clouds(c, R, w, h, P, kind === 'verriere' ? 2 : 4, 0.08, hor - 0.08, sunX, o.cs ?? 1);
  if (kind === 'toits') {
    hillside(c, R, w, h, P, { y0: hor, y1: 1.0, rows: 6, scale: sc, sunX });
    bokeh(c, R, w, h, P, 18, hor, 0.95, P.night * 0.6);
    glow(c, w, h, w * sunX, sy, P);
    rooftop(c, R, w, h, P, 0.84, { scale: sc });
    railing(c, w, h, P, 0.76, { scale: sc, x1: w * (0.55 + R() * 0.3) });
    const left = R() < 0.5;
    pot(c, R, left ? w * 0.16 : w * 0.84, h * 0.97, sc * 1.3, P);
    vine(c, R, left ? -10 : w + 10, h * (0.45 + R() * 0.2), w * 0.55, sc * 1.6, left ? -0.35 : Math.PI + 0.35, P);
  } else if (kind === 'mer') {
    skylineFar(c, R, w, h * 1, P, h * hor, { scale: sc * 0.45 });
    water(c, R, w, h, P, hor, w * sunX);
    if (R() < 0.6) railing(c, w, h, P, 0.9, { scale: sc });
  } else if (kind === 'pont') {
    skylineFar(c, R, w, h, P, h * hor, { scale: sc * 0.8 });
    water(c, R, w, h, P, hor, w * sunX);
    // pont à arches sur le fleuve
    const by = h * (hor + 0.06), col = mix(P.fg, P.haze, 0.25);
    c.fillStyle = col; c.fillRect(0, by - 4 * sc, w, 5 * sc);
    c.strokeStyle = col; c.lineWidth = 2 * sc;
    for (let x = -20; x < w + 40; x += 60 * sc) { c.beginPath(); c.arc(x + 30 * sc, by + 26 * sc, 30 * sc, Math.PI, TAU); c.stroke(); c.fillRect(x, by, 3 * sc, h * 0.05); }
    for (let x = 0; x < w; x += 9 * sc) { c.fillStyle = rgba('#ffd9a0', 0.9 * Math.max(P.night, 0.15)); c.fillRect(x, by - 6 * sc, 1.8 * sc, 1.8 * sc); }
    c.fillStyle = mix(P.fg, P.leaf, 0.3); c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.9); c.quadraticCurveTo(w * 0.5, h * 0.86, w, h * 0.93); c.lineTo(w, h); c.fill();
    bokeh(c, R, w, h, P, 14, hor - 0.1, hor + 0.1);
  } else if (kind === 'ruelle') {
    // rue étroite : façades des deux côtés qui fuient vers le centre, enseignes, câbles
    const vx = w * (0.42 + R() * 0.16), vy = h * hor;
    c.fillStyle = mix(P.ws, P.haze, 0.3); c.fillRect(0, vy, w, h - vy);
    const road = c.createLinearGradient(0, vy, 0, h); road.addColorStop(0, mix(P.haze, P.ws, 0.3)); road.addColorStop(1, mix(P.ws, P.fg, 0.5));
    c.fillStyle = road; c.beginPath(); c.moveTo(vx - 6 * sc, vy); c.lineTo(vx + 6 * sc, vy); c.lineTo(w * 0.85, h); c.lineTo(w * 0.15, h); c.fill();
    for (const side of [-1, 1]) {
      for (let i = 6; i >= 0; i--) {
        const k = i / 6, x0 = vx + side * (10 + (1 - k) * 0) * sc, depth = 1 - k;
        const xa = vx + side * (14 * sc + depth * (w * 0.5)), xb = vx + side * (14 * sc + Math.max(0, depth - 0.16) * (w * 0.5));
        const top = vy - (40 + depth * 260) * sc * (0.7 + R() * 0.5), bot = vy + depth * (h - vy);
        const col = mix(i % 2 ? P.wl : mix(P.wl, P.roof[3], 0.25), P.haze, k * 0.6);
        c.fillStyle = side < 0 ? col : mix(col, P.ws, 0.35);
        c.beginPath(); c.moveTo(xa, top); c.lineTo(xb, top + (vy - top) * 0.16); c.lineTo(xb, vy + (bot - vy) * 0.84); c.lineTo(xa, bot); c.fill();
        // enseigne verticale
        if (depth > 0.15 && R() < 0.85) {
          const sx = xa - side * 8 * sc * (0.5 + depth), sh = (40 + depth * 90) * sc, sw = (10 + depth * 18) * sc, sty = top + (vy - top) * (0.25 + R() * 0.3);
          const bc = BOARDS[(R() * BOARDS.length) | 0];
          if (P.night > 0.3) { c.save(); c.shadowColor = bc; c.shadowBlur = 14 * P.night; }
          c.fillStyle = mix(bc, P.haze, k * 0.5); c.fillRect(sx - sw / 2, sty, sw, sh);
          if (P.night > 0.3) c.restore();
          const t = SIGNS[(R() * SIGNS.length) | 0], fs = sw * 0.62;
          c.fillStyle = bc === '#f2ede2' ? '#2b2540' : '#fff8ec'; c.font = `${fs}px "Do Hyeon","Gowun Batang",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          [...t].forEach((ch, j) => { const yy = sty + fs * 0.9 + j * fs * 1.1; if (yy < sty + sh - fs * 0.3) c.fillText(ch, sx, yy); });
        }
      }
    }
    // câbles électriques
    c.strokeStyle = rgba(P.fg, 0.7); c.lineWidth = 1 * sc;
    for (let i = 0; i < 4; i++) { const y = h * (0.12 + R() * 0.25); c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(w / 2, y + 30 * sc, w, y - 10 * sc + R() * 20 * sc); c.stroke(); }
    bokeh(c, R, w, h, P, 16, hor - 0.15, 0.95);
  } else if (kind === 'verriere') {
    // derrière une verrière, la ville floue ; au premier plan, un banc de béton
    skylineFar(c, R, w, h, P, h * hor, { scale: sc * 0.9 });
    bokeh(c, R, w, h, P, 40, 0.3, hor, Math.max(0.35, P.night));
    c.fillStyle = rgba(P.sky[2], 0.18); c.fillRect(0, h * 0.12, w, h * (hor - 0.12));
    const fr = mix(P.fg, P.ws, 0.25);
    c.fillStyle = fr; c.fillRect(0, h * 0.1, w, 6 * sc); c.fillRect(0, h * hor - 4 * sc, w, 8 * sc);
    for (let x = w * 0.08; x < w; x += w * 0.31) c.fillRect(x, h * 0.1, 6 * sc, h * (hor - 0.1));
    c.save(); c.globalAlpha = 0.12; c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(w * 0.2, h * 0.1); c.lineTo(w * 0.32, h * 0.1); c.lineTo(w * 0.12, h * hor); c.lineTo(w * 0.0, h * hor); c.fill(); c.restore();
    const bench = c.createLinearGradient(0, h * hor, 0, h); bench.addColorStop(0, mix(P.ws, P.haze, 0.2)); bench.addColorStop(1, mix(P.fg, P.ws, 0.4));
    c.fillStyle = bench; c.fillRect(0, h * hor + 4 * sc, w, h);
    c.fillStyle = rgba(P.rim, 0.35); c.fillRect(0, h * (hor + 0.12), w, 2 * sc);
    c.fillStyle = mix(P.fg, P.ws, 0.15); c.fillRect(0, h * (hor + 0.125), w, h * 0.05);
  } else if (kind === 'cosmos') {
    // planète rousse et silhouette de la ville en bas
    const px = w * (0.2 + R() * 0.6), py = h * (0.32 + R() * 0.2), pr = 34 * sc;
    const pg = c.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr); pg.addColorStop(0, '#ffc08a'); pg.addColorStop(0.7, '#d9644a'); pg.addColorStop(1, '#5a2340');
    c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; const halo = c.createRadialGradient(px, py, pr, px, py, pr * 2.4); halo.addColorStop(0, 'rgba(255,150,120,.25)'); halo.addColorStop(1, 'rgba(255,150,120,0)'); c.fillStyle = halo; c.fillRect(px - pr * 3, py - pr * 3, pr * 6, pr * 6); c.restore();
    skylineFar(c, R, w, h, P, h * 1.0, { scale: sc * 0.5 });
  }
  // grain de peinture
  c.save(); c.globalAlpha = 0.05; for (let i = 0; i < w * h / 160; i++) { c.fillStyle = R() < 0.5 ? '#000' : '#fff'; c.fillRect(R() * w, R() * h, 1, 1); } c.restore();
  if (kind !== 'toits') glow(c, w, h, w * sunX, sy, P);
  vignette(c, w, h, P);
  flare(c, w * sunX, sy, w, h, P);
  return { P, sunX, sy, hor };
}
