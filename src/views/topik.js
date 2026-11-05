// MALSSI · Entraînement TOPIK : épreuves blanches générées (questions rédigées pour MALSSI et phrases du 한국어기초사전)
// et atelier d'écriture (questions 51 à 54) avec grille 원고지.
import { C, loadDico, blankEx, exAnswer, plainEx } from '../content.js';
import { S, save, dayKey } from '../store.js';
import { esc, $, $$, shuffle, pick, toast } from '../ui.js';
import { speak, playBtn, hasVoice } from '../tts.js';

let W = null;
async function loadW() { if (!W) W = await fetch('data/ecriture.json').then(r => r.json()); return W; }
let timer = null; export function stopTopik() { clearInterval(timer); timer = null; }

export async function viewTopik(el) {
  const res = S.topik || {};
  const last = k => res[k] && res[k].length ? res[k][res[k].length - 1] : null;
  el.innerHTML = `<h1>Entraînement TOPIK</h1>
    <p class="muted prose">Des épreuves blanches au format du TOPIK, générées à chaque fois à partir des phrases du parcours et des exemples du 한국어기초사전. Le score indique vos progrès : ce n'est pas une note officielle.</p>
    <div class="exams">
      ${[['I', 'TOPIK I', 'Niveaux 1 et 2 · 30 questions · 40 min', 'Vocabulaire, grammaire en contexte et écoute.'],
         ['II', 'TOPIK II', 'Niveaux 3 à 6 · 40 questions · 60 min', 'Connecteurs, registre écrit, vocabulaire avancé et écoute.']].map(([k, t, m, d]) => { const l = last(k); return `
        <article class="exam"><h2 class="ko">${t}</h2><p class="small muted">${m}</p><p>${d}</p>
          ${l ? `<p class="small">Dernier essai : <b>${l.p} %</b> · ${new Date(l.at).toLocaleDateString('fr-FR')}</p>` : ''}
          <button class="btn main" data-exam="${k}">Commencer</button></article>`; }).join('')}
      <article class="exam write"><h2 class="ko">쓰기</h2><p class="small muted">TOPIK II · questions 51 à 54 · 50 min</p><p>Atelier d'écriture avec grille 원고지, compteur de caractères, plans et critères d'évaluation.</p>
        <a class="btn main" href="#/ecriture">Ouvrir l'atelier</a></article>
    </div>
    <h2>Les annales officielles</h2>
    <p class="prose">L'organisateur du TOPIK (NIIED) publie gratuitement les sujets, corrigés et enregistrements des sessions passées sur <a href="https://www.topik.go.kr" target="_blank" rel="noopener">topik.go.kr</a>. Faites-en une en conditions réelles quand vos épreuves blanches dépassent 70 %.</p>`;
  $$('[data-exam]', el).forEach(b => b.onclick = () => runExam(el, b.dataset.exam));
}

async function buildExam(kind) {
  const D = await loadDico();
  const lv = kind === 'I' ? [1, 2] : [3, 4, 5, 6], tiers = kind === 'I' ? [1] : [2, 3];
  const n = kind === 'I' ? 30 : 40;
  const units = C.units.filter(u => u.points && lv.includes(u.niveau));
  const exs = units.flatMap(u => u.points.flatMap(p => p.ex.map(e => ({ ko: e[0], fr: e[1], f: p.f }))));
  const pool = [...new Set(exs.map(e => exAnswer(e.ko)))];
  const Q = [];
  // 1. grammaire en contexte (phrases du parcours)
  shuffle(exs).slice(0, Math.round(n * 0.4)).forEach(e => { const a = exAnswer(e.ko), o = pick(pool, 3, [a]); if (o.length === 3) Q.push({ sec: 'Lecture', q: '( ) 에 들어갈 가장 알맞은 것을 고르십시오.', sent: blankEx(e.ko), right: a, choices: shuffle([a, ...o]), expl: e.fr + ' (' + e.f + ')' }); });
  // 2. vocabulaire en contexte (exemples du dictionnaire, noms seulement)
  const nouns = Object.entries(D).filter(([k, ss]) => ss.some(s => tiers.includes(s[2]) && s[1] === 'nom') && k.length >= 2 && !k.startsWith('-'));
  const withEx = shuffle(nouns.filter(([k, ss]) => ss.some(s => s[7] && s[7].some(x => x.includes(k)))));
  withEx.slice(0, Math.round(n * 0.35)).forEach(([k, ss]) => {
    const s = ss.find(s => s[7] && s[7].some(x => x.includes(k))), sent = s[7].find(x => x.includes(k));
    const o = pick(nouns.map(x => x[0]).filter(x => Math.abs(x.length - k.length) <= 1), 3, [k]);
    Q.push({ sec: 'Lecture', q: '( ) 에 들어갈 가장 알맞은 것을 고르십시오.', sent: sent.replace(k, '＿＿'), right: k, choices: shuffle([k, ...o]), expl: k + ' : ' + s[5], src: 'krdict' });
  });
  // 3. écoute : phrase du parcours → traduction ; mot → sens
  if (hasVoice()) {
    shuffle(exs).slice(0, Math.round(n * 0.15)).forEach(e => Q.push({ sec: 'Écoute', q: 'Écoutez et choisissez le sens de la phrase.', say: plainEx(e.ko), right: e.fr, fr: true, choices: shuffle([e.fr, ...pick(exs.map(x => x.fr), 3, [e.fr])]), expl: plainEx(e.ko) }));
    shuffle(nouns).slice(0, Math.round(n * 0.1)).forEach(([k, ss]) => { const g = ss.find(s => tiers.includes(s[2]))[5]; Q.push({ sec: 'Écoute', q: 'Écoutez et choisissez le sens du mot.', say: k, right: g, fr: true, choices: shuffle([g, ...pick(nouns.map(x => x[1].find(s => tiers.includes(s[2]))[5]), 3, [g])]), expl: k }); });
  }
  // sans voix coréenne : l'écoute est remplacée par de la lecture
  for (const [k, ss] of withEx.slice(Math.round(n * 0.35))) {
    if (Q.length >= n) break;
    const sx = ss.find(s => s[7] && s[7].some(x => x.includes(k))), sent = sx[7].find(x => x.includes(k));
    Q.push({ sec: 'Lecture', q: '( ) 에 들어갈 가장 알맞은 것을 고르십시오.', sent: sent.replace(k, '＿＿'), right: k, choices: shuffle([k, ...pick(nouns.map(x => x[0]).filter(x => Math.abs(x.length - k.length) <= 1), 3, [k])]), expl: k + ' : ' + sx[5], src: 'krdict' });
  }
  return shuffle(Q).slice(0, n).sort((a, b) => (a.sec === 'Écoute' ? 0 : 1) - (b.sec === 'Écoute' ? 0 : 1));
}
async function runExam(el, kind) {
  el.innerHTML = '<p class="muted">Préparation de l\'épreuve…</p>';
  const Q = await buildExam(kind), ans = new Array(Q.length).fill(null);
  const limit = (kind === 'I' ? 40 : 60) * 60, t0 = Date.now(); let i = 0;
  const left = () => Math.max(0, limit - Math.floor((Date.now() - t0) / 1000));
  const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const draw = () => {
    const q = Q[i];
    el.innerHTML = `<div class="exam-run">
      <header class="exam-head"><span class="ko">TOPIK ${kind}</span><span>${q.sec} · ${i + 1} / ${Q.length}</span><span class="clock" id="clk">${fmt(left())}</span></header>
      <div class="exam-q"><p class="ko qn"><b>${i + 1}.</b> ${esc(q.q)}</p>
        ${q.say ? `<div class="listen">${playBtn(q.say, 'l\'enregistrement')}<span class="small muted">Écoutez (deux fois au maximum, comme à l'examen).</span></div>` : ''}
        ${q.sent ? `<p class="ko sentence">${esc(q.sent)}</p>` : ''}
        <ol class="opts">${q.choices.map((c, k) => `<li><button type="button" class="${q.fr ? '' : 'ko'}${ans[i] === c ? ' sel' : ''}" data-c="${esc(c)}"><span class="num">${'①②③④'[k]}</span> ${esc(c)}</button></li>`).join('')}</ol></div>
      <div class="row exam-nav"><button class="btn ghost" id="prev" ${i ? '' : 'disabled'}>Précédente</button><span class="dots">${Q.map((_, k) => `<i class="${ans[k] ? 'a' : ''}${k === i ? ' c' : ''}"></i>`).join('')}</span>
        ${i < Q.length - 1 ? '<button class="btn" id="next">Suivante</button>' : '<button class="btn main" id="end">Rendre la copie</button>'}</div></div>`;
    if (q.say) setTimeout(() => speak(q.say, 0.9), 300);
    $$('.opts button', el).forEach(b => b.onclick = () => { ans[i] = b.dataset.c; if (i < Q.length - 1) { i++; draw(); } else draw(); });
    const on = (id, f) => { const e = $('#' + id, el); if (e) e.onclick = f; };
    on('prev', () => { i--; draw(); }); on('next', () => { i++; draw(); }); on('end', finish);
  };
  const finish = () => {
    stopTopik();
    const ok = Q.filter((q, k) => ans[k] === q.right).length, p = Math.round(ok / Q.length * 100);
    S.topik = S.topik || {}; (S.topik[kind] = S.topik[kind] || []).push({ at: Date.now(), p, n: Q.length }); save();
    el.innerHTML = `<h1>TOPIK ${kind} · résultat</h1>
      <p class="score"><b>${p} %</b> <span class="muted">${ok} / ${Q.length} bonnes réponses · ${fmt(Math.floor((Date.now() - t0) / 1000))}</span></p>
      <p class="prose muted">${p >= 80 ? 'Excellent. Passez à une annale officielle en conditions réelles.' : p >= 60 ? 'Bon niveau. Revoyez les unités des questions manquées.' : 'Reprenez les unités correspondantes du parcours avant de refaire une épreuve.'}</p>
      <div class="row"><button class="btn main" id="again">Nouvelle épreuve</button><a class="btn ghost" href="#/topik">Retour</a></div>
      <h2 style="margin-top:28px">Correction</h2>
      <ol class="corr">${Q.map((q, k) => `<li class="${ans[k] === q.right ? 'ok' : 'ko'}"><p class="ko">${esc(q.sent || q.say)}</p>
        <p class="small">${ans[k] === q.right ? '✓' : '✗ ' + (ans[k] ? 'Votre réponse : ' + esc(ans[k]) + ' · ' : 'Sans réponse · ')}Réponse : <b>${esc(q.right)}</b></p><p class="small muted">${esc(q.expl)}${q.src ? ' · phrase du 한국어기초사전' : ''}</p></li>`).join('')}</ol>`;
    $('#again', el).onclick = () => runExam(el, kind);
  };
  stopTopik();
  timer = setInterval(() => { const c = $('#clk'); if (!c) return stopTopik(); c.textContent = fmt(left()); if (left() <= 0) { toast('Temps écoulé.'); finish(); } }, 1000);
  draw();
}

// ---------- Atelier d'écriture ----------
export async function viewEcriture(el, id) {
  const w = await loadW();
  if (!id) {
    el.innerHTML = `<h1>Atelier d'écriture</h1><p class="muted prose">${esc(w.intro)}</p>
      ${[51, 52, 53, 54].map(q => `<h2>Question ${q}</h2><div class="wlist">${w.sujets.filter(s => s.q === q).map(s => `<a class="wcard" href="#/ecriture/${s.id}"><b>${esc(s.titre)}</b><span class="small muted">${S.writing && S.writing[s.id] ? 'Brouillon enregistré · ' + S.writing[s.id].t.length + ' car.' : esc(s.consigne)}</span></a>`).join('')}</div>`).join('')}`;
    return;
  }
  const s = w.sujets.find(x => x.id === id); if (!s) { location.hash = '#/ecriture'; return; }
  S.writing = S.writing || {}; const draft = S.writing[id] || { t: '' };
  const target = s.q === 53 ? [200, 300] : s.q === 54 ? [600, 700] : null;
  el.innerHTML = `<a class="small" href="#/ecriture">← Atelier</a><h1><span class="ko">${s.q}</span> ${esc(s.titre)}</h1>
    <p class="note">${esc(s.consigne)}</p>
    <div class="wgrid">
      <div>${s.texte ? `<div class="wtext ko">${esc(s.texte).replace(/\n/g, '<br>')}</div>` : ''}
        ${s.donnees ? `<ul class="wdata">${s.donnees.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        <label class="field" for="wt">Votre réponse</label>
        ${target ? '<div class="wongo" id="wg" aria-hidden="true"></div>' : ''}
        <textarea id="wt" class="ko" rows="${target ? 10 : 4}" spellcheck="false">${esc(draft.t)}</textarea>
        <p class="small" id="wc"></p>
        <div class="row"><button class="btn" id="wsave">Enregistrer le brouillon</button><button class="btn ghost" id="wmod">Voir le plan et le modèle</button></div>
        <div id="wm" hidden class="panel" style="margin-top:14px"><h3>Plan et éléments de réponse</h3><ul>${s.modele.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div></div>
      <aside class="panel"><h3>Grille d'auto-évaluation</h3><ul class="check">${s.criteres.map((c, k) => `<li><label><input type="checkbox" data-k="${k}" ${draft.c && draft.c[k] ? 'checked' : ''}> ${esc(c)}</label></li>`).join('')}</ul>
        <p class="small muted">Faites relire vos essais par un locuteur natif dès que possible : aucune grille automatique ne remplace une correction humaine.</p></aside></div>`;
  const ta = $('#wt'), wc = $('#wc'), grid = $('#wg');
  const upd = () => {
    const n = ta.value.length;
    wc.textContent = n + ' caractères (espaces compris)' + (target ? ` · objectif ${target[0]}–${target[1]}` : '');
    wc.className = 'small ' + (target ? (n >= target[0] && n <= target[1] ? 'ok' : n > target[1] ? 'ko' : '') : '');
    if (grid) { const cells = Math.max(target[1], Math.ceil((n + 1) / 20) * 20); grid.innerHTML = Array.from({ length: cells }, (_, k) => `<i class="${k < n ? 'f' : ''}${(k + 1) % 100 === 0 ? ' h' : ''}">${k < n ? esc(ta.value[k]).replace(' ', '&nbsp;') : ''}</i>`).join(''); }
  };
  const store = () => { S.writing[id] = { t: ta.value, c: $$('[data-k]').map(x => x.checked), at: Date.now() }; save(); };
  ta.oninput = () => { upd(); clearTimeout(ta._t); ta._t = setTimeout(store, 800); };
  $('#wsave').onclick = () => { store(); toast('Brouillon enregistré.'); };
  $('#wmod').onclick = () => { const m = $('#wm'); m.hidden = !m.hidden; };
  $$('[data-k]').forEach(c => c.onchange = store);
  upd();
}
