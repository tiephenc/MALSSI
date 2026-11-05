// MALSSI · minuteur Focus (repris de KOTONOHA, simplifié) : périodes de travail et de pause, journal par jour.
import { S, save, dayKey } from './store.js';
import { $, esc } from './ui.js';
let tick = null, ctx = null;
const F = () => S.focus;
const cur = () => F().cur || (F().cur = { ph: 'idle' });
const mmss = ms => { const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
function remain() { const c = cur(); if (c.rest != null) return c.rest; if (c.end) return Math.max(0, c.end - Date.now()); return F().set[c.ph === 'brk' ? 'brk' : 'work'] * 60000; }
function chime(n) {
  if (!F().set.sound) return;
  try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < n; i++) { const t = ctx.currentTime + i * 0.5, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = 660 - i * 110; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1.5); } } catch (e) {}
}
function log(min, done) { const k = dayKey(), d = F().log[k] || (F().log[k] = { m: 0, n: 0 }); d.m += Math.round(min); if (done) d.n++; }
function start(ph) { const min = F().set[ph === 'brk' ? 'brk' : 'work']; F().cur = { ph, end: Date.now() + min * 60000, dur: min }; save(); run(); paint(); render(); }
function pause() { const c = cur(); if (c.rest != null) { c.end = Date.now() + c.rest; delete c.rest; } else if (c.end) { c.rest = Math.max(0, c.end - Date.now()); delete c.end; } save(); render(); }
function stop() { const c = cur(); if (c.ph === 'work' && c.dur) log((c.dur * 60000 - remain()) / 60000, false); F().cur = { ph: 'idle' }; save(); paint(); render(); }
function finish() { const c = cur(); if (c.ph === 'work') { log(c.dur, true); F().cur = { ph: 'wdone' }; chime(2); notify('Pause !', 'Période de travail terminée.'); } else { F().cur = { ph: 'bdone' }; chime(1); notify('On reprend ?', 'La pause est finie.'); } save(); paint(); render(); }
function notify(t, b) { try { if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification('MALSSI · ' + t, { body: b, tag: 'malssi-focus' }); } catch (e) {} }
function run() { clearInterval(tick); tick = setInterval(() => { const c = cur(); if ((c.ph === 'work' || c.ph === 'brk') && c.end && c.end <= Date.now()) finish(); paint(); }, 1000); }
function paint() {
  const b = $('#focbtn'); if (!b) return; const c = cur(), live = c.ph === 'work' || c.ph === 'brk';
  b.classList.toggle('on', c.ph === 'work'); b.classList.toggle('brk', c.ph === 'brk');
  const tot = (c.dur || 1) * 60000; b.style.setProperty('--p', live ? Math.round((1 - remain() / tot) * 100) + '%' : '0%');
  $('.tm', b).textContent = live ? mmss(remain()) + (c.rest != null ? ' ‖' : '') : c.ph === 'wdone' ? 'Pause !' : c.ph === 'bdone' ? 'Reprendre' : 'Focus';
  const big = $('#ftime'); if (big) big.textContent = mmss(remain());
}
function render() {
  const d = $('#focdlg'); if (!d || !d.open) return;
  const c = cur(), s = F().set, td = F().log[dayKey()] || { m: 0, n: 0 }, live = c.ph === 'work' || c.ph === 'brk';
  const label = { idle: 'Prêt à commencer', work: 'Travail', brk: 'Pause', wdone: 'Période terminée : place à la pause', bdone: 'Pause terminée' }[c.ph];
  d.innerHTML = `<h2>Focus</h2><p class="muted" style="margin:0">${esc(label)}</p><div class="timer" id="ftime">${mmss(remain())}</div>
    <div class="row" style="justify-content:center">
      ${live ? `<button class="btn main" id="fp">${c.rest != null ? 'Reprendre' : 'Pause'}</button><button class="btn" id="fs">Arrêter</button>` :
        c.ph === 'wdone' ? `<button class="btn main" id="fb">Commencer la pause (${s.brk} min)</button><button class="btn" id="fw">Passer la pause</button>` :
        `<button class="btn main" id="fw">Travailler ${s.work} min</button>`}</div>
    ${live ? '' : `<div class="durs"><label class="field">Travail (min)<input type="number" id="fdw" min="5" max="120" value="${s.work}"></label><label class="field">Pause (min)<input type="number" id="fdb" min="1" max="60" value="${s.brk}"></label></div>
      <label class="row small"><input type="checkbox" id="fsd" ${s.sound ? 'checked' : ''}> Signal sonore</label>`}
    <p class="small muted" style="margin-top:16px">Aujourd'hui : ${td.m} min de travail, ${td.n} période${td.n > 1 ? 's' : ''} complète${td.n > 1 ? 's' : ''}.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn ghost" id="fx">Fermer</button></div>`;
  const on = (id, fn) => { const e = $('#' + id); if (e) e.onclick = fn; };
  on('fw', () => { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); start('work'); });
  on('fb', () => start('brk')); on('fp', pause); on('fs', stop); on('fx', () => d.close());
  const num = (id, k, lo, hi) => { const e = $('#' + id); if (e) e.onchange = () => { s[k] = Math.max(lo, Math.min(hi, +e.value || s[k])); save(); paint(); render(); }; };
  num('fdw', 'work', 5, 120); num('fdb', 'brk', 1, 60);
  const sd = $('#fsd'); if (sd) sd.onchange = () => { s.sound = sd.checked ? 1 : 0; save(); };
}
export function mountFocus() {
  document.body.insertAdjacentHTML('beforeend', `<button class="focbtn" id="focbtn" type="button" aria-haspopup="dialog"><span class="dot" aria-hidden="true"></span><span class="tm">Focus</span></button><dialog id="focdlg" aria-label="Minuteur Focus"></dialog>`);
  $('#focbtn').onclick = () => { const d = $('#focdlg'); d.showModal(); render(); };
  const c = cur(); if ((c.ph === 'work' || c.ph === 'brk') && c.end && c.end <= Date.now()) finish();
  run(); paint();
}
