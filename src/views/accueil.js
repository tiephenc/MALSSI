// MALSSI · page d'accueil
// En haut : un toit-terrasse de Séoul à l'heure dorée ; le défilement fait tomber la nuit puis lève les yeux
// vers les étoiles. Le pointeur repousse les grains de lumière, le survol du bouton calme la scène et l'ambiance.
// Puis : le prisme qui décompose la lumière, la montée vers les étoiles, l'écriture en blocs, la courbe d'oubli.
import { C } from '../content.js';
import { CONFIG } from '../config.js';
import { magpie } from '../magpie.js';
import { $, $$, esc } from '../ui.js';
import { speak } from '../tts.js';
import { cityScene } from '../city.js';
import { prismScene } from '../prism.js';
import { carte, placeStations } from '../carte.js';
import { toggleAmbiance, muffle, stopAmbiance } from '../ambiance.js';

const KO = { 0: '한글', 1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급' };
const TABS = [
  ['듣기', 'Écouter', 'Écoutez le dialogue de l\'unité, puis répondez sans le texte.', '잘 들어 보세요.'],
  ['읽기', 'Lire', 'Lisez le texte du niveau, puis vérifiez avec les questions.', '천천히 읽어 보세요.'],
  ['쓰기', 'Écrire', 'Rédigez sur la grille 원고지, comme aux questions 51 à 54.', '생각을 글로 써 보세요.'],
  ['단어', 'Retenir', 'Révisez chaque mot au moment où vous alliez l\'oublier.', '매일 조금씩 외워요.']];
let stop = null; export function stopAccueil() { if (stop) stop(); stop = null; stopAmbiance(); }

export function viewAccueil(el) {
  document.body.classList.add('is-landing');
  const nPts = C.units.reduce((a, u) => a + (u.points ? u.points.length : 0), 0);
  const nWords = Object.keys(C.lex).length;
  el.innerHTML = `
  <div class="lp">
    <section class="lp-hero" aria-labelledby="lp-h">
      <div class="lp-stick">
        <canvas class="lp-city" aria-hidden="true"></canvas>
        <div class="lp-ui">
          <header class="lp-top">
            <a class="lp-brand" href="#/accueil">${magpie(30, { label: '' })}<b class="ko">말씨</b></a>
            <nav aria-label="Accueil"><a href="#/parcours">Parcours</a><a href="#/topik">TOPIK</a><a href="#/apropos">À propos</a><a class="pill" href="#/">Ouvrir le site</a></nav>
          </header>
          <div class="lp-center">
            <p class="lp-neon ko" aria-hidden="true">별을 향해</p>
            <h1 id="lp-h">Vers les étoiles.</h1>
            <p class="cap">Le coréen en français, du hangeul au 6급.<br>Gratuit, sans publicité, même hors connexion.</p>
            <a class="go" href="#/unite/H01"><span class="ring"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg></span><span class="go-l">Commencer par le hangeul</span></a>
          </div>
          <div class="corner"><span>Faites défiler</span><i></i>
            <button class="sound" type="button" aria-pressed="false" aria-label="Ambiance sonore"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5Z"/><path class="w" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="x" d="m16 10 4 4m0-4-4 4"/></svg></button></div>
        </div>
        <div class="lp-loader" aria-hidden="true"><span></span></div>
      </div>
    </section>

    <section class="lp-light" aria-labelledby="ll-h">
      <canvas class="lp-prism" aria-hidden="true"></canvas>
      <div class="lp-copy">
        <h2 id="ll-h" class="lp-word ko">빛</h2>
        <p class="lede"><span>Une seule lumière,</span><span>quatre compétences.</span></p>
        <div class="lp-tabs" role="tablist" aria-label="Compétences">${TABS.map(([k, f], i) => `${i ? '<span class="dot" aria-hidden="true">·</span>' : ''}<button class="tab" role="tab" type="button" aria-selected="${i === 0}" data-i="${i}"><span class="ko">${k}</span> ${f}</button>`).join('')}</div>
        <div class="cmd"><span class="cmd-text">${esc(TABS[0][2])}</span>
          <button class="say" type="button" aria-label="Écouter la phrase coréenne"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg></button></div>
        <p class="cmd-ko ko">${esc(TABS[0][3])}</p>
      </div>
    </section>

    <section class="lp-sec lp-path" aria-labelledby="lpath-h">
      <div class="lp-txt"><h2 id="lpath-h">De toit en toit, jusqu'à l'étoile du 6급</h2>
        <p>${C.units.length} unités, ${nPts} points de grammaire, ${nWords} mots vérifiés dans le dictionnaire de l'Institut national de la langue coréenne. Chaque unité terminée vous fait monter d'un toit.</p>
        <ol class="lp-steps">${C.etapes.map(e => `<li><b class="ko">${KO[e.niveau || 0]}</b> ${esc(e.titre.replace(/^[^·]*· /, ''))} <small>${e.unites.length} unités</small></li>`).join('')}</ol></div>
      <div class="lp-map">${carte(C.etapes, C.etapes.map(() => 0), { big: true })}</div>
    </section>

    <section class="lp-sec lp-blocks" aria-labelledby="lb-h">
      <div class="lp-txt"><h2 id="lb-h">Une écriture en blocs</h2>
        <p>Le hangeul a été promulgué en 1446 pour être appris en quelques jours. Chaque syllabe range une consonne, une voyelle et parfois une consonne finale dans un carré. Touchez une syllabe pour l'entendre.</p></div>
      <div class="lp-syls">${[['한', 'ㅎ', 'ㅏ', 'ㄴ'], ['국', 'ㄱ', 'ㅜ', 'ㄱ'], ['어', 'ㅇ', 'ㅓ', '']].map(([s, i, v, f], k) => `
        <button class="lp-syl" type="button" data-say="${s}" style="--d:${k * 0.25}s" aria-label="Écouter ${s}">
          <span class="pc i ko">${i}</span><span class="pc v ko ${'ㅜㅗㅡ'.includes(v) ? 'h' : ''}">${v}</span>${f ? `<span class="pc f ko">${f}</span>` : ''}<span class="whole ko">${s}</span></button>`).join('')}</div>
    </section>

    <section class="lp-sec lp-curve" aria-labelledby="lc-h">
      <div class="lp-txt"><h2 id="lc-h">Réviser au moment où l'on oublie</h2>
        <p>L'algorithme FSRS calcule pour chaque mot le jour où vous alliez l'oublier. Chaque révision réussie éloigne la suivante : quelques minutes par jour suffisent pour retenir des milliers de mots. Vos paquets Anki s'importent en un clic.</p></div>
      <svg class="curve" viewBox="0 0 520 240" aria-hidden="true">
        <line x1="40" y1="200" x2="500" y2="200" class="ax"/><line x1="40" y1="20" x2="40" y2="200" class="ax"/>
        <path class="c c1" d="M40 30 C70 120 90 160 120 175"/><path class="c c2" d="M120 30 C170 100 200 140 240 155"/>
        <path class="c c3" d="M240 30 C320 70 360 100 420 112"/><path class="c c4" d="M420 30 C450 40 480 48 500 52"/>
        <g class="rv"><circle cx="120" cy="30" r="6"/><circle cx="240" cy="30" r="6"/><circle cx="420" cy="30" r="6"/></g>
        <text x="44" y="226">aujourd'hui</text><text x="410" y="226">dans un mois</text></svg>
    </section>

    <section class="lp-sec lp-write" aria-labelledby="lw-h">
      <div class="lp-txt"><h2 id="lw-h">Écrire comme le jour de l'examen</h2>
        <p>L'atelier reproduit la feuille quadrillée 원고지 des questions 51 à 54, compte vos caractères et vous guide avec un plan et une grille d'auto-évaluation.</p></div>
      <div class="lp-wongo ko" aria-hidden="true">${(() => { const t = '오늘날 많은 사람들이 스마트폰으로 소통한다.'.split(''); return t.map((c, k) => `<i style="--k:${k}">${c === ' ' ? '' : c}</i>`).join('') + '<i></i>'.repeat(Math.ceil(t.length / 10) * 10 + 10 - t.length); })()}</div>
    </section>

    <section class="lp-end">
      <canvas class="lp-city2" aria-hidden="true"></canvas>
      <div class="lp-end-in">
        <div class="lp-pie2">${magpie(84, { label: '' })}</div>
        <h2>La pie annonce les bonnes nouvelles.</h2>
        <p>En Corée, le chant de la pie (까치) annonce une visite ou une bonne nouvelle. La vôtre : le hangeul s'apprend dès ce soir.</p>
        <div class="row lp-cta"><a class="btn main lg" href="#/unite/H01">Commencer par le hangeul</a><a class="btn ghost lg" href="${CONFIG.kofi}" target="_blank" rel="noopener">Soutenir sur Ko-fi</a></div>
        <p class="small">Sans compte obligatoire. Vocabulaire vérifié dans le 한국어기초사전 (CC BY-SA 2.0 KR).</p>
      </div>
    </section>
  </div>`;
  const hero = $('.lp-hero', el);
  const ui = $('.lp-ui', el);
  const city = cityScene($('.lp-city', el), { scrollEl: hero, onT: t => { const k = Math.max(0, Math.min(1, (t - 0.5) / 0.16)); ui.style.setProperty('--k', k.toFixed(3)); } });
  const city2 = cityScene($('.lp-city2', el), { small: true, seed: 77, t: 0.97, kind: 'toits', sunX: 0.7 });
  const prism = prismScene($('.lp-prism', el), { cx: innerWidth < 820 ? 0.5 : 0.7 });
  stopAccueil(); stop = () => { city.stop(); city2.stop(); prism(); };
  // chargement puis apparition de l'interface
  const reveal = () => { $('.lp-loader', el)?.classList.add('gone'); setTimeout(() => $('.lp-ui', el)?.classList.add('on'), 400); };
  (document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]) : Promise.resolve()).then(reveal);
  // survol du bouton : la ville ralentit, la poussière se disperse, l'ambiance s'assourdit
  const go = $('.go', el);
  go.addEventListener('pointerenter', () => { city.calm(true); muffle(true); });
  go.addEventListener('pointerleave', () => { city.calm(false); muffle(false); });
  const snd = $('.sound', el); snd.onclick = () => snd.setAttribute('aria-pressed', String(toggleAmbiance()));
  // onglets du prisme
  let cur = 0;
  $$('.tab', el).forEach(b => b.onclick = () => {
    cur = +b.dataset.i; $$('.tab', el).forEach(x => x.setAttribute('aria-selected', String(x === b)));
    const t = $('.cmd-text', el), k = $('.cmd-ko', el); t.classList.add('swap'); k.classList.add('swap');
    setTimeout(() => { t.textContent = TABS[cur][2]; k.textContent = TABS[cur][3]; t.classList.remove('swap'); k.classList.remove('swap'); }, 160);
  });
  $('.say', el).onclick = () => speak(TABS[cur][3]);
  placeStations(el);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.25 });
  $$('.lp-sec', el).forEach(s => io.observe(s));
}
