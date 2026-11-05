// MALSSI · Révisions (cartes FSRS), Vocabulaire et import Anki
import { sessionQueue, allCards, wordInfo, rr, C } from '../content.js';
import { S, save, today, countNew } from '../store.js';
import { next, fmtIv } from '../fsrs.js';
import { esc, $, $$, toast, gradeTag } from '../ui.js';
import { playBtn, speak } from '../tts.js';
import * as anki from '../anki.js';
import { motsNav } from './mots.js';

const GR = [[1, 'À revoir'], [2, 'Difficile'], [3, 'Correct'], [4, 'Facile']];
let keyHandler = null;
export function stopKeys() { if (keyHandler) removeEventListener('keydown', keyHandler); keyHandler = null; }

export function viewReviser(el) {
  const q = sessionQueue();
  const queue = [...q.due, ...q.fresh];
  const nDecks = Object.keys(S.anki.decks).length;
  if (!queue.length) {
    el.innerHTML = `<h1>Révisions</h1>
      <div class="empty">${allCards().length ? 'Rien à revoir pour l\'instant. Revenez demain, ou avancez dans le parcours.' : 'Vos révisions commencent quand vous terminez une unité du parcours.'}
      <div class="row" style="justify-content:center;margin-top:14px"><a class="btn" href="#/parcours">Ouvrir le parcours</a><a class="btn ghost" href="#/anki">Importer un paquet Anki</a></div></div>
      ${nDecks ? `<p class="small muted" style="margin-top:16px">${nDecks} paquet${nDecks > 1 ? 's' : ''} Anki importé${nDecks > 1 ? 's' : ''}.</p>` : ''}`;
    return;
  }
  let i = 0, shown = false, t0 = Date.now(), done = 0;
  const dir = S.set.dir; // kf : coréen → français ; fk : français → coréen
  const draw = () => {
    if (i >= queue.length) { stopKeys(); el.innerHTML = `<h1>Révisions</h1><div class="empty">Séance terminée : ${done} carte${done > 1 ? 's' : ''}. <div class="row" style="justify-content:center;margin-top:14px"><a class="btn main" href="#/">Retour à aujourd'hui</a></div></div>`; return; }
    const c = queue[i], s0 = S.cards[c.id], w = wordInfo(c.ko) || {};
    const long = c.ko.length > 14 ? ' style="font-size:1.6rem"' : '';
    const front = dir === 'fk' ? `<div class="front fr">${esc(c.fr)}</div>` : `<div class="front ko"${long}>${esc(c.ko)}</div>`;
    const back = `<div class="back">${dir === 'fk' ? `<div class="front ko">${esc(c.ko)}</div>` : `<div class="m">${esc(c.fr)}</div>`}
      ${w.pron && w.pron.replace(/\/.*/, '') !== c.ko ? `<div class="muted">[<span class="ko">${esc(w.pron)}</span>]</div>` : ''}
      ${S.set.rr && c.unit ? `<div class="muted small">${esc(rr(c.ko))}</div>` : ''}
      <div>${gradeTag(w.niveau)} ${playBtn(c.ko)}</div></div>`;
    const now = Date.now();
    const prev = g => { const s = next(s0, g, c.id, now); return fmtIv(s.due - now); };
    el.innerHTML = `<div class="flash">
      <div class="qprog"><span>${i + 1} / ${queue.length}</span><span>${!s0 || !s0.s ? 'Nouveau' : 'Révision'}</span></div>
      <div class="card" aria-live="polite"><span class="src">${esc(c.src || '')}</span><div>${front}${shown ? back : ''}</div></div>
      ${shown ? `<div class="grades">${GR.map(([g, l]) => `<button type="button" class="g${g}" data-g="${g}">${l}<small>${prev(g)}</small></button>`).join('')}</div>
        <p class="kbd">Clavier : 1 à 4 pour noter, espace pour retourner, R pour réécouter.</p>`
        : `<div class="row" style="margin-top:14px;justify-content:center"><button class="btn main" id="show">Afficher la réponse</button></div><p class="kbd">Espace pour retourner la carte.</p>`}</div>`;
    if (!shown && dir === 'kf' && c.unit) speak(c.ko);
    if (shown && dir === 'fk') speak(c.ko);
    const sh = $('#show', el); if (sh) { sh.onclick = () => { shown = true; draw(); }; sh.focus({ preventScroll: true }); }
    $$('.grades button', el).forEach(b => b.onclick = () => grade(+b.dataset.g));
  };
  const grade = g => {
    const c = queue[i], s0 = S.cards[c.id], wasNew = !s0 || !s0.s;
    const s = next(s0, g, c.id); S.cards[c.id] = s;
    const d = today(); d.n++; d[g > 1 ? 'ok' : 'ko']++; d.sec += Math.min(60, Math.round((Date.now() - t0) / 1000));
    if (wasNew) { countNew(); d.nw++; }
    save(); done++; t0 = Date.now();
    if (s.due - Date.now() < 20 * 60000) queue.push(c); // revient dans la séance
    i++; shown = false; draw();
  };
  stopKeys();
  keyHandler = e => {
    if (e.target.closest('input,select,textarea,dialog')) return;
    if (e.key === ' ' && !shown) { e.preventDefault(); shown = true; draw(); }
    else if (shown && /^[1-4]$/.test(e.key)) grade(+e.key);
    else if (e.key.toLowerCase() === 'r' && queue[i]) speak(queue[i].ko);
  };
  addEventListener('keydown', keyHandler);
  draw();
}

export function viewVocab(el) {
  const all = allCards();
  const units = C.units.filter(u => S.units[u.id] && S.units[u.id].done);
  el.innerHTML = `${motsNav('#/vocabulaire')}<h1>Mes mots</h1>
    <p class="muted prose">Tous les mots de vos unités terminées et de vos paquets Anki, avec leur état de révision.</p>
    <div class="voc-tools"><input type="text" id="vq" placeholder="Chercher un mot, en coréen ou en français" aria-label="Chercher un mot">
      <select id="vs" aria-label="Source"><option value="">Toutes les sources</option>${units.map(u => `<option value="${u.id}">${u.id} · ${esc(u.titre)}</option>`).join('')}${Object.entries(S.anki.decks).map(([id, d]) => `<option value="a:${id}">Anki · ${esc(d.name)}</option>`).join('')}</select></div>
    <div id="vl"></div>`;
  const state = c => { const s = S.cards[c.id]; if (!s || !s.s) return '<span class="muted">nouveau</span>'; if (s.s === 2 && s.iv >= 21) return '<span style="color:var(--jade)">solide</span>'; return 'en cours · ' + fmtIv(Math.max(0, s.due - Date.now())); };
  const render = () => {
    const qv = $('#vq').value.trim().toLowerCase(), src = $('#vs').value;
    let L = all.filter(c => (!src || (src.startsWith('a:') ? c.anki === src.slice(2) : c.unit === src)) && (!qv || c.ko.includes(qv) || c.fr.toLowerCase().includes(qv)));
    const more = L.length > 300; L = L.slice(0, 300);
    $('#vl').innerHTML = !all.length ? '<div class="empty">Aucun mot pour l\'instant : terminez une unité ou importez un paquet Anki.</div>' :
      `<div class="tbl-wrap"><table class="list"><thead><tr><th>Mot</th><th>Sens</th><th>Source</th><th>État</th><th><span class="sr">Écouter</span></th></tr></thead><tbody>
      ${L.map(c => `<tr><td class="ko">${esc(c.ko)}</td><td>${esc(c.fr)}</td><td class="small muted">${esc(c.src)}</td><td class="small">${state(c)}</td><td>${playBtn(c.ko)}</td></tr>`).join('')}</tbody></table></div>
      ${more ? '<p class="small muted">Seuls les 300 premiers résultats sont affichés : affinez la recherche.</p>' : ''}`;
  };
  $('#vq').oninput = render; $('#vs').onchange = render; render();
}

export function viewAnki(el) {
  const decks = Object.entries(S.anki.decks);
  el.innerHTML = `<h1>Importer un paquet Anki</h1>
    <p class="muted prose">Choisissez un fichier <b>.apkg</b>. Il est lu sur cet appareil, rien n'est envoyé. MALSSI garde le texte des notes (pas les sons ni les images) et vous demande quel champ contient le coréen et quel champ contient la traduction.</p>
    <div class="panel"><label class="field">Fichier .apkg<input type="file" id="af" accept=".apkg,.colpkg"></label><div id="ast" class="small muted" style="margin-top:10px" aria-live="polite"></div><div id="amap"></div></div>
    <h2 style="margin-top:32px">Paquets importés</h2>
    ${decks.length ? `<div class="tbl-wrap"><table class="list"><thead><tr><th>Paquet</th><th>Cartes</th><th>Dans la séance</th><th></th></tr></thead><tbody>
      ${decks.map(([id, d]) => `<tr><td>${esc(d.name)}<div class="small muted">${esc(d.file)}</div></td><td>${d.n}</td>
        <td><label><input type="checkbox" data-on="${id}" ${d.off ? '' : 'checked'}> inclus</label></td>
        <td><button class="btn sm ghost" data-del="${id}">Supprimer</button></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty">Aucun paquet importé.</div>'}
    <p class="small muted" style="margin-top:16px">Pensez aux droits : les paquets partagés par d'autres restent leur œuvre. Ils sont pour votre usage personnel et ne sont jamais publiés par MALSSI.</p>`;
  const say = t => { $('#ast').textContent = t; };
  $('#af').onchange = async e => {
    const f = e.target.files[0]; if (!f) return; $('#amap').innerHTML = '';
    try {
      const r = await anki.read(f, say);
      say(`${r.notes.length} notes trouvées dans « ${r.deck} »${r.other ? ` (${r.other} notes d'un autre modèle ignorées)` : ''}.`);
      const opt = sel => r.names.map((n, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(n)}</option>`).join('');
      $('#amap').innerHTML = `<div class="stack" style="margin-top:16px">
        <div class="row"><label class="field">Champ en coréen<select id="ako">${opt(r.koF)}</select></label><label class="field">Champ de la traduction<select id="afr">${opt(r.frF)}</select></label></div>
        <div id="aprev" class="small"></div>
        <label class="row small"><input type="checkbox" id="akeep" checked> Reprendre l'avancement des cartes déjà révisées dans Anki</label>
        <div class="row"><input type="text" id="aname" value="${esc(r.deck)}" aria-label="Nom du paquet"><button class="btn main" id="ago">Importer</button></div></div>`;
      const prev = () => { const a = r.preview(+$('#ako').value), b = r.preview(+$('#afr').value); $('#aprev').innerHTML = 'Aperçu : ' + a.map((x, k) => `<span class="ko">${esc(x)}</span> → ${esc(b[k])}`).join(' · '); };
      $('#ako').onchange = prev; $('#afr').onchange = prev; prev();
      $('#ago').onclick = async () => {
        $('#ago').disabled = true; say('Import en cours…'); r.deck = $('#aname').value.trim() || r.deck;
        try { const n = await anki.commit(r, +$('#ako').value, +$('#afr').value, $('#akeep').checked); toast(`${n} cartes importées.`); viewAnki(el); }
        catch (err) { say('Import impossible : ' + err.message); $('#ago').disabled = false; }
      };
    } catch (err) {
      say({ zip: 'Ce fichier n\'est pas un paquet Anki valide.', col: 'Aucune collection trouvée dans ce paquet.', vide: 'Ce paquet ne contient aucune note.', meth: 'Format de compression non pris en charge.' }[err.message] || ('Lecture impossible : ' + err.message));
    }
  };
  $$('[data-on]', el).forEach(c => c.onchange = () => { const d = S.anki.decks[c.dataset.on]; if (c.checked) delete d.off; else d.off = 1; save(); });
  $$('[data-del]', el).forEach(b => b.onclick = async () => { const d = S.anki.decks[b.dataset.del]; if (!confirm(`Supprimer « ${d.name} » et l'avancement de ses cartes ?`)) return; await anki.remove(b.dataset.del); toast('Paquet supprimé.'); viewAnki(el); });
}
