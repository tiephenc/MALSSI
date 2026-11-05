// MALSSI · Parcours, unités et exercices
import { C, unitOpen, wordInfo, rr } from '../content.js';
import { S, save } from '../store.js';
import { esc, $, $$, shuffle, pick, gradeTag, toast } from '../ui.js';
import { playBtn, speak, hasVoice } from '../tts.js';
import { split, join, INI, VOW, FIN } from '../hangul.js';

const LEVELS = [
  ['1급', 'Survivre au quotidien : se présenter, acheter, commander, l\'heure.'],
  ['2급', 'La vie quotidienne et les services publics.'],
  ['3급', 'La vie sociale, le style écrit, premières rédactions.'],
  ['4급', 'Actualités et sujets abstraits ; l\'essai court.'],
  ['5급', 'Textes spécialisés, expressions figées, proverbes.'],
  ['6급', 'Argumentation et registre soutenu ; l\'essai long.']];

function unitStatus(u) {
  const st = S.units[u.id];
  if (st && st.done) return `<span class="st ok">${st.best != null ? 'Terminée · ' + st.best + ' %' : 'Terminée'}</span>`;
  if (st) return '<span class="st">Commencée</span>';
  return unitOpen(u) ? '<span class="st">À faire</span>' : '<span class="st">Plus tard</span>';
}
export function viewParcours(el) {
  const e = C.etapes[0];
  const done = C.units.filter(u => S.units[u.id] && S.units[u.id].done).length;
  el.innerHTML = `
    <h1>Le parcours</h1>
    <p class="muted prose">Du hangeul au 6급, dans l'ordre du programme international de coréen standard. Chaque unité terminée ajoute ses mots à vos révisions.</p>
    <section class="level">
      <h2><span class="ko">한글</span> ${esc(e.titre.replace('Étape 0 · ', ''))} <small>${done} / ${C.units.length} unités</small></h2>
      <p class="muted prose">${esc(e.intro)}</p>
      <ol class="units">${C.units.map(u => `
        <li class="${unitOpen(u) ? '' : 'locked'}"><a href="#/unite/${u.id}">
          <span class="code">${u.id}</span>
          <span class="ti"><b>${esc(u.titre)}</b><span>${esc(u.objectif)}</span></span>
          ${unitStatus(u)}</a></li>`).join('')}
      </ol>
    </section>
    <section class="level">
      <h2>Les six niveaux du TOPIK <small>en préparation</small></h2>
      <div class="soon">${LEVELS.map(([k, d]) => `<div><b>${k}</b>${esc(d)}</div>`).join('')}</div>
    </section>`;
}

export function viewUnit(el, id) {
  const u = C.byId[id];
  if (!u) { el.innerHTML = '<div class="empty">Cette unité n\'existe pas. <a href="#/parcours">Retour au parcours</a></div>'; return; }
  if (!S.units[u.id]) { S.units[u.id] = { at: Date.now() }; save(); }
  const nextU = C.units[u.n + 1];
  el.innerHTML = `
    <header class="unit-head">
      <a class="small" href="#/parcours">← Parcours</a>
      <p class="code" style="margin:12px 0 4px">${u.id}</p>
      <h1>${esc(u.titre)}</h1>
      <p class="goal">${esc(u.objectif)}</p>
      ${hasVoice() ? '' : '<p class="note small">Aucune voix coréenne n\'est installée dans ce navigateur : l\'écoute est indisponible. Sous Windows, ajoutez la langue coréenne (Paramètres › Heure et langue › Voix) ; Chrome et Edge en proposent souvent une.</p>'}
    </header>
    <nav class="toc" aria-label="Sections de l'unité">
      <a href="#s-cours">Cours</a>${u.lettres.length ? '<a href="#s-lettres">Lettres</a>' : ''}<a href="#s-mots">Mots</a><a href="#s-ex">Exercices</a>
    </nav>
    <section class="sec prose" id="s-cours"><h2>Cours</h2>
      ${u.explication.map(p => `<p>${p}</p>`).join('')}
      ${u.attention ? `<p class="note"><b>Attention.</b> ${u.attention}</p>` : ''}
    </section>
    ${u.lettres.length ? `<section class="sec" id="s-lettres"><h2>Les lettres</h2>
      <div class="letters">${u.lettres.map(l => `
        <div class="letter"><div class="g ko">${l.j}</div>
          <div class="meta"><div class="top"><span class="rr">${esc(l.rr)}</span>${l.nom ? `<span class="nm">${l.nom}</span>` : ''}${playBtn(l.son, l.j)}</div>
          <span class="muted">${l.fr}</span></div></div>`).join('')}</div></section>` : ''}
    <section class="sec" id="s-mots"><h2>Les mots</h2>
      <p class="small muted">Prononciation, niveau et sens vérifiés dans le 한국어기초사전. Les gloses françaises sont rédigées pour MALSSI.</p>
      <div class="words">${u.mots.map(([ko, fr]) => wordRow(ko, fr)).join('')}</div></section>
    <section class="sec" id="s-ex"><h2>Exercices</h2><div id="quiz"></div></section>
    <div class="row" style="margin-top:32px">${nextU ? `<a class="btn ghost" href="#/unite/${nextU.id}">Unité suivante : ${esc(nextU.titre)}</a>` : ''}</div>`;
  startQuiz($('#quiz', el), u);
}
export function wordRow(ko, fr) {
  const w = wordInfo(ko) || {};
  const pr = w.pron && w.pron.replace(/\/.*/, '') !== ko ? `[<span class="ko">${esc(w.pron)}</span>] · ` : '';
  const ro = S.set.rr ? esc(rr(ko)) : '';
  return `<div class="word"><span class="w ko">${esc(ko)}</span>
    <span class="d"><span>${esc(fr)} ${gradeTag(w.niveau)}${w.origine && /[一-鿿]/.test(w.origine) ? ` <span class="muted small">${esc(w.origine)}</span>` : ''}</span>
    <span class="pr">${pr}${ro}</span></span>${playBtn(ko)}</div>`;
}

// ---------- Exercices générés à partir de l'unité ----------
function buildQuestions(u) {
  const letters = u.lettres.filter(l => l.rr && l.j);
  const allLetters = C.units.slice(0, u.n + 1).flatMap(x => x.lettres);
  const words = u.mots.map(m => m[0]);
  const known = C.units.slice(0, u.n + 1).flatMap(x => x.mots);
  const Q = [];
  // 1. lettre → romanisation
  shuffle(letters).slice(0, 4).forEach(l => {
    const others = pick([...new Set(allLetters.map(x => x.rr))], 3, [l.rr]);
    Q.push({ type: 'rr', prompt: l.j, ko: true, say: l.son, right: l.rr, choices: shuffle([l.rr, ...others]), q: 'Quelle est la romanisation de cette lettre ?' });
  });
  // 2. écoute → syllabe (seulement si une voix est disponible)
  if (hasVoice()) shuffle(words).slice(0, 3).forEach(w => {
    const others = pick(known.map(m => m[0]).filter(x => x.length === w.length), 3, [w]);
    if (others.length === 3) Q.push({ type: 'ecoute', prompt: null, say: w, right: w, choices: shuffle([w, ...others]), koChoices: true, q: 'Écoutez, puis choisissez le mot entendu.' });
  });
  // 3. mot → sens
  shuffle(u.mots).slice(0, 5).forEach(([ko, fr]) => {
    const others = pick(known.map(m => m[1]), 3, [fr]);
    Q.push({ type: 'sens', prompt: ko, ko: true, say: ko, right: fr, choices: shuffle([fr, ...others]), q: 'Que signifie ce mot ?' });
  });
  // 4. sens → mot
  shuffle(u.mots).slice(0, 3).forEach(([ko, fr]) => {
    const others = pick(known.map(m => m[0]), 3, [ko]);
    Q.push({ type: 'mot', prompt: fr, right: ko, choices: shuffle([ko, ...others]), koChoices: true, q: 'Quel mot correspond à ce sens ?' });
  });
  // 5. assembler une syllabe
  const syls = [...new Set(words.join('').split(''))].filter(ch => split(ch));
  shuffle(syls).slice(0, 2).forEach(ch => Q.push({ type: 'bloc', right: ch, q: 'Assemblez cette syllabe, lettre par lettre.' }));
  return shuffle(Q).slice(0, 12);
}
function startQuiz(box, u) {
  const Q = buildQuestions(u); let i = 0, ok = 0;
  const st = S.units[u.id];
  const intro = () => {
    box.innerHTML = `<div class="quiz"><p class="muted">${Q.length} questions. À partir de 80 % de bonnes réponses, l'unité est terminée et ses ${u.mots.length} mots rejoignent vos révisions.</p>
      ${st && st.done ? `<p class="small">Meilleur score : ${st.best} %.</p>` : ''}
      <button class="btn main" id="qgo">${st && st.done ? 'Refaire les exercices' : 'Commencer les exercices'}</button></div>`;
    $('#qgo', box).onclick = () => { i = 0; ok = 0; show(); };
  };
  const finish = () => {
    const pct = Math.round(ok / Q.length * 100), pass = pct >= 80;
    const s = S.units[u.id] || (S.units[u.id] = {});
    s.best = Math.max(s.best || 0, pct);
    let msg;
    if (pass && !s.done) { s.done = Date.now(); msg = `Unité terminée. Ses ${u.mots.length} mots sont ajoutés à vos révisions.`; }
    else msg = pass ? 'Bien joué, l\'unité reste acquise.' : 'Relisez le cours et réécoutez les mots, puis réessayez : il faut 80 %.';
    save();
    const nextU = C.units[u.n + 1];
    box.innerHTML = `<div class="quiz"><p class="prompt fr">${ok} / ${Q.length} · ${pct} %</p><p>${msg}</p>
      <div class="row"><button class="btn" id="qre">Recommencer</button>${pass && nextU ? `<a class="btn main" href="#/unite/${nextU.id}">Unité suivante</a>` : ''}${pass ? '<a class="btn ghost" href="#/">Retour à la séance</a>' : ''}</div></div>`;
    $('#qre', box).onclick = () => startQuiz(box, u);
  };
  const show = () => {
    if (i >= Q.length) return finish();
    const q = Q[i];
    const head = `<div class="qprog"><span>Question ${i + 1} / ${Q.length}</span><span>${ok} bonne${ok > 1 ? 's' : ''} réponse${ok > 1 ? 's' : ''}</span></div><p class="q">${esc(q.q)}</p>`;
    if (q.type === 'bloc') return showBloc(q, head);
    const pr = q.prompt == null ? `<div class="prompt">${playBtn(q.say, 'le mot')}</div>` :
      `<div class="prompt ${q.ko ? '' : 'fr'}">${esc(q.prompt)}${q.say && q.type !== 'sens' ? playBtn(q.say) : ''}</div>`;
    box.innerHTML = `<div class="quiz">${head}${pr}<div class="choices">${q.choices.map(c => `<button type="button" class="${q.koChoices ? 'ko' : ''}">${esc(c)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p></div>`;
    if (q.type === 'ecoute') setTimeout(() => speak(q.say), 250);
    $$('.choices button', box).forEach(b => b.onclick = () => {
      const good = b.textContent === q.right;
      $$('.choices button', box).forEach(x => { x.disabled = true; if (x.textContent === q.right) x.classList.add('right'); });
      if (!good) b.classList.add('wrong'); else ok++;
      const fb = $('.feedback', box); fb.className = 'feedback ' + (good ? 'ok' : 'ko');
      fb.textContent = good ? 'Juste.' : 'La bonne réponse : ' + q.right + '.';
      if (q.type === 'sens' || q.type === 'mot') speak(q.type === 'sens' ? q.prompt : q.right);
      i++; setTimeout(show, good ? 900 : 1900);
    });
    const first = $('.choices button', box); first && first.focus({ preventScroll: true });
  };
  const showBloc = (q, head) => {
    const t = split(q.right);
    const pool = (arr, want, n) => shuffle([want, ...pick(arr.filter(Boolean), n, [want])]);
    const opts = { i: pool(INI, t.i, 4), v: pool(VOW, t.v, 4), f: t.f ? pool(FIN.filter(x => x.length && x.length === 1), t.f, 3).concat('') : shuffle(['', ...pick(['ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ'], 3)]) };
    const sel = { i: null, v: null, f: null };
    box.innerHTML = `<div class="quiz">${head}<div class="prompt fr">${esc(q.right)} ${playBtn(q.right)}</div>
      <div class="compose">
        ${[['i', 'Consonne initiale'], ['v', 'Voyelle'], ['f', 'Consonne finale']].map(([k, l]) => `<div><div class="lbl">${l}</div><div class="slots" data-k="${k}">${opts[k].map(x => `<button type="button" data-v="${x}" aria-pressed="false" aria-label="${x || 'aucune'}">${x || '∅'}</button>`).join('')}</div></div>`).join('')}
        <div class="res ko" aria-live="polite"></div>
        <div class="row"><button class="btn main" id="bok" disabled>Valider</button></div>
        <p class="feedback" aria-live="polite"></p></div></div>`;
    // l'invite montre la syllabe : l'exercice consiste à la décomposer correctement
    const res = $('.res', box), go = $('#bok', box);
    $$('.slots', box).forEach(row => row.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const k = row.dataset.k;
      $$('button', row).forEach(x => x.setAttribute('aria-pressed', x === b)); sel[k] = b.dataset.v;
      res.textContent = sel.i && sel.v ? join(sel.i, sel.v, sel.f || '') : ''; go.disabled = !(sel.i && sel.v && sel.f !== null);
    });
    go.onclick = () => {
      const good = join(sel.i, sel.v, sel.f || '') === q.right; if (good) ok++;
      const fb = $('.feedback', box); fb.className = 'feedback ' + (good ? 'ok' : 'ko');
      fb.textContent = good ? 'Juste.' : `Il fallait ${t.i} + ${t.v}${t.f ? ' + ' + t.f : ' sans finale'}.`;
      go.disabled = true; $$('.slots button', box).forEach(x => x.disabled = true); i++; setTimeout(show, good ? 900 : 2200);
    };
  };
  intro();
}
