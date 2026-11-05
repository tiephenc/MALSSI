// MALSSI · Listes de vocabulaire par niveau et dictionnaire intégré (données du 한국어기초사전, CC BY-SA 2.0 KR)
import { C, loadTier, loadDico, TIER_LABEL } from '../content.js';
import { S, save } from '../store.js';
import { esc, $, $$, toast } from '../ui.js';
import { playBtn } from '../tts.js';
import { romanize } from '../hangul.js';

export const motsNav = cur => `<nav class="tabs" aria-label="Mots">${[['#/listes', 'Listes par niveau'], ['#/dico', 'Dictionnaire'], ['#/vocabulaire', 'Mes mots']].map(([h, l]) => `<a href="${h}" ${h === cur ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const ATTR = '<p class="small muted attr">Mots, prononciations et sens : 한국어기초사전, © 국립국어원, licence CC BY-SA 2.0 KR.</p>';
export async function viewListes(el, arg) {
  const t = +(arg || 1) || 1;
  el.innerHTML = '<p class="muted">Chargement des listes…</p>';
  const d = await loadTier(t);
  if (!S.lists) S.lists = {};
  const inT = d.listes.filter(l => S.lists[l.id]).length;
  el.innerHTML = `${motsNav('#/listes')}<h1>Listes par niveau</h1>
    <p class="muted prose">Tout le vocabulaire noté dans le 한국어기초사전, regroupé par thème. Ajoutez une liste à vos révisions : ses mots arrivent progressivement, au rythme de vos nouveaux mots du jour (réglable dans Profil).</p>
    <nav class="tabs lvl" aria-label="Niveau">${[1, 2, 3].map(k => `<a href="#/listes/${k}" ${k === t ? 'aria-current="page"' : ''}>${TIER_LABEL[k]}</a>`).join('')}</nav>
    <p class="small muted">${d.listes.reduce((a, l) => a + l.mots.length, 0)} mots · ${d.listes.length} listes · ${inT} dans vos révisions</p>
    <div class="lists">${d.listes.map(l => `<details class="vlist" data-id="${l.id}">
      <summary><span class="t">${esc(l.titre)}</span><span class="n">${l.mots.length} mots</span>
        <button class="btn sm ${S.lists[l.id] ? '' : 'main'}" data-add="${l.id}">${S.lists[l.id] ? 'Retirer' : 'Réviser'}</button></summary>
      <div class="vwords"></div></details>`).join('')}</div>${ATTR}`;
  $$('details.vlist', el).forEach(det => det.addEventListener('toggle', () => {
    if (!det.open || det.dataset.done) return; det.dataset.done = 1;
    const l = C.listById[det.dataset.id];
    $('.vwords', det).innerHTML = l.mots.map(([ko, fr]) => `<div class="vw"><span class="ko">${esc(ko)}</span><span>${esc(fr)}</span>${playBtn(ko)}</div>`).join('');
  }));
  $$('[data-add]', el).forEach(b => b.onclick = ev => {
    ev.preventDefault(); const id = b.dataset.add;
    if (S.lists[id]) { delete S.lists[id]; toast('Liste retirée. L\'avancement de ses cartes est conservé.'); }
    else { S.lists[id] = Date.now(); toast('Liste ajoutée à vos révisions.'); }
    save(); viewListes(el, t);
  });
}

const POSCLS = { nom: 'n', verbe: 'v', adjectif: 'a' };
export async function viewDico(el, arg) {
  el.innerHTML = `${motsNav('#/dico')}<h1>Dictionnaire</h1>
    <p class="muted prose">Les ${'≈'}20 000 sens notés du 한국어기초사전 et ses entrées grammaticales, avec l'équivalent français donné par l'Institut national de la langue coréenne. Cherchez en coréen ou en français.</p>
    <div class="voc-tools"><input type="search" id="dq" placeholder="ex. 사랑, 먹다, -아서, maison" aria-label="Chercher dans le dictionnaire" value="${esc(decodeURIComponent(arg || ''))}"></div>
    <div id="dr" aria-live="polite"><p class="muted">Chargement du dictionnaire…</p></div>${ATTR}`;
  const D = await loadDico(); const keys = Object.keys(D);
  const run = () => {
    const q = $('#dq').value.trim().toLowerCase();
    if (!q) { $('#dr').innerHTML = '<div class="empty">Tapez un mot pour commencer.</div>'; return; }
    const ko = /[가-힣ㄱ-ㅣ]/.test(q);
    let hits;
    if (ko) hits = keys.filter(k => k.includes(q)).sort((a, b) => (a === q ? -1 : b === q ? 1 : 0) || (a.startsWith(q) ? -1 : 0) - (b.startsWith(q) ? -1 : 0) || a.length - b.length);
    else { const re = new RegExp('(^|[^a-zàâäéèêëîïôöùûüç])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); hits = keys.filter(k => D[k].some(s => re.test(s[5]))).sort((a, b) => Math.min(...D[a].map(s => s[2] || 9)) - Math.min(...D[b].map(s => s[2] || 9)) || a.length - b.length); }
    const n = hits.length; hits = hits.slice(0, 40);
    $('#dr').innerHTML = n ? `<p class="small muted">${n} entrée${n > 1 ? 's' : ''}${n > 40 ? ' (40 premières)' : ''}</p>` + hits.map(k => `<article class="dent">
      <header><span class="ko hw">${esc(k)}</span>${playBtn(k)}${D[k][0][3] ? `<span class="muted small">[<span class="ko">${esc(D[k][0][3])}</span>] ${esc(romanize(D[k][0][3], k))}</span>` : ''}${D[k][0][4] && /[一-鿿]/.test(D[k][0][4]) ? `<span class="muted">${esc(D[k][0][4])}</span>` : ''}</header>
      <ol>${D[k].map(s => `<li><span class="tag ${s[2] ? 'g' + s[2] : ''}">${['', '초급', '중급', '고급'][s[2]] || esc(s[1])}</span> <span class="small muted">${esc(s[1])}</span> <b>${esc(s[5])}</b>
        ${s[6] && s[6] !== s[5] ? `<div class="small muted">${esc(s[6])}</div>` : ''}${s[7] && s[7].length ? `<div class="dex ko">${s[7].map(esc).join('<br>')}</div>` : ''}</li>`).join('')}</ol></article>`).join('')
      : '<div class="empty">Aucune entrée. Essayez la forme du dictionnaire (먹다 plutôt que 먹어요), ou un autre mot français.</div>';
  };
  let t; $('#dq').oninput = () => { clearTimeout(t); t = setTimeout(run, 180); }; run(); $('#dq').focus();
}
