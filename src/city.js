// MALSSI · Séoul peinte en code (aucune image), de l'heure dorée aux étoiles.
// Accueil : on est sur un toit-terrasse ; le défilement fait passer du couchant à la nuit bleue,
// puis la ville s'enfonce et le regard monte vers la voie lactée. Le pointeur décale les plans,
// les feuilles bougent au vent, des grains de lumière dérivent ; calm(true) apaise la scène.
import { pal, rng, sky, stars, nebula, sun, moon, clouds, hillside, glow, bokeh, rooftop, railing, pot, vine, scene, mix, rgba, TAU } from './paint.js';

const KEY_T = [0.45, 0.76, 1];
const isNight = () => document.documentElement.dataset.theme === 'dark';
function plate(w, h, dpr) { const c = document.createElement('canvas'); c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr); const x = c.getContext('2d'); x.scale(dpr, dpr); return [c, x]; }

export function cityScene(canvas, opts = {}) {
  const ctx = canvas.getContext('2d'); if (!ctx) return { stop() {}, calm() {}, t: () => 0 };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seed = opts.seed || 20261106;
  let W = 1, H = 1, dpr = 1, raf = 0, visible = true, last = performance.now(), T = 0, speed = 1, target = 1;
  let mx = 0.5, my = 0.5, emx = 0.5, emy = 0.5, mouse = null, scroll = 0, tNow = KEY_T[0];
  let plates = [], motes = [], shoot = { k: -1, wait: 6 }, buildId = 0;

  // ---------- petites scènes fixes (carte du jour, fin de l'accueil) ----------
  if (opts.small) {
    const draw = () => {
      const b = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
      W = Math.max(1, b.width); H = Math.max(1, b.height); canvas.width = W * dpr | 0; canvas.height = H * dpr | 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = opts.t ?? (isNight() ? 0.8 : 0.45);
      scene(ctx, W, H, { t, kind: opts.kind || 'toits', seed, sunX: opts.sunX ?? 0.3, scale: Math.max(0.8, Math.min(W, 1400) / 760), cs: Math.min(1, 700 / W) });
    };
    let rt = 0; const resize = () => { clearTimeout(rt); rt = setTimeout(draw, 120); };
    const mo = new MutationObserver(resize); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    addEventListener('resize', resize);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(draw);
    return { stop() { mo.disconnect(); removeEventListener('resize', resize); }, calm() {}, t: () => opts.t ?? 0.45 };
  }

  // ---------- accueil ----------
  function paintPlate(t) {
    const P = pal(t), sc = Math.max(0.9, Math.min(W, 1600) / 1050), sunX = 0.3, hor = 0.62;
    const [b, bx] = plate(W, H, 1), [cty, cx] = plate(W, H, Math.min(1.5, dpr)), [fg, fx] = plate(W, H, Math.min(1.5, dpr));
    sky(bx, W, H, P, hor);
    nebula(bx, rng(seed + 7), W, H, P);
    stars(bx, rng(seed + 8), W, H, P, Math.round(W * H / 2600), hor);
    const sy = H * (0.12 + (hor - 0.12) * P.sunY);
    sun(bx, W * sunX, sy, 16 * sc, P); moon(bx, W * 0.8, H * 0.15, 15 * sc, P);
    clouds(bx, rng(seed + 9), W, H, P, W < 700 ? 4 : 7, 0.05, hor - 0.12, sunX, W < 700 ? 1 : 0.42);
    hillside(cx, rng(seed + 10), W, H, P, { y0: hor, y1: 1.02, rows: W < 700 ? 6 : 8, scale: sc, sunX });
    glow(cx, W, H, W * sunX, sy, P);
    bokeh(cx, rng(seed + 11), W, H, P, Math.round(W / 30), hor, 0.98, P.night * 0.7);
    rooftop(fx, rng(seed + 12), W, H, P, 0.86, { scale: sc * 1.3 });
    railing(fx, W, H, P, 0.79, { scale: sc * 1.2, x0: W * 0.46, x1: W });
    pot(fx, rng(seed + 13), W * 0.09, H * 1.0, sc * 2.1, P); pot(fx, rng(seed + 14), W * 0.93, H * 1.01, sc * 1.7, P);
    return { t, P, b, cty, fg, sy };
  }
  function build() {
    const id = ++buildId;
    const r = canvas.getBoundingClientRect(); dpr = Math.min(1.75, devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = W * dpr | 0; canvas.height = H * dpr | 0; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = rng(seed + 20);
    motes = Array.from({ length: W < 700 ? 40 : 110 }, () => ({ x: R() * W, y: R() * H, vx: 0, vy: 0, r: 0.6 + R() * 1.8, p: R() * TAU }));
    plates = [paintPlate(KEY_T[0])];
    // les autres plaques se peignent ensuite, sans bloquer l'apparition
    const next = i => { if (id !== buildId || i >= KEY_T.length) return; setTimeout(() => { if (id !== buildId) return; plates[i] = paintPlate(KEY_T[i]); next(i + 1); }, 60); };
    next(1);
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    speed += (target - speed) * Math.min(1, dt * 3); T += dt * speed;
    emx += (mx - emx) * Math.min(1, dt * 4); emy += (my - emy) * Math.min(1, dt * 4);
    if (opts.scrollEl) { const r = opts.scrollEl.getBoundingClientRect(); scroll = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight))); }
    // position dans la journée
    const seg = Math.min(KEY_T.length - 2, Math.floor(scroll * (KEY_T.length - 1))), f = Math.min(1, scroll * (KEY_T.length - 1) - seg);
    const A = plates[seg] || plates[0], Bp = plates[seg + 1];
    const ease = f * f * (3 - 2 * f), k = Bp ? ease : 0;
    tNow = A.t + ((Bp ? Bp.t : A.t) - A.t) * k;
    const P = pal(tNow);
    const px = (emx - 0.5), py = (emy - 0.5);
    const lift = Math.max(0, scroll - 0.45) / 0.55, up = lift * lift * (3 - 2 * lift);
    ctx.clearRect(0, 0, W, H);
    const draw = (img, ox, oy, a = 1) => { ctx.globalAlpha = a; ctx.drawImage(img, ox - W * 0.03, oy - H * 0.03, W * 1.06, H * 1.06); };
    // ciel : légère dérive et parallaxe
    const bo = -px * 10, bv = -py * 6;
    draw(A.b, bo, bv); if (Bp) draw(Bp.b, bo, bv, k);
    ctx.globalAlpha = 1;
    // étoiles qui scintillent la nuit
    if (P.stars > 0.1) for (let i = 0; i < 40; i++) { const sx = ((i * 97.3) % 1) * W + ((i * 211) % W), sy = ((i * 53) % 62) / 100 * H; ctx.globalAlpha = P.stars * (0.5 + 0.5 * Math.sin(T * (1 + i % 3) + i)); ctx.fillStyle = '#fffaf0'; ctx.fillRect(sx % W, sy, 1.6, 1.6); }
    // étoile filante
    if (P.stars > 0.5) { shoot.wait -= dt; if (shoot.k < 0 && shoot.wait <= 0) { shoot = { k: 0, x: W * (0.2 + Math.random() * 0.6), y: H * (0.05 + Math.random() * 0.2), wait: 5 + Math.random() * 7 }; }
      if (shoot.k >= 0) { shoot.k += dt * 1.6; const L = 120, x = shoot.x + shoot.k * 260, y = shoot.y + shoot.k * 110; const g = ctx.createLinearGradient(x - L, y - L * 0.42, x, y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,250,240,${(1 - shoot.k) * 0.9})`); ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - L, y - L * 0.42); ctx.lineTo(x, y); ctx.stroke(); if (shoot.k > 1) shoot.k = -1; } }
    // ville : s'enfonce quand on lève les yeux
    const co = -px * 26, cv = -py * 10 + up * H * 0.42;
    draw(A.cty, co, cv); if (Bp) draw(Bp.cty, co, cv, k);
    // premier plan
    const fo = -px * 48, fv = -py * 14 + scroll * H * 0.08 + up * H * 0.6;
    const FA = A.fg, FB = Bp ? Bp.fg : null;
    draw(FA, fo, fv); if (FB) draw(FB, fo, fv, k);
    ctx.globalAlpha = 1;
    // pothos qui retombe du haut à gauche, il bouge au vent
    const sway = T * 0.9;
    ctx.save(); ctx.translate(fo * 1.2, fv * 0.4);
    vine(ctx, rng(seed + 30), -20, H * 0.08, Math.min(W, H) * 0.62, Math.max(1.4, W / 620), 0.75, P, sway);
    if (W > 700) vine(ctx, rng(seed + 31), W + 20, H * 0.3, Math.min(W, H) * 0.42, W / 820, Math.PI - 0.5, P, sway + 1.3);
    ctx.restore();
    // grains de lumière : poussière dorée le jour, lucioles le soir ; le pointeur les repousse
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const mc = P.night > 0.5 ? '#ffe7a8' : '#fff1cf';
    for (const p of motes) {
      let gl = 0;
      if (mouse) { const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy; if (d2 < 25600) { const d = Math.sqrt(d2) || 1, ff = 1 - d / 160; p.vx += dx / d * ff * 1.4; p.vy += dy / d * ff * 1.4; gl = ff; } }
      if (target < 0.5) { const dx = p.x - W / 2, dy = p.y - H / 2, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 0.05; p.vy += dy / d * 0.05; gl = Math.max(gl, 0.5); }
      p.vx *= 0.92; p.vy *= 0.92; p.x += p.vx + Math.sin(T * 0.5 + p.p) * 0.2 * speed; p.y += p.vy - 0.15 * speed;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      ctx.globalAlpha = Math.min(1, 0.18 + 0.35 * (0.5 + 0.5 * Math.sin(T * 2 + p.p)) + gl * 0.6);
      ctx.fillStyle = mc; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + gl), 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (opts.onT) opts.onT(tNow, scroll);
    if (!reduce && visible) raf = requestAnimationFrame(frame);
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  const move = e => { const b = canvas.getBoundingClientRect(); mx = (e.clientX - b.left) / b.width; my = (e.clientY - b.top) / b.height; mouse = { x: e.clientX - b.left, y: e.clientY - b.top }; };
  const out = () => { mouse = null; mx = 0.5; my = 0.5; };
  const onScroll = () => { if (reduce) frame(performance.now()); };
  let rt = 0; const resize = () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduce) frame(performance.now()); }, 120); };
  build(); io.observe(canvas); addEventListener('resize', resize); addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', out); addEventListener('scroll', onScroll, { passive: true });
  if (document.fonts) document.fonts.ready.then(() => { if (reduce) frame(performance.now()); });
  raf = requestAnimationFrame(frame);
  return {
    stop() { buildId++; cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', resize); removeEventListener('pointermove', move); document.removeEventListener('pointerleave', out); removeEventListener('scroll', onScroll); },
    calm(on) { target = on ? 0.18 : 1; },
    t: () => tNow
  };
}

// Barre supérieure : un immeuble sous chaque enseigne, des toits bas entre elles, la lumière du moment.
export function skyline(header) {
  const canvas = header.querySelector('.city-bg'); const ctx = canvas.getContext('2d'); if (!ctx) return () => {};
  function draw() {
    const R = rng(1106), night = isNight(), P = pal(night ? 0.78 : 0.47);
    const b = header.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    const W = b.width, H = b.height; canvas.width = W * dpr | 0; canvas.height = H * dpr | 0; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (night) for (let i = 0; i < W / 8; i++) { ctx.globalAlpha = 0.3 + R() * 0.6; ctx.fillStyle = '#fffaf0'; ctx.fillRect(R() * W, R() * H * 0.5, 1 + R() * 0.6, 1 + R() * 0.6); }
    ctx.globalAlpha = 1;
    // lueur du soleil couché derrière la ville
    const g = ctx.createRadialGradient(W * 0.3, H * 1.1, 0, W * 0.3, H * 1.1, W * 0.5); g.addColorStop(0, rgba(P.rim, night ? 0.18 : 0.55)); g.addColorStop(1, rgba(P.rim, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const signs = [...header.querySelectorAll('.sign, .brand-sign')].map(s => { const r = s.getBoundingClientRect(); return { x: r.left - b.left, w: r.width, y: r.bottom - b.top }; }).sort((a, c) => a.x - c.x);
    const bld = []; let x = -10;
    for (const s of signs) {
      while (x < s.x - 14) { const w = 18 + R() * 40; bld.push({ x, w: Math.min(w, s.x - 6 - x), top: H * (0.55 + R() * 0.3) }); x += w + 2; }
      bld.push({ x: s.x - 8, w: s.w + 16, top: s.y + 10, front: true }); x = s.x + s.w + 10;
    }
    while (x < W + 10) { const w = 20 + R() * 46; bld.push({ x, w, top: H * (0.5 + R() * 0.35) }); x += w + 2; }
    // rang lointain, brumeux
    let fx = -10; ctx.fillStyle = mix(P.ws, P.haze, 0.55);
    while (fx < W) { const w = 14 + R() * 30, h = H * (0.2 + R() * 0.25); ctx.fillRect(fx, H - h, w, h); fx += w + 1; }
    for (const o of bld) {
      const face = o.front ? mix(P.ws, P.fg, 0.35) : mix(P.wl, P.haze, 0.25), side = mix(face, P.fg, 0.3);
      ctx.fillStyle = face; ctx.fillRect(o.x, o.top, o.w, H - o.top);
      ctx.fillStyle = side; ctx.fillRect(o.x + o.w * 0.78, o.top, o.w * 0.22, H - o.top);
      ctx.fillStyle = mix(P.roof[(R() * 4) | 0], P.haze, 0.2); ctx.fillRect(o.x - 1, o.top - 2, o.w + 2, 3);
      if (!night) { ctx.fillStyle = rgba(P.rim, 0.55); ctx.fillRect(o.x, o.top, 2, H - o.top); }
      for (let wy = o.top + 8; wy < H - 4; wy += 8) for (let wx = o.x + 4; wx < o.x + o.w * 0.75 - 4; wx += 7) {
        const r = R(); if (r > 0.42) continue;
        ctx.fillStyle = night && r < 0.3 ? rgba(r < 0.25 ? '#ffd29a' : '#bfe3ff', 0.85) : rgba(mix(P.ws, '#2a2540', 0.4), 0.45);
        ctx.fillRect(wx, wy, 3, 4);
      }
    }
  }
  const ro = new ResizeObserver(draw); ro.observe(header);
  const mo = new MutationObserver(draw); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts) document.fonts.ready.then(draw);
  draw();
  return () => { ro.disconnect(); mo.disconnect(); };
}
