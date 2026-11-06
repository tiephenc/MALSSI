// MALSSI · un prisme de verre qui décompose un faisceau blanc en arc-en-ciel (optique 2D, dessiné en code).
// Méthode décrite dans le prompt « halo » : dispersion de Cauchy n(λ) = 1,2 + 0,1/λ², 72 longueurs d'onde,
// réfraction de Snell vectorielle, partage de Fresnel, réflexion totale interne, chemins regroupés pour remplir
// des bandes continues, halo lumineux par trois passes floues. Le pointeur oriente le faisceau.
const TAU = Math.PI * 2;
const NL = 72, L0 = 410, L1 = 695;
function spectral(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 30; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else { r = 1; }
  const f = nm < 420 ? 0.4 + 0.6 * (nm - 380) / 40 : nm > 680 ? 0.4 + 0.6 * (720 - nm) / 40 : 1;
  return [Math.max(0, r) * f, Math.max(0, g) * f, Math.max(0, b) * f];
}
const WL = Array.from({ length: NL }, (_, i) => { const nm = L0 + (L1 - L0) * i / (NL - 1), um = nm / 1000; return { nm, n: 1.2 + 0.1 / (um * um), v: spectral(nm) }; });
(() => { // couleurs « équilibrées » : la somme de toutes les longueurs d'onde donne du blanc
  const S = [0, 0, 0]; WL.forEach(w => w.v.forEach((c, k) => S[k] += c));
  WL.forEach(w => { const c = w.v.map((x, k) => x / S[k]); const m = Math.max(...c) || 1; w.wb = c.map(x => x / m); w.wgt = m; });
})();
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, s) => [a[0] * s, a[1] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1], norm = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function prismScene(canvas, opts = {}) {
  const ctx = canvas.getContext('2d'); if (!ctx) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  const hasFilter = 'filter' in ctx;
  let W = 1, H = 1, dpr = 1, P = null, raf = 0, visible = true, last = performance.now(), T = 0, idle = 0;
  let aim = [0.45, 0.5], tgt = [0.45, 0.5];
  const motes = Array.from({ length: 70 }, () => ({ t: Math.random(), o: Math.random() * 2 - 1, r: 0.5 + Math.random() * 1.1, p: Math.random() * TAU, v: 0.02 + Math.random() * 0.05 }));
  function layout() {
    const b = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, W < 820 ? 1.5 : 2);
    W = Math.max(1, b.width); H = Math.max(1, b.height);
    [canvas, off].forEach(c => { c.width = W * dpr | 0; c.height = H * dpr | 0; });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const S = Math.min(W * 0.62, H * 0.66), cx = W * (opts.cx ?? 0.5), cy = H * 0.55, R = S / Math.sqrt(3);
    const v = [[cx, cy - R], [cx + S / 2, cy + R / 2], [cx - S / 2, cy + R / 2]];
    const edges = [0, 1, 2].map(i => { const a = v[i], b2 = v[(i + 1) % 3], d = norm(sub(b2, a)); let n = [d[1], -d[0]]; if (dot(n, sub(a, [cx, cy])) < 0) n = mul(n, -1); return { a, b: b2, n }; });
    P = { S, cx, cy, v, edges, far: Math.hypot(W, H) * 1.5 };
  }
  function hit(o, d) {
    let best = null;
    P.edges.forEach((e, i) => {
      const s = sub(e.b, e.a), den = d[0] * s[1] - d[1] * s[0]; if (Math.abs(den) < 1e-9) return;
      const w = sub(e.a, o), t = (w[0] * s[1] - w[1] * s[0]) / den, u = (w[0] * d[1] - w[1] * d[0]) / den;
      if (t > 1e-4 && u >= 0 && u <= 1 && (!best || t < best.t)) best = { t, i, p: add(o, mul(d, t)) };
    });
    return best;
  }
  function trace(o, d, n, e, inside, depth, key, out, glints) {
    const h = hit(o, d);
    if (!h) { out.push({ a: o, b: add(o, mul(d, P.far)), e, inside, key }); return; }
    out.push({ a: o, b: h.p, e, inside, key });
    if (depth >= 7) return;
    const E = P.edges[h.i], N = inside ? mul(E.n, -1) : E.n, n1 = inside ? n : 1, n2 = inside ? 1 : n, eta = n1 / n2;
    const cosi = -dot(N, d), k = 1 - eta * eta * (1 - cosi * cosi);
    glints.add(h.i);
    const r = norm(add(d, mul(N, 2 * cosi)));
    if (k < 0) { if (e > 0.12) trace(h.p, r, n, e, inside, depth + 1, key + 'R' + h.i, out, glints); return; }
    const cost = Math.sqrt(k), t = norm(add(mul(d, eta), mul(N, eta * cosi - cost)));
    const rs = ((n1 * cosi - n2 * cost) / (n1 * cosi + n2 * cost)) ** 2, rp = ((n1 * cost - n2 * cosi) / (n1 * cost + n2 * cosi)) ** 2, Rf = (rs + rp) / 2;
    if (e * (1 - Rf) > 0.08) trace(h.p, t, n, e * (1 - Rf), !inside, depth + 1, key + 'T' + h.i, out, glints);
    if (e * Rf > 0.12) trace(h.p, r, n, e * Rf, inside, depth + 1, key + 'R' + h.i, out, glints);
  }
  function lamp() {
    const y = aim[0], x = aim[1];
    const inc = (y < 0.5 ? -35 + (60 + 35) * (y / 0.5) : 60 + 15 * ((y - 0.5) / 0.5)) * Math.PI / 180;
    const e0 = P.edges[0], dir = norm(rot(mul(e0.n, -1), inc));
    const entry = lerp(e0.a, e0.b, 0.08 + 0.84 * x);
    return { dir, entry, src: sub(entry, mul(dir, P.far)) };
  }
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; idle += dt;
    if ((W < 820 || idle > 6) && !reduce) { const a = T * TAU / 18; tgt = [0.5 + 0.34 * Math.sin(a), 0.5 + 0.34 * Math.cos(a)]; }
    const kL = 1 - Math.pow(1 - 0.12, dt * 60); aim = [aim[0] + (tgt[0] - aim[0]) * kL, aim[1] + (tgt[1] - aim[1]) * kL];
    const night = document.documentElement.dataset.theme !== 'light';
    const L = lamp(), segs = WL.map(() => []), glints = new Set();
    WL.forEach((w, i) => trace(L.src, L.dir, w.n, 1, false, 0, '', segs[i], glints));
    // lumière sur le canevas hors écran, en mode additif
    octx.clearRect(0, 0, W, H); octx.globalCompositeOperation = 'lighter'; octx.lineCap = 'round';
    const m = W < 820 ? 0.8 : 1;
    octx.strokeStyle = 'rgba(255,255,255,.3)'; octx.lineWidth = 12 * m; octx.beginPath(); octx.moveTo(...L.src); octx.lineTo(...L.entry); octx.stroke();
    octx.strokeStyle = '#fff'; octx.lineWidth = 4.5 * m; octx.stroke();
    motes.forEach(mo => { mo.t = (mo.t + mo.v * dt) % 1; const along = lerp(L.entry, add(L.entry, mul(L.dir, -Math.min(P.far, W))), mo.t), side = [-L.dir[1], L.dir[0]], spread = 6 + mo.t * 40;
      const p = add(along, mul(side, mo.o * spread)); octx.globalAlpha = (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(T * 3 + mo.p))) * 0.75; octx.fillStyle = '#fff'; octx.beginPath(); octx.arc(p[0], p[1], mo.r, 0, TAU); octx.fill(); });
    octx.globalAlpha = 1;
    // regroupement par chemin (suite de faces) pour remplir des bandes entre longueurs d'onde voisines
    const groups = new Map();
    segs.forEach((list, i) => list.forEach(s => { if (!s.key) return; let g = groups.get(s.key); if (!g) groups.set(s.key, g = []); g[i] = s; }));
    groups.forEach(g => {
      for (let i = 0; i < NL - 1; i++) {
        const s0 = g[i], s1 = g[i + 1]; if (!s0 || !s1) continue;
        const [r, gg, b] = WL[i].v, alpha = s0.e * (s0.inside ? 0.5 : 0.6);
        if (s0.inside) octx.fillStyle = `rgba(${r * 255 | 0},${gg * 255 | 0},${b * 255 | 0},${alpha})`;
        else { const gr = octx.createLinearGradient(...s0.a, ...s0.b); const c = `${r * 255 | 0},${gg * 255 | 0},${b * 255 | 0}`;
          gr.addColorStop(0, `rgba(${c},${alpha})`); gr.addColorStop(0.3, `rgba(${c},${alpha * 0.75})`); gr.addColorStop(0.7, `rgba(${c},${alpha * 0.25})`); gr.addColorStop(1, `rgba(${c},0)`); octx.fillStyle = gr; }
        octx.beginPath(); octx.moveTo(...s0.a); octx.lineTo(...s0.b); octx.lineTo(...s1.b); octx.lineTo(...s1.a); octx.closePath(); octx.fill();
      }
      g.forEach((s, i) => { if (!s) return; const w = WL[i]; octx.strokeStyle = `rgba(${w.wb[0] * 255 | 0},${w.wb[1] * 255 | 0},${w.wb[2] * 255 | 0},${Math.min(1, w.wgt * s.e * 2.2)})`; octx.lineWidth = s.inside ? 4 : 3.4; octx.beginPath(); octx.moveTo(...s.a); octx.lineTo(...(s.inside ? s.b : lerp(s.a, s.b, 0.35))); octx.stroke(); });
    });
    glints.forEach(i => { const e = P.edges[i], mid = lerp(e.a, e.b, 0.5), gr = octx.createRadialGradient(mid[0], mid[1], 0, mid[0], mid[1], 0.2 * P.S * 2);
      gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); octx.strokeStyle = gr; octx.lineWidth = 2; octx.beginPath(); octx.moveTo(...e.a); octx.lineTo(...e.b); octx.stroke(); });
    octx.fillStyle = '#fff'; octx.beginPath(); octx.arc(...L.entry, 2.6, 0, TAU); octx.fill();
    octx.globalCompositeOperation = 'source-over';
    // composition : verre fumé, puis lumière floutée, puis arêtes du verre
    ctx.clearRect(0, 0, W, H);
    const [A, B, Cc] = P.v;
    const glass = ctx.createLinearGradient(A[0], A[1], P.cx, Cc[1]);
    glass.addColorStop(0, night ? 'rgba(120,110,190,.22)' : 'rgba(255,255,255,.35)'); glass.addColorStop(1, night ? 'rgba(40,30,90,.35)' : 'rgba(200,170,220,.35)');
    ctx.fillStyle = glass; ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...B); ctx.lineTo(...Cc); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'screen';
    if (hasFilter) [[34, 0.6], [12, 0.9], [3.2, 1]].forEach(([b2, a]) => { ctx.filter = `blur(${b2}px)`; ctx.globalAlpha = a; ctx.drawImage(off, 0, 0, W, H); });
    else { ctx.globalAlpha = 1; ctx.drawImage(off, 0, 0, W, H); }
    ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = night ? 'rgba(230,220,255,.45)' : 'rgba(60,30,80,.35)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(...B); ctx.lineTo(...Cc); ctx.closePath(); ctx.stroke();
    if (!reduce && visible) raf = requestAnimationFrame(draw);
  }
  const move = e => { if (e.isPrimary === false) return; const b = canvas.getBoundingClientRect(); if (e.clientY < b.top - 200 || e.clientY > b.bottom + 200) return; idle = 0; tgt = [Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)), Math.min(1, Math.max(0, (e.clientX - b.left) / b.width))]; };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible) { last = performance.now(); raf = requestAnimationFrame(draw); } });
  let rt = 0; const resize = () => { clearTimeout(rt); rt = setTimeout(() => { layout(); if (reduce) draw(performance.now()); }, 60); };
  layout(); io.observe(canvas); addEventListener('resize', resize); addEventListener('pointermove', move, { passive: true });
  raf = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', resize); removeEventListener('pointermove', move); };
}
