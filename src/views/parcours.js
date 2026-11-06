// MALSSI · Parcours, unités et exercices
import { C, unitOpen, wordInfo, rr, markEx, blankEx, exAnswer, plainEx } from '../content.js';
import { S, save, logError } from '../store.js';
import { esc, $, $$, shuffle, pick, gradeTag, toast, onLeave } from '../ui.js';
import { playBtn, speak, speakSeq, hasVoice } from '../tts.js';
import { split, join, INI, VOW, FIN } from '../hangul.js';
import { carte, placeStations } from '../carte.js';
import { paintUnit, fontsReady, koTitle } from '../covers.js';

const KO_LEVEL = { 0: '한글', 1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급' };
function unitStatus(u) {
  const st = S.units[u.id];
  if (st && st.done) return `<span class="st ok">${st.best != null ? 'Terminée · ' + st.best + ' %' : 'Terminée'}</span>`;
  if (st) return '<span class="st">Commencée</span>';
  return unitOpen(u) ? '<span class="st">À faire</span>' : '<span class="st">Plus tard</span>';
}
export function viewParcours(el) {
  const all = C.units.length, done = C.units.filter(u => S.units[u.id] && S.units[u.id].done).length;
  const cur = C.units.find(u => !(S.units[u.id] && S.units[u.id].done));
  el.innerHTML = `
    <a class="small" href="#/parcours">← L'étagère</a>
    <h1>Le parcours</h1>
    <p class="muted prose">Du hangeul au 6급, dans l'ordre du programme international de coréen standard. Chaque unité terminée ajoute ses mots à vos révisions. ${done} unité${done > 1 ? 's' : ''} terminée${done > 1 ? 's' : ''} sur ${all}.</p>
    <div class="carte-wrap">${carte(C.etapes, C.etapes.map(e => e.unites.filter(u => S.units[u.id] && S.units[u.id].done).length))}</div>
    <nav class="lvl-tabs" aria-label="Niveaux">${C.etapes.map(e => { const us = e.unites, d = us.filter(u => S.units[u.id] && S.units[u.id].done).length;
      return `<a href="#lvl-${e.id}" class="${cur && cur.etape === e.id ? 'cur' : ''}"><b class="ko">${KO_LEVEL[e.niveau || 0]}</b><span class="bar"><i style="width:${Math.round(d / us.length * 100)}%"></i></span></a>`; }).join('')}</nav>
    ${C.etapes.map(e => { const d = e.unites.filter(u => S.units[u.id] && S.units[u.id].done).length; return `
    <section class="level" id="lvl-${e.id}">
      <h2><span class="ko">${KO_LEVEL[e.niveau || 0]}</span> ${esc(e.titre.replace(/^[^·]*· /, ''))} <small>${d} / ${e.unites.length}</small></h2>
      <p class="muted prose">${esc(e.intro)}</p>
      <ol class="units">${e.unites.map(u => `
        <li class="${unitOpen(u) ? '' : 'locked'}${cur === u ? ' now' : ''}"><a href="#/unite/${u.id}">
          <span class="code">${u.id}</span>
          <span class="ti"><b>${esc(u.titre)}</b><span>${esc(u.objectif)}</span></span>
          ${unitStatus(u)}</a></li>`).join('')}
      </ol>
    </section>`; }).join('')}`;
  placeStations(el);
  $$('.carte .stations a', el).forEach(a => a.onclick = ev => { ev.preventDefault(); const t = document.getElementById('lvl-' + a.dataset.lvl); t && t.scrollIntoView({ behavior: 'smooth' }); });
  $$('.lvl-tabs a', el).forEach(a => a.onclick = ev => { ev.preventDefault(); const t = document.querySelector(a.getAttribute('href')); t && t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
}

function pointHtml(p, i) {
  return `<article class="gpoint" id="p-${i}">
    <h3><span class="ko">${esc(p.f)}</span></h3>
    <p class="gsens">${esc(p.s)}</p>
    <ul class="gcons">${p.c.map(c => `<li>${esc(c).replace(/([\uAC00-\uD7A3ㄱ-ㅣ()\-/]+[\uAC00-\uD7A3ㄱ-ㅣ]+)/g, '<span class="ko">$1</span>')}</li>`).join('')}</ul>
    ${p.n ? `<p class="note small"><b>Attention.</b> ${esc(p.n)}</p>` : ''}
    <div class="gex">${p.ex.map(([ko, fr]) => `<div class="exl"><p class="ko"><span>${markEx(ko, esc)}</span> ${playBtn(plainEx(ko), 'la phrase')}</p><p class="small muted">${esc(fr)}</p></div>`).join('')}</div>
  </article>`;
}
export function viewUnit(el, id) {
  const u = C.byId[id];
  if (!u) { el.innerHTML = '<div class="empty">Cette unité n\'existe pas. <a href="#/parcours">Retour au parcours</a></div>'; return; }
  if (!S.units[u.id]) { S.units[u.id] = { at: Date.now() }; save(); }
  const nextU = C.units[u.n + 1], prevU = C.units[u.n - 1];
  fontsReady().then(() => { const im = el.querySelector('.unit-poster img'); if (im) im.src = paintUnit(u, C.units).cover; });
  const gram = !!u.points;
  el.innerHTML = `
    <header class="unit-head">
      <a class="small" href="#/parcours">← L'étagère</a>
      <div class="rise"><p class="code" style="margin:12px 0 4px">${u.id}${u.theme ? ' / ' + esc(u.theme) : ''}</p></div>
      <div class="rise"><h1>${esc(u.titre)}</h1></div>
      <div class="rise"><p class="kot">${esc(koTitle(u).join(' · '))}</p></div>
      <div class="rise"><p class="goal">${esc(u.objectif)}</p></div>
      <div class="unit-poster" aria-hidden="true"><img alt=""></div>
      ${hasVoice() ? '' : '<p class="note small">Aucune voix coréenne n\'est installée dans ce navigateur : l\'écoute est indisponible. Sous Windows, ajoutez la langue coréenne (Paramètres › Heure et langue › Voix) ; Chrome et Edge en proposent souvent une.</p>'}
    </header>
    <nav class="toc" aria-label="Sections de l'unité">
      ${u.dia ? '<a href="#s-dia">대화 Dialogue</a>' : ''}<a href="#s-cours">Cours</a>${gram ? u.points.map((p, i) => `<a href="#p-${i}" class="ko">${esc(p.f.split(' (')[0])}</a>`).join('') : ''}${!gram && u.lettres.length ? '<a href="#s-lettres">Lettres</a>' : ''}${u.lec ? '<a href="#s-lec">읽기 Lecture</a>' : ''}<a href="#s-mots">Mots</a>${u.cul ? '<a href="#s-cul">문화 Culture</a>' : ''}<a href="#s-ex">Exercices</a>
    </nav>
    ${u.dia ? `<section class="sec" id="s-dia"><h2><span class="ko">대화</span> Dialogue</h2>
      <p class="small muted">Écoutez d'abord sans lire, puis lisez en affichant la traduction.</p>
      <div class="row" style="margin-bottom:12px"><button class="btn sm" id="dplay">Écouter tout le dialogue</button><button class="btn sm ghost" id="dtr" aria-pressed="false">Afficher la traduction</button></div>
      <div class="dialog">${u.dia.map(([who, ko, fr], i) => `<div class="bub ${i % 2 ? 'r' : 'l'}"><span class="who ko">${esc(who)}</span><p class="ko">${esc(ko)} ${playBtn(ko)}</p><p class="tr small" hidden>${esc(fr)}</p></div>`).join('')}</div></section>` : ''}
    ${gram ? `<section class="sec prose" id="s-cours"><h2>Cours</h2><p>${esc(u.intro)}</p>${u.points.map(pointHtml).join('')}</section>`
    : `<section class="sec prose" id="s-cours"><h2>Cours</h2>
      ${u.explication.map(p => `<p>${p}</p>`).join('')}
      ${u.attention ? `<p class="note"><b>Attention.</b> ${u.attention}</p>` : ''}
    </section>
    ${u.lettres.length ? `<section class="sec" id="s-lettres"><h2>Les lettres</h2>
      <div class="letters">${u.lettres.map(l => `
        <div class="letter"><div class="g ko">${l.j}</div>
          <div class="meta"><div class="top"><span class="rr">${esc(l.rr)}</span>${l.nom ? `<span class="nm">${l.nom}</span>` : ''}${playBtn(l.son, l.j)}</div>
          <span class="muted">${l.fr}</span></div></div>`).join('')}</div></section>` : ''}`}
    ${u.lec ? `<section class="sec" id="s-lec"><h2><span class="ko">읽기</span> Lecture</h2>
      <article class="reading"><h3 class="ko">${esc(u.lec.t)}</h3><p class="ko rtxt">${esc(u.lec.ko)}</p>
        <div class="row"><button class="btn sm" data-say="${esc(u.lec.ko)}">Écouter le texte</button><button class="btn sm ghost" id="ltr">Afficher la traduction</button></div>
        <p class="tr" id="lfr" hidden>${esc(u.lec.fr)}</p></article>
      <p class="small muted">Les questions de compréhension sont dans les exercices de l'unité.</p></section>` : ''}
    <section class="sec" id="s-mots"><h2>Les mots</h2>
      <p class="small muted">Prononciation, niveau et sens vérifiés dans le 한국어기초사전. Les gloses françaises sont rédigées pour MALSSI.</p>
      <div class="words">${u.mots.map(([ko, fr]) => wordRow(ko, fr)).join('')}</div></section>
    ${u.cul ? `<section class="sec" id="s-cul"><h2><span class="ko">문화</span> Culture</h2><p class="culture prose">${esc(u.cul)}</p></section>` : ''}
    <section class="sec" id="s-ex"><h2>Exercices</h2><div id="quiz"></div></section>
    <div class="row unit-nav">${prevU ? `<a class="btn ghost" href="#/unite/${prevU.id}">← ${esc(prevU.titre)}</a>` : ''}${nextU ? `<a class="btn ghost" href="#/unite/${nextU.id}">${esc(nextU.titre)} →</a>` : ''}</div>`;
  const dtr = $('#dtr', el); if (dtr) dtr.onclick = () => { const on = dtr.getAttribute('aria-pressed') !== 'true'; dtr.setAttribute('aria-pressed', on); dtr.textContent = on ? 'Masquer la traduction' : 'Afficher la traduction'; $$('.dialog .tr', el).forEach(t => t.hidden = !on); };
  const dpl = $('#dplay', el); if (dpl) dpl.onclick = () => speakSeq(u.dia.map(d => d[1]));
  const ltr = $('#ltr', el); if (ltr) ltr.onclick = () => { const f = $('#lfr', el); f.hidden = !f.hidden; ltr.textContent = f.hidden ? 'Afficher la traduction' : 'Masquer la traduction'; };
  // barre de lecture
  const bar = document.createElement('div'); bar.className = 'readbar'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  const onScroll = () => { const h = document.documentElement; bar.style.setProperty('--p', Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  onLeave(() => { removeEventListener('scroll', onScroll); bar.remove(); });
  $$('.toc a', el).forEach(a => a.onclick = ev => { ev.preventDefault(); const t = document.getElementById(a.getAttribute('href').slice(1)); t && t.scrollIntoView({ behavior: 'smooth' }); });
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
function buildGrammarQ(u) {
  const lvl = C.units.filter(x => x.niveau === u.niveau && x.points);
  const pool = [...new Set(lvl.flatMap(x => x.points.flatMap(p => p.ex.map(e => exAnswer(e[0])))))];
  const known = C.units.filter(x => x.niveau <= u.niveau && x.niveau >= u.niveau - 1).flatMap(x => x.mots);
  const Q = [];
  u.points.forEach(p => p.ex.forEach(([ko, fr]) => {
    const ans = exAnswer(ko), near = pool.filter(x => Math.abs(x.length - ans.length) <= 2), others = pick(near.length > 6 ? near : pool, 3, [ans]);
    if (others.length === 3) Q.push({ type: 'trou', prompt: blankEx(ko), sent: true, sub: fr, right: ans, choices: shuffle([ans, ...others]), koChoices: true, say: plainEx(ko), q: 'Complétez la phrase. (' + p.f.split(' (')[0] + ')' });
  }));
  const exs = u.points.flatMap(p => p.ex);
  if (hasVoice()) shuffle(exs).slice(0, 2).forEach(([ko, fr]) => {
    const others = pick(C.units.filter(x => x.niveau === u.niveau && x.points).flatMap(x => x.points.flatMap(p => p.ex.map(e => e[1]))), 3, [fr]);
    Q.push({ type: 'ecoute', prompt: null, say: plainEx(ko), right: fr, choices: shuffle([fr, ...others]), q: 'Écoutez la phrase, puis choisissez sa traduction.' });
  });
  shuffle(u.mots).slice(0, 3).forEach(([ko, fr]) => {
    Q.push({ type: 'sens', prompt: ko, ko: true, say: ko, right: fr, choices: shuffle([fr, ...pick(known.map(m => m[1]), 3, [fr])]), q: 'Que signifie ce mot ?' });
  });
  shuffle(u.mots).slice(0, 2).forEach(([ko, fr]) => {
    Q.push({ type: 'mot', prompt: fr, right: ko, choices: shuffle([ko, ...pick(known.map(m => m[0]), 3, [ko])]), koChoices: true, q: 'Quel mot correspond à ce sens ?' });
  });
  const base = shuffle(Q).slice(0, 10);
  // compréhension de la lecture : toujours posée, à la fin
  if (u.lec) u.lec.q.forEach(([q, opts, k]) => base.push({ type: 'lec', prompt: q, right: opts[k], choices: shuffle(opts.slice()), q: 'Lecture : ' + u.lec.t, ctx: u.lec.ko }));
  return base;
}
function buildQuestions(u) {
  if (u.points) return buildGrammarQ(u);
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
      q.ctx ? `<details class="ctx"><summary>Relire le texte</summary><p class="ko">${esc(q.ctx)}</p></details><div class="prompt fr">${esc(q.prompt)}</div>` :
      q.sent ? `<div class="prompt sent ko">${esc(q.prompt)}</div>` :
      `<div class="prompt ${q.ko ? '' : 'fr'}">${esc(q.prompt)}${q.say && q.type !== 'sens' ? playBtn(q.say) : ''}</div>`;
    box.innerHTML = `<div class="quiz">${head}${pr}<div class="choices">${q.choices.map(c => `<button type="button" class="${q.koChoices ? 'ko' : ''}">${esc(c)}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p></div>`;
    if (q.type === 'ecoute') setTimeout(() => speak(q.say), 250);
    $$('.choices button', box).forEach(b => b.onclick = () => {
      const good = b.textContent === q.right;
      $$('.choices button', box).forEach(x => { x.disabled = true; if (x.textContent === q.right) x.classList.add('right'); });
      if (!good) { b.classList.add('wrong'); logError({ u: u.id, q: q.q, p: q.prompt || q.say || '', a: q.right, g: b.textContent }); } else ok++;
      const fb = $('.feedback', box); fb.className = 'feedback ' + (good ? 'ok' : 'ko');
      fb.textContent = good ? 'Juste.' : 'La bonne réponse : ' + q.right + '.';
      if (q.type === 'sens' || q.type === 'mot') speak(q.type === 'sens' ? q.prompt : q.right);
      if (q.type === 'trou') { speak(q.say); fb.textContent += ' ' + q.sub; }
      i++; setTimeout(show, q.type === 'trou' ? (good ? 2200 : 3200) : good ? 900 : 1900);
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
