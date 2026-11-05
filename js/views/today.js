// MALSSI · Aujourd'hui : la syllabe du jour et la séance
import { C, currentUnit, sessionQueue, stats, wordInfo } from '../content.js';
import { S, dayKey, newLeft } from '../store.js';
import { esc, $ } from '../ui.js';
import { split, HORIZ, MIXED } from '../hangul.js';
import { playBtn } from '../tts.js';
import { magpie } from '../magpie.js';
import { DAY, startOfDay } from '../fsrs.js';

// Syllabe du jour : tirée des mots déjà rencontrés (ou de la première unité), stable sur la journée.
function syllableOfDay() {
  const met = C.units.filter(u => S.units[u.id]).flatMap(u => u.mots.map(m => m[0]));
  const pool = (met.length ? met : C.units[0].mots.map(m => m[0]));
  const k = dayKey(); let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) | 0;
  const word = pool[Math.abs(h) % pool.length];
  const syl = [...word].find(ch => split(ch) && split(ch).f) || [...word][0];
  return { word, syl, parts: split(syl) };
}
function weekStrip() {
  const days = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
  const t0 = startOfDay(), out = [];
  for (let i = 6; i >= 0; i--) {
    const t = t0 - i * DAY, d = S.days[dayKey(t + 3600000)] || { n: 0 };
    const lv = d.n === 0 ? '' : d.n < 20 ? 'l1' : d.n < 60 ? 'l2' : 'l3';
    out.push(`<div class="${i === 0 ? 'td' : ''}"><i class="${lv}" title="${d.n} réponse${d.n > 1 ? 's' : ''}"></i>${days[(new Date(t).getDay() + 6) % 7]}</div>`);
  }
  return out.join('');
}
export function viewToday(el) {
  const { word, syl, parts } = syllableOfDay();
  const w = wordInfo(word) || {};
  const vcls = HORIZ.has(parts.v) || MIXED.has(parts.v) ? 'v h' : 'v';
  const q = sessionQueue(), st = stats(), u = currentUnit();
  const td = S.days[dayKey()] || { n: 0, ok: 0 };
  const steps = [
    { done: q.due.length === 0 && td.n > 0, t: 'Réviser', d: q.due.length ? `${q.due.length} carte${q.due.length > 1 ? 's' : ''} à revoir aujourd'hui` : st.total ? 'Rien à revoir pour l\'instant' : 'Vos révisions commencent après la première unité', href: '#/reviser', go: q.due.length > 0 },
    { done: q.fresh.length === 0 && (S.nd.d === dayKey() && S.nd.n > 0), t: 'Nouveaux mots', d: q.fresh.length ? `${q.fresh.length} mot${q.fresh.length > 1 ? 's' : ''} à découvrir (limite : ${S.set.nd} par jour)` : newLeft() === 0 ? 'Limite du jour atteinte' : 'Terminez une unité pour en débloquer', href: '#/reviser', go: q.fresh.length > 0 },
    { done: !u, t: u ? `Unité ${u.id}` : 'Étape 0 terminée', d: u ? u.titre : 'Les unités du 1급 arrivent bientôt', href: u ? '#/unite/' + u.id : '#/parcours', go: !!u }];
  const firstGo = steps.find(s => s.go);
  const hello = !Object.keys(S.units).length ? 'Bienvenue. Commencez par l\'unité H01 : en dix unités, vous saurez lire le hangeul.'
    : td.n ? `Déjà ${td.n} réponse${td.n > 1 ? 's' : ''} aujourd'hui, dont ${td.ok} juste${td.ok > 1 ? 's' : ''}.` : 'Une séance courte chaque jour vaut mieux qu\'une longue le dimanche.';
  el.innerHTML = `
    <div class="today"><div>
      <div class="hero">
        <div class="block split" id="blk" aria-hidden="true">
          <span class="j i">${parts.i}</span><span class="j ${vcls}">${parts.v}</span>${parts.f ? `<span class="j f">${parts.f}</span>` : ''}
          <span class="full">${syl}</span></div>
        <div>
          <p class="muted small" style="margin:0">Syllabe du jour</p>
          <h1 class="ko" style="margin:4px 0 6px">${esc(word)} ${playBtn(word)}</h1>
          <p style="margin:0">${esc(w.fr || '')}${w.pron && w.pron.replace(/\/.*/, '') !== word ? ` · [<span class="ko">${esc(w.pron)}</span>]` : ''}</p>
          <div class="legend"><span class="i"><b>${parts.i}</b> initiale${parts.i === 'ㅇ' ? ' muette' : ''}</span><span class="v"><b>${parts.v}</b> voyelle</span>${parts.f ? `<span class="f"><b>${parts.f}</b> finale</span>` : ''}</div>
        </div></div>
      <h2>La séance du jour</h2>
      <ol class="seance">${steps.map((s, i) => `<li class="${s.done ? 'done' : ''}"><span class="n">${s.done ? '✓' : i + 1}</span>
        <span class="t"><b>${esc(s.t)}</b><span>${esc(s.d)}</span></span>${s.go ? `<a class="btn sm${s === firstGo ? ' main' : ''}" href="${s.href}">${s === firstGo ? 'Commencer' : 'Ouvrir'}</a>` : ''}</li>`).join('')}</ol>
    </div>
    <aside class="side">
      <div class="panel magpie-say">${magpie(72, { hop: true })}<p>${esc(hello)}</p></div>
      <div class="panel"><h3>Cette semaine</h3><div class="week">${weekStrip()}</div></div>
      <div class="panel"><h3>Vos cartes</h3>
        <p class="small muted" style="margin:0 0 10px">${st.total} au total · ${st.mature} solides (intervalle de 3 semaines ou plus)</p>
        <div class="bar" aria-hidden="true"><i style="width:${st.total ? Math.round(st.mature / st.total * 100) : 0}%"></i></div></div>
    </aside></div>`;
  requestAnimationFrame(() => setTimeout(() => { const b = $('#blk'); if (b) { b.classList.remove('split'); setTimeout(() => b.classList.add('join'), 900); } }, 350));
}
