// MALSSI · paysage à l'encre (산수화) animé, dessiné pour le site.
// Couches de montagnes en lavis générées par bruit, lune et halo, pétales de prunier (매화) qui dérivent
// et suivent légèrement le pointeur. S'arrête hors écran et respecte « réduire les animations ».
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(20261105);
function ridge(w, base, amp, rough, seed) {
  // ligne de crête : somme de sinus à phases fixes (stable d'un affichage à l'autre)
  const pts = [], n = 90, ph = [seed * 1.7, seed * 3.1, seed * 5.3];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const y = base - amp * (0.55 * Math.sin(x * 3.2 + ph[0]) + 0.3 * Math.sin(x * 7.9 + ph[1]) + rough * Math.sin(x * 19 + ph[2]));
    pts.push([x * w, y]);
  }
  return pts;
}
export function inkScene(canvas, opts = {}) {
  const ctx = canvas.getContext('2d'); if (!ctx) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dark = () => opts.night || document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  let W = 0, H = 0, dpr = 1, raf = 0, visible = true, mx = 0, my = 0, t0 = performance.now();
  const petals = Array.from({ length: opts.petals ?? 46 }, () => ({ x: rnd(), y: rnd(), z: 0.4 + rnd() * 0.9, r: rnd() * 6.28, s: 0.6 + rnd() * 0.8, w: rnd() * 6.28 }));
  function resize() {
    const b = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = Math.max(1, b.width); H = Math.max(1, b.height); canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function mountains(t) {
    const night = dark();
    const layers = [
      { base: 0.62, amp: 0.16, rough: 0.12, a: night ? 0.22 : 0.16, c: night ? '120,150,190' : '78,100,130', px: 4 },
      { base: 0.72, amp: 0.13, rough: 0.16, a: night ? 0.36 : 0.26, c: night ? '70,95,140' : '52,72,104', px: 9 },
      { base: 0.84, amp: 0.10, rough: 0.2, a: night ? 0.62 : 0.42, c: night ? '24,36,62' : '30,43,69', px: 16 }];
    layers.forEach((L, k) => {
      const off = (mx - 0.5) * L.px, pts = ridge(W + 40, H * L.base, H * L.amp, L.rough, k + 1);
      const g = ctx.createLinearGradient(0, H * (L.base - L.amp), 0, H);
      g.addColorStop(0, `rgba(${L.c},${L.a})`); g.addColorStop(1, `rgba(${L.c},${L.a * 0.15})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20 + off, H);
      pts.forEach(([x, y]) => ctx.lineTo(x - 20 + off, y)); ctx.lineTo(W + 20 + off, H); ctx.closePath(); ctx.fill();
      // brume entre les couches
      const m = ctx.createLinearGradient(0, H * L.base, 0, H * (L.base + 0.12));
      m.addColorStop(0, `rgba(${night ? '17,24,39' : '230,234,225'},0)`); m.addColorStop(1, `rgba(${night ? '17,24,39' : '230,234,225'},${0.35 + 0.05 * Math.sin(t / 3000 + k)})`);
      ctx.fillStyle = m; ctx.fillRect(0, H * L.base, W, H * 0.14);
    });
  }
  function moon(t) {
    const night = dark(), cx = W * (opts.moonX ?? 0.78) + (mx - 0.5) * 6, cy = H * (opts.moonY ?? 0.26) + (my - 0.5) * 4, r = Math.min(W, H) * 0.075;
    const halo = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * (4.2 + 0.25 * Math.sin(t / 1800)));
    halo.addColorStop(0, night ? 'rgba(226,182,80,.30)' : 'rgba(180,133,26,.18)'); halo.addColorStop(1, 'rgba(226,182,80,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, r * 5, 0, 6.29); ctx.fill();
    ctx.fillStyle = night ? '#efe6c8' : '#f4ecd0'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.29); ctx.fill();
  }
  function petal(p, t) {
    const night = dark(), size = 3.2 * p.z * (opts.scale || 1);
    const x = p.x * W + Math.sin(t / 1400 + p.w) * 18 * p.z + (mx - 0.5) * 30 * p.z, y = p.y * H;
    ctx.save(); ctx.translate(x, y); ctx.rotate(p.r + t / (1600 / p.s)); ctx.globalAlpha = 0.35 + 0.5 * p.z;
    ctx.fillStyle = night ? '#f2c6cf' : '#c9727f';
    for (let k = 0; k < 5; k++) { ctx.rotate(1.2566); ctx.beginPath(); ctx.ellipse(0, -size, size * 0.62, size, 0, 0, 6.29); ctx.fill(); }
    ctx.fillStyle = night ? '#e2b650' : '#b4851a'; ctx.beginPath(); ctx.arc(0, 0, size * 0.35, 0, 6.29); ctx.fill(); ctx.restore();
  }
  function frame(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    if (opts.moon !== false) moon(t);
    mountains(t);
    petals.forEach(p => { if (!reduce) { p.y += 0.00045 * p.s * (1 + p.z); p.x += 0.00012 * Math.sin(t / 2000 + p.w); if (p.y > 1.05) { p.y = -0.05; p.x = rnd(); } } petal(p, reduce ? 0 : t); });
    if (!reduce && visible) raf = requestAnimationFrame(frame);
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(frame); });
  const move = e => { const b = canvas.getBoundingClientRect(); mx = (e.clientX - b.left) / b.width; my = (e.clientY - b.top) / b.height; };
  resize(); io.observe(canvas); addEventListener('resize', resize); addEventListener('pointermove', move, { passive: true });
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', resize); removeEventListener('pointermove', move); };
}
