// MALSSI · Séoul la nuit, dessinée en code (aucune image) : ciel étoilé, nuages éclairés, lune orangée,
// trois plans d'immeubles aux fenêtres allumées, enseignes néon en hangeul, mots holographiques flottants,
// monorail qui passe, et une poussière de lumière que le pointeur repousse.
// Le défilement fait avancer la caméra dans la ville ; calm(true) ralentit tout et disperse la poussière.
const TAU = Math.PI * 2;
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const SIGNS = ['노래방', '카페', '24시', '약국', '분식', '서점', '꽃집', '빵집', '한식', 'PC방', '편의점', '세탁'];
const HOLO = ['별', '꿈', '말씨', '한글', '빛', '오늘', '사랑', '하늘'];
const NEON = ['#ff4fa0', '#49e6f2', '#ff8a4c', '#b48cff', '#c6ff6b', '#ffd36b'];

function isNight() {
  const d = document.documentElement.dataset.theme;
  return d !== 'light';
}
// Pré-rendu d'un plan d'immeubles sur un canevas hors écran (une fois par redimensionnement)
function layer(w, h, opts, R) {
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  const x = c.getContext('2d');
  const night = isNight();
  let px = -20;
  const signs = [];
  while (px < w + 20) {
    const bw = opts.minW + R() * (opts.maxW - opts.minW);
    const bh = h * (opts.minH + R() * (opts.maxH - opts.minH));
    const top = h - bh;
    x.fillStyle = opts.color; x.fillRect(px, top, bw, bh + 2);
    // toits : antennes, réservoirs, panneaux
    if (R() < 0.35) { x.fillRect(px + bw * 0.6, top - 10 - R() * 18, 2, 30); }
    if (R() < 0.25) { x.fillRect(px + bw * 0.15, top - 8, bw * 0.25, 8); }
    // fenêtres
    const cw = opts.win, gap = opts.win * 0.9;
    for (let wy = top + 8; wy < h - 6; wy += cw + gap) {
      for (let wx = px + 5; wx < px + bw - cw - 4; wx += cw + gap) {
        const r = R();
        if (r < opts.lit) {
          const warm = R() < 0.7;
          x.fillStyle = night ? (warm ? `rgba(255,${190 + R() * 40 | 0},${120 + R() * 50 | 0},${0.55 + R() * 0.4})` : `rgba(140,${200 + R() * 50 | 0},255,${0.5 + R() * 0.4})`)
            : `rgba(255,${210 + R() * 30 | 0},${160 + R() * 40 | 0},${0.35 + R() * 0.35})`;
          x.fillRect(wx, wy, cw, cw * 1.3);
        }
      }
    }
    if (opts.signs && bw > 34 && R() < 0.55) signs.push({ x: px + bw / 2, y: top + 14 + R() * Math.min(60, bh * 0.3), t: SIGNS[(R() * SIGNS.length) | 0], c: NEON[(R() * NEON.length) | 0], vert: R() < 0.55, f: R() * TAU });
    px += bw + opts.gap * R();
  }
  return { c, signs };
}

export function cityScene(canvas, opts = {}) {
  const ctx = canvas.getContext('2d'); if (!ctx) return { stop() {}, calm() {} };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = !!opts.small;
  let W = 1, H = 1, dpr = 1, raf = 0, visible = true, last = performance.now(), T = 0, speed = 1, target = 1;
  let mx = 0.5, my = 0.5, emx = 0.5, emy = 0.5, mouse = null, scroll = 0;
  let L = [], stars = [], clouds = [], dust = [], holos = [], train = { x: -2, next: 4 };
  function build() {
    const R = rng(opts.seed || 20261106);
    const b = canvas.getBoundingClientRect(); dpr = Math.min(1.75, devicePixelRatio || 1);
    W = Math.max(1, b.width); H = Math.max(1, b.height);
    canvas.width = W * dpr | 0; canvas.height = H * dpr | 0; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const night = isNight(), ww = W * 1.25;
    L = [
      { d: 0.25, y: 0.56, ...layer(ww, H * 0.5, { color: night ? '#2a2363' : '#c98aa6', minW: 26, maxW: 70, minH: 0.25, maxH: 0.75, win: 2, lit: 0.18, gap: 6 }, R) },
      { d: 0.55, y: 0.62, ...layer(ww, H * 0.5, { color: night ? '#1b1645' : '#8f5a86', minW: 34, maxW: 90, minH: 0.2, maxH: 0.8, win: 3, lit: 0.3, gap: 10, signs: !small }, R) },
      { d: 1, y: 0.7, ...layer(ww, H * 0.42, { color: night ? '#0f0c2a' : '#4e2f57', minW: 50, maxW: 130, minH: 0.25, maxH: 0.95, win: 4, lit: 0.36, gap: 14, signs: true }, R) }];
    stars = Array.from({ length: small ? 70 : 220 }, () => ({ x: R(), y: R() * 0.62, r: 0.4 + R() * 1.3, p: R() * TAU, s: 0.5 + R() * 1.5 }));
    clouds = Array.from({ length: small ? 4 : 8 }, () => { const w = W * (0.22 + R() * 0.34), h = H * (0.03 + R() * 0.04); return { x: R() * 1.3 - 0.15, y: 0.06 + R() * 0.34, v: 0.002 + R() * 0.004, a: 0.75 + R() * 0.25, img: cloudSprite(w, h, R) }; });
    dust = Array.from({ length: small ? 40 : 150 }, () => ({ x: R() * W, y: R() * H, vx: 0, vy: 0, r: 0.6 + R() * 1.8, p: R() * TAU, c: NEON[(R() * 4) | 0] }));
    const narrow = W < 700, spots = narrow ? [[0.16, 0.13], [0.84, 0.15]] : [[0.1, 0.24], [0.22, 0.12], [0.86, 0.14], [0.93, 0.36], [0.06, 0.48]];
    holos = small ? [] : spots.map(([x, y], i) => ({ t: HOLO[i], x: x + (R() - 0.5) * 0.03, y: y + (R() - 0.5) * 0.04, s: (narrow ? 22 : 26) + R() * 20, c: NEON[i % NEON.length], f: R() * TAU }));
  }
  function sky() {
    const night = isNight();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (night) { g.addColorStop(0, '#0b0a24'); g.addColorStop(0.45, '#1d1748'); g.addColorStop(0.72, '#47286a'); g.addColorStop(1, '#ff7a6b'); }
    else { g.addColorStop(0, '#6f86c9'); g.addColorStop(0.4, '#c9a4d8'); g.addColorStop(0.72, '#ffb38a'); g.addColorStop(1, '#ffd9a8'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (night) for (const s of stars) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(T * s.s + s.p));
      ctx.globalAlpha = a; ctx.fillStyle = '#fff6ff';
      ctx.beginPath(); ctx.arc(s.x * W + (emx - 0.5) * 4, s.y * H, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function moon() {
    const night = isNight();
    const cx = W * (opts.moonX ?? 0.72) + (emx - 0.5) * 10, cy = H * (opts.moonY ?? 0.3) + (emy - 0.5) * 6 - scroll * H * 0.05;
    const r = Math.min(W, H) * (small ? 0.12 : 0.15);
    const halo = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 3.2);
    halo.addColorStop(0, night ? 'rgba(255,120,70,.35)' : 'rgba(255,200,140,.45)'); halo.addColorStop(1, 'rgba(255,120,70,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 3.2, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, night ? '#ffb27a' : '#fff1d6'); g.addColorStop(0.7, night ? '#ff7a45' : '#ffd08a'); g.addColorStop(1, night ? '#e2512f' : '#ffb26a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#7a2a1a';
    [[-0.3, -0.1, 0.18], [0.25, 0.2, 0.12], [0.05, -0.4, 0.09], [0.35, -0.25, 0.07]].forEach(([a, b2, s]) => { ctx.beginPath(); ctx.arc(cx + a * r, cy + b2 * r, s * r, 0, TAU); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
  function cloudSprite(w, h, R) {
    // nuage peint : ellipses aplaties, flou léger, bord supérieur éclairé par la lune, dessous rosé
    const c = document.createElement('canvas'); c.width = Math.ceil(w + 40); c.height = Math.ceil(h * 3.4 + 40); const x = c.getContext('2d');
    const night = isNight(), n = 10 + (R() * 6 | 0), blobs = [];
    for (let i = 0; i < n; i++) { const rx = w * (0.08 + R() * 0.14), ry = h * (0.25 + R() * 0.4); blobs.push([20 + rx + R() * (w - 2 * rx), 20 + h * 0.6 + ry + R() * h * 0.9, rx, ry]); }
    if ('filter' in x) x.filter = 'blur(5px)';
    const pass = (col, dy) => { x.fillStyle = col; blobs.forEach(([bx, by, rx, ry]) => { x.beginPath(); x.ellipse(bx, by + dy, rx, ry, 0, 0, TAU); x.fill(); }); };
    pass(night ? 'rgba(255,105,150,.30)' : 'rgba(255,170,140,.45)', h * 0.18);
    pass(night ? 'rgba(46,38,104,.92)' : 'rgba(255,236,236,.85)', 0);
    pass(night ? 'rgba(150,132,230,.22)' : 'rgba(255,255,255,.5)', -h * 0.14);
    return c;
  }
  function cloudsDraw(dt) {
    for (const c of clouds) {
      c.x += c.v * dt * speed; if (c.x > 1.25) c.x = -0.45;
      if (!c.img) continue;
      ctx.globalAlpha = c.a; ctx.drawImage(c.img, c.x * W - c.img.width / 2 + (emx - 0.5) * 8, c.y * H - c.img.height / 2 - scroll * H * 0.08);
    }
    ctx.globalAlpha = 1;
  }
  function roof() {
    // garde-corps du toit au premier plan
    if (small) return;
    const y = H * 0.93 + scroll * H * 0.05, night = isNight();
    ctx.fillStyle = night ? '#090719' : '#3d2448'; ctx.fillRect(0, y, W, H - y + 2);
    ctx.fillStyle = night ? 'rgba(255,79,160,.35)' : 'rgba(255,200,160,.5)'; ctx.fillRect(0, y, W, 1.5);
    ctx.fillStyle = night ? '#0d0a24' : '#4a2c55';
    ctx.fillRect(0, y - 26, W, 3);
    for (let px = 12; px < W; px += 46) ctx.fillRect(px, y - 26, 3, 26);
  }
  function layers() {
    // la caméra avance avec le défilement : chaque plan grossit autour d'un point de fuite, les plans proches plus vite
    for (const l of L) {
      const z = 1 + scroll * 0.5 * l.d, ox = (emx - 0.5) * 40 * l.d + (Math.sin(T * 0.05) * 18 * l.d);
      const w = l.c.width, h = l.c.height, x = W / 2 - (w * z) / 2 - ox, y = H * l.y - (h * (z - 1)) * 0.3 + (emy - 0.5) * 10 * l.d + scroll * H * 0.12 * l.d;
      ctx.drawImage(l.c, x, y, w * z, h * z);
      if (l.signs.length) for (const s of l.signs) {
        const sx = x + s.x * z, sy = y + s.y * z; if (sx < -40 || sx > W + 40) continue;
        const fl = 0.75 + 0.25 * Math.sin(T * 7 + s.f) * (Math.sin(T * 0.7 + s.f) > 0.97 ? 1 : 0.15);
        ctx.save(); ctx.globalAlpha = fl; ctx.shadowColor = s.c; ctx.shadowBlur = 12; ctx.fillStyle = s.c;
        ctx.font = `${Math.round((l.d > 0.8 ? 15 : 11) * z)}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center';
        if (s.vert) [...s.t].forEach((ch, i) => ctx.fillText(ch, sx, sy + i * 15 * z * (l.d > 0.8 ? 1 : 0.75)));
        else ctx.fillText(s.t, sx, sy);
        ctx.restore();
      }
      if (l.d === 0.55) trainDraw(y + h * 0.42 * z, z);
    }
  }
  function trainDraw(ty, z) {
    if (small) return;
    ctx.fillStyle = isNight() ? 'rgba(30,24,70,.9)' : 'rgba(90,60,90,.8)'; ctx.fillRect(0, ty, W, 4 * z);
    for (let px = 20; px < W; px += 140) ctx.fillRect(px, ty, 5, H);
    if (train.x > -1) {
      const tw = W * 0.32, tx = train.x * (W + tw) - tw;
      ctx.fillStyle = isNight() ? '#2c2560' : '#6d4a74'; ctx.fillRect(tx, ty - 16 * z, tw, 15 * z);
      ctx.fillStyle = isNight() ? 'rgba(160,240,255,.85)' : 'rgba(255,240,210,.9)';
      for (let k = tx + 8; k < tx + tw - 10; k += 16) ctx.fillRect(k, ty - 12 * z, 9, 6 * z);
    }
  }
  function holoDraw() {
    for (const h of holos) {
      const x = h.x * W + (emx - 0.5) * 18, y = h.y * H + Math.sin(T * 0.8 + h.f) * 6 - scroll * H * 0.15;
      ctx.save(); ctx.globalAlpha = 0.55 + 0.2 * Math.sin(T * 3 + h.f); ctx.shadowColor = h.c; ctx.shadowBlur = 18;
      ctx.strokeStyle = h.c; ctx.lineWidth = 1.2; ctx.font = `${h.s}px "Do Hyeon", sans-serif`; ctx.textAlign = 'center';
      ctx.strokeText(h.t, x, y);
      // lignes de balayage de l'hologramme
      ctx.globalAlpha *= 0.35; ctx.fillStyle = h.c;
      for (let k = -h.s * 0.7; k < h.s * 0.2; k += 4) ctx.fillRect(x - h.s * 0.9, y + k, h.s * 1.8, 1);
      ctx.restore();
    }
  }
  function dustDraw(dt) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of dust) {
      // le pointeur repousse les grains, les plus proches s'illuminent
      let glow = 0;
      if (mouse) { const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, R2 = 160 * 160; if (d2 < R2) { const d = Math.sqrt(d2) || 1, f = (1 - d / 160); p.vx += dx / d * f * 1.6; p.vy += dy / d * f * 1.6; glow = f; } }
      if (target < 0.5) { const dx = p.x - W / 2, dy = p.y - H / 2, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 0.05; p.vy += dy / d * 0.05; glow = Math.max(glow, 0.6); }
      p.vx *= 0.92; p.vy *= 0.92; p.x += p.vx + Math.sin(T * 0.5 + p.p) * 0.15 * speed; p.y += p.vy - 0.12 * speed * dt * 60 / 60;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(T * 2 + p.p)) + glow * 0.6;
      ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + glow * 1.4), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    speed += (target - speed) * Math.min(1, dt * 3);
    T += dt * speed;
    emx += (mx - emx) * Math.min(1, dt * 4); emy += (my - emy) * Math.min(1, dt * 4);
    if (opts.scrollEl) { const r = opts.scrollEl.getBoundingClientRect(); scroll = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight))); }
    train.next -= dt * speed; if (train.x < 0 && train.next <= 0) { train.x = 0; }
    if (train.x >= 0) { train.x += dt * speed * 0.09; if (train.x > 1) { train.x = -2; train.next = 9 + Math.random() * 8; } }
    sky(); moon(); cloudsDraw(dt); holoDraw(); layers();
    // brume au pied des immeubles
    const fog = ctx.createLinearGradient(0, H * 0.82, 0, H);
    fog.addColorStop(0, 'rgba(14,11,42,0)'); fog.addColorStop(1, isNight() ? 'rgba(14,11,42,.85)' : 'rgba(255,227,201,.7)');
    ctx.fillStyle = fog; ctx.fillRect(0, H * 0.82, W, H * 0.18);
    roof(); dustDraw(dt);
    if (!reduce && visible) raf = requestAnimationFrame(frame);
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  const move = e => { const b = canvas.getBoundingClientRect(); mx = (e.clientX - b.left) / b.width; my = (e.clientY - b.top) / b.height; mouse = { x: e.clientX - b.left, y: e.clientY - b.top }; };
  const out = () => { mouse = null; mx = 0.5; my = 0.5; };
  let rt = 0; const resize = () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduce) frame(performance.now()); }, 80); };
  const theme = new MutationObserver(resize); theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  build(); io.observe(canvas); addEventListener('resize', resize); addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', out);
  // les polices des enseignes peuvent arriver après le premier rendu
  if (document.fonts) document.fonts.ready.then(() => { if (reduce) frame(performance.now()); });
  raf = requestAnimationFrame(frame);
  return {
    stop() { cancelAnimationFrame(raf); io.disconnect(); theme.disconnect(); removeEventListener('resize', resize); removeEventListener('pointermove', move); document.removeEventListener('pointerleave', out); },
    calm(on) { target = on ? 0.18 : 1; }
  };
}

// Bandeau de la barre supérieure : un immeuble sous chaque enseigne, des immeubles bas entre elles,
// un ciel étoilé et le monorail qui traverse de temps en temps.
export function skyline(header) {
  const canvas = header.querySelector('.city-bg'); const ctx = canvas.getContext('2d'); if (!ctx) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 1, H = 1, dpr = 1, bld = [], stars = [], raf = 0, T = 0, last = performance.now(), tx = -1, wait = 6;
  function build() {
    const R = rng(1106);
    const b = header.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = b.width; H = b.height; canvas.width = W * dpr | 0; canvas.height = H * dpr | 0; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const signs = [...header.querySelectorAll('.sign, .brand-sign')].map(s => { const r = s.getBoundingClientRect(); return { x: r.left - b.left, w: r.width, y: r.bottom - b.top }; });
    bld = [];
    let x = -10;
    const night = isNight();
    const sorted = signs.sort((a, c) => a.x - c.x);
    for (const s of sorted) {
      while (x < s.x - 14) { const w = 18 + R() * 40; bld.push({ x, w: Math.min(w, s.x - 6 - x), top: H * (0.55 + R() * 0.3), back: true }); x += w + 2; }
      bld.push({ x: s.x - 8, w: s.w + 16, top: s.y + 10, front: true }); x = s.x + s.w + 10;
    }
    while (x < W + 10) { const w = 20 + R() * 46; bld.push({ x, w, top: H * (0.5 + R() * 0.35), back: true }); x += w + 2; }
    bld.forEach(o => { o.wins = []; for (let wy = o.top + 8; wy < H - 4; wy += 7) for (let wx = o.x + 4; wx < o.x + o.w - 5; wx += 7) if (R() < (o.front ? 0.3 : 0.2)) o.wins.push([wx, wy, R() < 0.75, R() * TAU]); });
    stars = Array.from({ length: Math.round(W / 9) }, () => ({ x: R() * W, y: R() * H * 0.45, r: 0.4 + R(), p: R() * TAU }));
    canvas.dataset.night = night ? '1' : '0';
  }
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    const night = isNight();
    ctx.clearRect(0, 0, W, H);
    if (night) for (const s of stars) { ctx.globalAlpha = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(T * 1.5 + s.p)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, s.r, s.r); }
    ctx.globalAlpha = 1;
    // monorail derrière les immeubles de premier plan
    const ty = H * 0.62;
    ctx.fillStyle = night ? '#241d55' : '#b98aa2'; ctx.fillRect(0, ty, W, 3);
    wait -= dt; if (tx < 0 && wait <= 0) tx = 0;
    if (tx >= 0) { tx += dt * 0.06; const tw = Math.min(260, W * 0.3), x = tx * (W + tw) - tw;
      ctx.fillStyle = night ? '#2f2766' : '#8f6a8c'; ctx.fillRect(x, ty - 11, tw, 10);
      ctx.fillStyle = night ? 'rgba(150,240,255,.9)' : 'rgba(255,245,220,.95)'; for (let k = x + 6; k < x + tw - 8; k += 12) ctx.fillRect(k, ty - 9, 7, 4);
      if (tx > 1) { tx = -1; wait = 14 + Math.random() * 10; } }
    for (const o of bld) {
      ctx.fillStyle = o.front ? (night ? '#130f33' : '#5b3a63') : (night ? '#1e1848' : '#a5759a');
      ctx.fillRect(o.x, o.top, o.w, H - o.top);
      if (o.front) { ctx.fillRect(o.x + 4, o.top - 3, o.w - 8, 3); }
      for (const [wx, wy, warm, p] of o.wins) {
        const a = 0.55 + 0.35 * Math.sin(T * 0.4 + p);
        ctx.fillStyle = warm ? `rgba(255,196,130,${night ? a : a * 0.6})` : `rgba(140,220,255,${night ? a : a * 0.5})`;
        ctx.fillRect(wx, wy, 3, 4);
      }
    }
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  const ro = new ResizeObserver(() => { build(); if (reduce) draw(performance.now()); });
  ro.observe(header);
  const theme = new MutationObserver(() => { build(); if (reduce) draw(performance.now()); }); theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts) document.fonts.ready.then(() => build());
  build(); raf = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); theme.disconnect(); };
}
