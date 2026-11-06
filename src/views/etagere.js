// MALSSI · le parcours en étagère de boîtes : chaque unité est une boîte debout, dos visible.
// La boîte active pivote en 3D pour montrer sa couverture peinte ; un clic ouvre une feuille qui grandit
// depuis la couverture jusqu'au plein écran, où l'affiche apparaît en taches d'encre.
// Une seule boucle requestAnimationFrame et l'API Web Animations ; aucune animation d'opacité.
import { C } from '../content.js';
import { S } from '../store.js';
import { $, $$, esc, onLeave } from '../ui.js';
import { magpie } from '../magpie.js';
import { paintUnit, painted, fontsReady, unitTime, koTitle, LEVEL_KO } from '../covers.js';
import { pal, lum } from '../paint.js';

const EASE = 'cubic-bezier(.2,.8,.2,1)';
const BLOBS = [[150, 330, 0], [340, 600, 120], [250, 120, 220], [90, 760, 300], [400, 250, 360], [260, 860, 420], [230, 470, 180]];
let lastIndex = null;
const sstep = x => x * x * (3 - 2 * x);
const B = r => Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;
function status(u) {
  const st = S.units[u.id];
  if (st && st.done) return st.best != null ? `Terminée · ${st.best} %` : 'Terminée';
  return st ? 'Commencée' : 'À faire';
}

export function viewEtagere(el) {
  const U = C.units, N = U.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  const done = U.filter(u => S.units[u.id] && S.units[u.id].done).length;
  const cur = U.find(u => !(S.units[u.id] && S.units[u.id].done)) || U[N - 1];
  const start = lastIndex != null ? lastIndex : cur.n;
  const tabs = C.etapes.map(e => [LEVEL_KO[e.niveau || 0], e.unites[0].n, e.niveau || 0]);
  document.body.classList.add('is-shelf');
  el.innerHTML = `
  <div class="sv" aria-label="Parcours">
    <div class="sv-sky" aria-hidden="true"><i class="sv-stars"></i></div>
    <nav class="sv-tabs" aria-label="Niveaux"><span class="sv-ind" aria-hidden="true"></span>${tabs.map(([l, n, lv]) => `<button class="lbl box" type="button" data-n="${n}" data-lv="${lv}"><span class="ko">${l}</span></button>`).join('')}</nav>
    <section class="sv-shelf" aria-label="Étagère des unités"><div class="sv-stage"></div></section>
    <button class="sv-play" type="button" aria-label="Ouvrir l'unité"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1 L11 6 L2 11Z"/></svg></button>
    <div class="sv-cap" aria-live="polite">
      <div class="m t"></div><div class="m s lbl"></div><div class="m y"></div>
    </div>
    <button class="sv-arr l" type="button" aria-label="Unité précédente"><svg viewBox="0 0 18 10" aria-hidden="true"><path d="M5 1 L1 5 L5 9 M1 5 H17"/></svg></button>
    <button class="sv-arr r" type="button" aria-label="Unité suivante"><svg viewBox="0 0 18 10" aria-hidden="true"><path d="M13 1 L17 5 L13 9 M17 5 H1"/></svg></button>
    <footer class="sv-foot lbl"><span>${done} / ${N} unités terminées</span><a href="#/parcours/liste">Vue liste</a></footer>
  </div>
  <div class="sv-detail" role="dialog" aria-modal="true" aria-labelledby="svd-t" hidden>
    <button class="lbl box sv-close" type="button">Fermer / <span class="ko">닫기</span></button>
    <div class="sv-logo">${magpie(26, { label: '' })}<b class="ko">말씨</b></div>
    <div class="sv-dgrid">
      <div class="sv-dtxt">
        <div class="m"><p class="lbl acc" id="svd-s"></p></div>
        <div class="m"><h2 id="svd-t"></h2></div>
        <div class="m"><p class="lbl muted" id="svd-m"></p></div>
        <div class="m"><p class="syn" id="svd-y"></p></div>
        <div class="m"><p class="words ko" id="svd-w"></p></div>
        <div class="m"><p class="credit" id="svd-c"></p></div>
        <div class="m"><a class="lbl box sv-watch" id="svd-go" href="#/">Ouvrir la leçon / <span class="ko">수업 시작</span></a></div>
      </div>
      <div class="sv-poster" aria-hidden="true">
        <svg viewBox="0 0 474 900"><defs>
          <filter id="svink" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="120" xChannelSelector="R" yChannelSelector="G"/></filter>
          <mask id="svmask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="874" height="1300"><g filter="url(#svink)">${BLOBS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0" fill="#fff"/>`).join('')}</g></mask>
          <clipPath id="svclip"><rect width="474" height="900" rx="3"/></clipPath></defs>
          <g clip-path="url(#svclip)"><image id="svimg" width="474" height="900" preserveAspectRatio="none" mask="url(#svmask)"/></g></svg>
      </div>
    </div>
  </div>
  ${fine ? '<div class="sv-cur" aria-hidden="true"><i class="ring"></i><i class="dot"></i><b class="lab">OUVRIR<br><span class="ko">열기</span></b></div>' : ''}`;
  const V = $('.sv', el), stage = $('.sv-stage', el), shelf = $('.sv-shelf', el), play = $('.sv-play', el), det = $('.sv-detail', el), cursor = $('.sv-cur', el);
  // le curseur et la feuille vivent au niveau du document pour passer au-dessus de la barre
  document.body.append(det); if (cursor) document.body.append(cursor);

  // ---------- boîtes ----------
  const tapes = U.map((u, i) => {
    const d = document.createElement('div'); d.className = 'tape' + (S.units[u.id] && S.units[u.id].done ? ' done' : ''); d.dataset.i = i;
    d.style.visibility = 'hidden'; d.setAttribute('role', 'button'); d.setAttribute('aria-label', `${u.id} · ${u.titre}`);
    d.innerHTML = `<div class="sp face" style="--lv:${u.niveau || 0}"></div><div class="cv face"></div>`;
    stage.append(d);
    return { el: d, sp: d.firstChild, cv: d.lastChild, u, lift: 0, liftT: 0, painted: false, vis: false };
  });
  let H = 400, ws = 68, dd = 210, gap = 12, W = innerWidth, VH = 600, cy = 300;
  function measure() {
    const r = V.getBoundingClientRect(); W = r.width; VH = r.height;
    const mob = W < 768;
    H = Math.max(180, mob ? Math.min(W * 0.6, innerHeight * 0.4, VH - 250) : Math.min(innerHeight * 0.46, W * 0.31, VH - 280));
    ws = H * 142 / 840; dd = H * 474 / 900; gap = H * 0.03; cy = VH / 2;
    V.style.setProperty('--H', H + 'px'); V.style.setProperty('--ws', ws + 'px'); V.style.setProperty('--d', dd + 'px');
    placeInd();
  }
  // ---------- état ----------
  let s = start, T = start, active = -1, dragging = false, tiltX = 0, tiltY = 0, onCover = false, isOpen = false;
  let mx = W / 2, my = 0, cx = W / 2, cyc = 0, hover = -1, last = performance.now(), raf = 0, wheelT = 0;
  const clamp = v => Math.max(0, Math.min(N - 1, v));
  const go = v => { T = clamp(v); };

  // peinture paresseuse : une boîte par image, en commençant par les plus proches
  let paintQ = [];
  function queuePaint() {
    paintQ = tapes.filter(t => !t.painted && t.vis).sort((a, b) => Math.abs(a.u.n - s) - Math.abs(b.u.n - s));
  }
  function paintOne() {
    const t = paintQ.shift(); if (!t || t.painted) return;
    const p = paintUnit(t.u, U); t.painted = true;
    t.sp.style.backgroundImage = `url(${p.spine})`; t.cv.style.backgroundImage = `url(${p.cover})`;
  }

  // ---------- légende ----------
  function capLine(box, html, dir) {
    const sp = document.createElement('span'); sp.innerHTML = html; box.append(sp);
    const kids = [...box.children];
    if (reduce || kids.length === 1) { kids.slice(0, -1).forEach(k => k.remove()); return; }
    sp.animate([{ transform: `translateY(${dir * 105}%)` }, { transform: 'translateY(0)' }], { duration: 650, easing: EASE, fill: 'both' });
    kids.slice(0, -1).forEach(k => { if (k._leaving) return; k._leaving = true; const tr = getComputedStyle(k).transform; const a = k.animate([{ transform: tr === 'none' ? 'translateY(0)' : tr }, { transform: `translateY(${-dir * 105}%)` }], { duration: 650, easing: EASE, fill: 'both' }); a.onfinish = () => k.remove(); });
  }
  function setActive(i, dir) {
    active = i; const u = U[i], ko = koTitle(u);
    capLine($('.sv-cap .t', V), esc(u.titre), dir);
    capLine($('.sv-cap .s', V), `${u.id} / <span class="ko">${esc(ko.join(' · '))}</span>`, dir);
    capLine($('.sv-cap .y', V), `<span class="ko">${LEVEL_KO[u.niveau || 0]}</span> · ${esc(status(u))}`, dir);
    placeInd();
  }
  function placeInd() {
    if (active < 0) return;
    const lv = U[active].niveau || 0, b = $(`.sv-tabs button[data-lv="${lv}"]`, V), ind = $('.sv-ind', V);
    $$('.sv-tabs button', V).forEach(x => x.classList.toggle('on', x === b));
    if (b) { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft}px)`; }
  }
  // ---------- ciel qui suit la lumière du parcours ----------
  let lastSky = -1;
  function skyFor(v) {
    const a = U[Math.floor(clamp(v))], b = U[Math.ceil(clamp(v))], f = v - Math.floor(v);
    const t = unitTime(a, U) * (1 - f) + unitTime(b, U) * f;
    if (Math.abs(t - lastSky) < 0.002) return; lastSky = t;
    const P = pal(t), st = V.style;
    P.sky.forEach((c, k) => st.setProperty('--s' + k, c));
    st.setProperty('--glow', P.rim); st.setProperty('--st', P.stars.toFixed(2));
    V.classList.toggle('dark', lum(P.sky[2]) < 0.2);
    document.documentElement.style.setProperty('--sv-t', t.toFixed(3));
  }

  // ---------- boucle ----------
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = reduce ? 60 : dragging ? 18 : 5.2;
    s += (T - s) * (1 - Math.exp(-k * dt)); if (Math.abs(T - s) < 1e-4) s = T;
    const a = Math.round(s); if (a !== active) setActive(a, Math.sign(T - s) || 1);
    skyFor(s);
    // inclinaison vers le pointeur
    onCover = !isOpen && Math.abs(T - s) < 0.3 && Math.abs(mx - W / 2) < 0.55 * dd && Math.abs(my - cy) < 0.55 * H;
    const tyT = onCover ? (mx - W / 2) / (0.55 * dd) * 9 : (mx - W / 2) / W * 5, txT = onCover ? -(my - cy) / (H / 2) * 6 : 0;
    const e7 = 1 - Math.exp(-7 * dt); tiltY += (tyT - tiltY) * e7; tiltX += (txT - tiltX) * e7;
    let anyNew = false;
    for (const t of tapes) {
      const r = t.u.n - s, x = r * (ws + gap) + (dd - ws + 1.6 * gap) * B(r);
      const vis = Math.abs(x) < W / 2 + 1.5 * dd;
      if (vis !== t.vis) { t.vis = vis; t.el.style.visibility = vis ? 'visible' : 'hidden'; if (vis && !t.painted) anyNew = true; }
      if (!vis) continue;
      t.lift += (t.liftT - t.lift) * (reduce ? 1 : 1 - Math.exp(-12 * dt));
      const o = sstep(Math.max(0, 1 - Math.abs(r)));
      const ry = -90 * o + tiltY * o, rx = tiltX * o, rz = -4.5 * o, tz = o * 0.2 * H, ty = -o * 0.025 * H - t.lift * 0.045 * H;
      t.el.style.transform = `translate3d(${x.toFixed(2)}px,${ty.toFixed(2)}px,${tz.toFixed(2)}px) rotateZ(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      t.el.style.zIndex = Math.round(100 - Math.abs(r) * 4);
      t.sp.style.setProperty('--shade', (o * 0.55).toFixed(3)); t.cv.style.setProperty('--shade', ((1 - o) * 0.5).toFixed(3));
    }
    if (anyNew && fontsOk) queuePaint();
    if (paintQ.length) paintOne();
    // bouton lecture au coin de la couverture
    const ps = isOpen ? 0 : sstep(Math.max(0, 1 - Math.abs(T - s) * 3));
    play.style.transform = `translate(-50%,-50%) scale(${ps.toFixed(3)})`;
    // curseur
    if (cursor) {
      const e16 = 1 - Math.exp(-16 * dt); cx += (mx - cx) * e16; cyc += (myAbs - cyc) * e16;
      cursor.style.transform = `translate3d(${cx}px,${cyc}px,0)`;
      cursor.classList.toggle('open', onCover && !isOpen);
      cursor.classList.toggle('spine', !onCover && hover >= 0 && !isOpen);
    }
    raf = requestAnimationFrame(frame);
  }
  let myAbs = 0;
  // ---------- entrées ----------
  const onMove = e => { const r = V.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; myAbs = e.clientY; if (cursor) { cursor.classList.toggle('btn', !!e.target.closest('button,a') && !e.target.closest('.tape')); } };
  addEventListener('pointermove', onMove, { passive: true });
  tapes.forEach((t, i) => {
    t.el.addEventListener('pointerenter', () => { if (Math.abs(i - s) > 0.5) { t.liftT = 1; hover = i; } });
    t.el.addEventListener('pointerleave', () => { t.liftT = 0; if (hover === i) hover = -1; });
    t.el.addEventListener('click', () => { if (dragMoved) return; const r = i - T; if (Math.abs(i - s) < 0.5) openDetail(); else go(Math.round(T + r)); });
  });
  $('.sv-arr.l', V).onclick = () => go(Math.round(T) - 1);
  $('.sv-arr.r', V).onclick = () => go(Math.round(T) + 1);
  play.onclick = () => openDetail();
  $$('.sv-tabs button', V).forEach(b => b.onclick = () => go(+b.dataset.n));
  const onKey = e => {
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if (isOpen) { if (e.key === 'Escape') closeDetail(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(T) - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(T) + 1); }
    else if (e.key === 'Enter' && (document.activeElement === document.body || document.activeElement === $('#main'))) openDetail();
  };
  addEventListener('keydown', onKey);
  const onWheel = e => {
    if (isOpen) return; e.preventDefault();
    const dlt = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    T = clamp(T + dlt / (ws + gap) * 0.5);
    clearTimeout(wheelT); wheelT = setTimeout(() => go(Math.round(T)), 160);
  };
  V.addEventListener('wheel', onWheel, { passive: false });
  let dx0 = 0, T0 = 0, down = false, dragMoved = false;
  shelf.addEventListener('pointerdown', e => { down = true; dragMoved = false; dx0 = e.clientX; T0 = T; });
  const onPMove = e => { if (!down) return; const dx = e.clientX - dx0; if (!dragging && Math.abs(dx) > 5) { dragging = true; dragMoved = true; } if (dragging) T = clamp(T0 - dx / (ws + gap)); };
  const onUp = () => { if (!down) return; down = false; if (dragging) { dragging = false; go(Math.round(T)); setTimeout(() => { dragMoved = false; }, 0); } };
  addEventListener('pointermove', onPMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);

  // ---------- feuille de détail ----------
  let inkRaf = 0;
  function coverRect() { const t = tapes[Math.round(T)]; return t.cv.getBoundingClientRect(); }
  function fill(u) {
    const ko = koTitle(u), p = paintUnit(u, U);
    $('#svd-s').innerHTML = `${u.id} / <span class="ko">${esc(ko.join(' · '))}</span>`;
    $('#svd-t').textContent = u.titre;
    const meta = [`<span class="ko">${LEVEL_KO[u.niveau || 0]}</span>`];
    if (u.theme) meta.push(esc(u.theme)); if (u.points) meta.push(`${u.points.length} points`); meta.push(`${(u.mots || []).length} mots`); meta.push(esc(status(u)));
    $('#svd-m').innerHTML = meta.join(' / ');
    $('#svd-y').textContent = u.intro || (u.explication ? u.explication[0].replace(/<[^>]+>/g, '') : u.objectif);
    $('#svd-w').textContent = (u.mots || []).slice(0, 7).map(m => m[0]).join(' · ');
    $('#svd-c').textContent = u.objectif + (u.mots && u.mots.length ? ' Vocabulaire vérifié dans le 한국어기초사전.' : '');
    $('#svd-go').href = '#/unite/' + u.id;
    $('#svimg').setAttribute('href', p.cover);
  }
  function openDetail() {
    if (isOpen) return; go(Math.round(T)); isOpen = true; lastIndex = Math.round(T);
    const u = U[Math.round(T)]; fill(u);
    const circles = $$('#svmask circle'); circles.forEach(c => c.setAttribute('r', 0));
    const r = coverRect(), iw = innerWidth, ih = innerHeight;
    det.hidden = false; det.style.visibility = 'visible';
    det.style.transformOrigin = `${r.left + r.width / 2}px ${r.top + r.height / 2}px`;
    const inset = `inset(${r.top}px ${iw - r.right}px ${ih - r.bottom}px ${r.left}px round 3px)`;
    det.getAnimations().forEach(a => a.cancel());
    det.animate([{ clipPath: inset, transform: 'rotate(-4.5deg)' }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' }], { duration: reduce ? 1 : 1050, easing: 'cubic-bezier(.76,0,.18,1)', fill: 'both' });
    $$('.sv-dtxt .m > *', det).forEach((x, i) => x.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: reduce ? 1 : 900, delay: reduce ? 0 : 620 + i * 75, easing: EASE, fill: 'both' }));
    const t0 = performance.now() + (reduce ? -5000 : 520);
    cancelAnimationFrame(inkRaf);
    const ink = now => {
      circles.forEach((c, i) => { const p = Math.max(0, Math.min(1, (now - t0 - BLOBS[i][2]) / 1250)); c.setAttribute('r', (720 * (1 - (1 - p) ** 3)).toFixed(1)); });
      if (now - t0 < 2400) inkRaf = requestAnimationFrame(ink);
    };
    inkRaf = requestAnimationFrame(ink);
    setTimeout(() => $('.sv-close', det).focus({ preventScroll: true }), reduce ? 0 : 900);
  }
  function closeDetail() {
    if (!isOpen) return;
    const r = coverRect(), iw = innerWidth, ih = innerHeight;
    det.getAnimations().filter(a => a.effect && a.effect.target === det).forEach(a => a.cancel());
    const a = det.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' }, { clipPath: `inset(${r.top}px ${iw - r.right}px ${ih - r.bottom}px ${r.left}px round 3px)`, transform: 'rotate(-4.5deg)' }], { duration: reduce ? 1 : 850, easing: 'cubic-bezier(.76,0,.18,1)', fill: 'both' });
    a.onfinish = () => { det.hidden = true; det.style.visibility = 'hidden'; det.getAnimations().forEach(x => x.cancel()); isOpen = false; };
  }
  $('.sv-close', det).onclick = closeDetail;
  $('#svd-go', det).addEventListener('click', () => { det.hidden = true; isOpen = false; });

  // ---------- démarrage ----------
  const ro = new ResizeObserver(measure); ro.observe(V);
  const onResize = () => measure(); addEventListener('resize', onResize);
  measure();
  let fontsOk = false;
  fontsReady().then(() => { fontsOk = true; queuePaint(); });
  raf = requestAnimationFrame(frame);
  onLeave(() => {
    cancelAnimationFrame(raf); cancelAnimationFrame(inkRaf); ro.disconnect();
    removeEventListener('pointermove', onMove); removeEventListener('pointermove', onPMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
    removeEventListener('keydown', onKey); removeEventListener('resize', onResize);
    det.remove(); if (cursor) cursor.remove(); document.body.classList.remove('is-shelf');
    lastIndex = Math.round(T);
  });
}
