// MALSSI · page d'accueil animée
// Ouverture : les trois signes fondateurs des voyelles (le ciel ·, la terre ㅡ, l'être humain ㅣ) apparaissent,
// puis le nom 말씨 se trace trait par trait ; la pie traverse la page. Le défilement assemble ensuite des syllabes,
// déroule les niveaux, trace la courbe d'oubli et remplit une grille 원고지.
import { C } from '../content.js';
import { CONFIG } from '../config.js';
import { magpie } from '../magpie.js';
import { $, $$, esc } from '../ui.js';
import { speak } from '../tts.js';

const KO = { 0: '한글', 1: '1급', 2: '2급', 3: '3급', 4: '4급', 5: '5급', 6: '6급' };
export function viewAccueil(el) {
  document.body.classList.add('is-landing');
  const nPts = C.units.reduce((a, u) => a + (u.points ? u.points.length : 0), 0);
  const nWords = Object.keys(C.lex).length;
  el.innerHTML = `
  <div class="lp">
    <header class="lp-top"><a class="lp-brand" href="#/accueil">${magpie(34, { label: '' })}<b class="ko">말씨</b><span>MALSSI</span></a>
      <nav><a href="#/apropos">À propos</a><a class="btn sm main" href="#/">Ouvrir le site</a></nav></header>

    <section class="lp-hero" aria-labelledby="lp-h">
      <svg class="lp-signs" viewBox="0 0 300 300" aria-hidden="true">
        <circle class="s-sky" cx="150" cy="58" r="20"/>
        <rect class="s-earth" x="40" y="150" width="220" height="16" rx="3"/>
        <rect class="s-man" x="142" y="96" width="16" height="170" rx="3"/>
      </svg>
      <svg class="lp-title" viewBox="0 0 640 260" role="img" aria-label="말씨">
        <text x="50%" y="205" text-anchor="middle" class="ko">말씨</text>
      </svg>
      <div class="lp-pie" aria-hidden="true">${magpie(84, { label: '' })}</div>
      <h1 id="lp-h" class="lp-claim">Le coréen, du hangeul au 6급.<br><span>En français, gratuitement.</span></h1>
      <p class="lp-sub">Un parcours rédigé et vérifié, la révision espacée FSRS, des épreuves blanches au format du TOPIK et un atelier d'écriture. Tout fonctionne dans votre navigateur, même hors connexion.</p>
      <div class="row lp-cta"><a class="btn main lg" href="#/unite/H01">Commencer par le hangeul</a><a class="btn ghost lg" href="#/parcours">Voir le parcours</a></div>
      <p class="lp-hint" aria-hidden="true">Faites défiler</p>
    </section>

    <section class="lp-sec lp-blocks" aria-labelledby="lb-h">
      <div class="lp-txt"><h2 id="lb-h">Une écriture en blocs</h2>
        <p>Le hangeul a été conçu en 1446 pour être appris en quelques jours. Chaque syllabe assemble une consonne, une voyelle et parfois une consonne finale dans un carré. Touchez une syllabe pour l'entendre.</p></div>
      <div class="lp-syls">${[['한', 'ㅎ', 'ㅏ', 'ㄴ'], ['국', 'ㄱ', 'ㅜ', 'ㄱ'], ['어', 'ㅇ', 'ㅓ', '']].map(([s, i, v, f], k) => `
        <button class="lp-syl" type="button" data-say="${s}" style="--d:${k * 0.25}s" aria-label="Écouter ${s}">
          <span class="pc i ko">${i}</span><span class="pc v ko ${'ㅜㅗㅡ'.includes(v) ? 'h' : ''}">${v}</span>${f ? `<span class="pc f ko">${f}</span>` : ''}<span class="whole ko">${s}</span></button>`).join('')}</div>
    </section>

    <section class="lp-sec lp-levels" aria-labelledby="ll-h">
      <h2 id="ll-h">Sept étapes jusqu'au sommet</h2>
      <p class="lp-lead">${C.units.length} unités, ${nPts} points de grammaire, ${nWords} mots vérifiés dans le parcours et 20 000 sens du dictionnaire de l'Institut national de la langue coréenne.</p>
      <ol class="lp-track">${C.etapes.map((e, k) => `<li style="--k:${k}"><a href="#/parcours"><b class="ko">${KO[e.niveau || 0]}</b><span>${esc(e.titre.replace(/^[^·]*· /, ''))}</span><small>${e.unites.length} unités</small></a></li>`).join('')}</ol>
    </section>

    <section class="lp-sec lp-curve" aria-labelledby="lc-h">
      <div class="lp-txt"><h2 id="lc-h">Réviser au moment où l'on oublie</h2>
        <p>L'algorithme FSRS calcule pour chaque mot le jour où vous êtes sur le point de l'oublier. Chaque révision réussie éloigne la suivante : quelques minutes par jour suffisent pour retenir des milliers de mots. Vos paquets Anki s'importent en un clic.</p></div>
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

    <section class="lp-sec lp-end">
      <div class="lp-pie2">${magpie(96, { label: '' })}</div>
      <h2>La pie annonce les bonnes nouvelles.</h2>
      <p>En Corée, le chant de la pie (까치) annonce une visite ou une bonne nouvelle. La vôtre : le hangeul s'apprend dès aujourd'hui.</p>
      <div class="row lp-cta"><a class="btn main lg" href="#/unite/H01">Commencer</a><a class="btn ghost lg" href="${CONFIG.kofi}" target="_blank" rel="noopener">Soutenir sur Ko-fi</a></div>
      <p class="small muted">Gratuit, sans publicité, sans compte obligatoire. Contenu vérifié dans le 한국어기초사전 (CC BY-SA 2.0 KR).</p>
    </section>
  </div>`;
  // Révélations au défilement (une seule fois par section)
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.3 });
  $$('.lp-sec', el).forEach(s => io.observe(s));
  requestAnimationFrame(() => $('.lp-hero', el).classList.add('go'));
}
