// MALSSI · Profil (réglages, compte, données) et À propos (sources, licences, soutien)
import { S, save, replace, blank, exportJSON } from '../store.js';
import { CONFIG } from '../config.js';
import * as sync from '../sync.js';
import { esc, $, toast } from '../ui.js';
import { koVoices, hasVoice, speak } from '../tts.js';
import { stats } from '../content.js';
import { magpie } from '../magpie.js';

export function applyTheme() { const t = S.set.theme; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t; }

function accountHtml() {
  if (!sync.enabled) return '';
  if (sync.session) return `<section class="panel"><h2>Compte</h2><p>Connecté : <b>${esc(sync.session.email)}</b> · <span id="sst">${esc(sync.status)}</span></p>
    <p class="small muted">Votre progression est sauvegardée sur Google Firebase et retrouvée sur vos autres appareils.</p>
    <div class="row"><button class="btn" id="sout">Se déconnecter</button><button class="btn ghost" id="sdel">Supprimer le compte</button></div></section>`;
  return `<section class="panel"><h2>Compte</h2><p class="small muted">Facultatif : un compte retrouve votre progression sur tous vos appareils. Sans compte, tout reste sur cet appareil.</p>
    <form id="sform" class="stack"><div class="row"><label class="field">Adresse e-mail<input type="email" id="sem" autocomplete="email" required></label>
      <label class="field">Mot de passe<input type="password" id="spw" autocomplete="current-password" minlength="8" required></label></div>
      <div class="row"><button class="btn main" type="submit">Se connecter</button><button class="btn" type="button" id="sup">Créer un compte</button><button class="btn ghost" type="button" id="srec">Mot de passe oublié</button></div>
      <p id="smsg" class="small" aria-live="polite"></p></form></section>`;
}
export function viewProfil(el, rerender) {
  const st = stats();
  const voices = koVoices();
  el.innerHTML = `<h1>Profil</h1><div class="stack">
    <section class="panel"><h2>Ma progression</h2>
      <p>${Object.values(S.units).filter(u => u.done).length} unité(s) terminée(s) · ${st.total} cartes, dont ${st.mature} solides · ${Object.values(S.days).reduce((a, d) => a + d.n, 0)} réponses au total.</p></section>
    ${accountHtml()}
    <section class="panel"><h2>Réglages</h2><div class="stack">
      <label class="field">Nouveaux mots par jour<input type="number" id="pnd" min="0" max="100" value="${S.set.nd}"></label>
      <label class="field">Sens des cartes<select id="pdir"><option value="kf" ${S.set.dir === 'kf' ? 'selected' : ''}>Coréen → français</option><option value="fk" ${S.set.dir === 'fk' ? 'selected' : ''}>Français → coréen</option></select></label>
      <label class="row"><input type="checkbox" id="prr" ${S.set.rr ? 'checked' : ''}> Afficher la romanisation (utile au début ; à désactiver dès que possible)</label>
      <label class="field">Thème<select id="pth"><option value="auto">Comme l'appareil</option><option value="light" ${S.set.theme === 'light' ? 'selected' : ''}>Jour</option><option value="dark" ${S.set.theme === 'dark' ? 'selected' : ''}>Nuit</option></select></label>
      <label class="field">Voix coréenne${hasVoice() ? `<select id="pvo">${voices.map(v => `<option ${v.name === S.set.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>` : '<span class="small">Aucune voix coréenne n\'est installée dans ce navigateur.</span>'}</label>
      ${hasVoice() ? '<div><button class="btn sm" id="ptest">Tester : 안녕하세요</button></div>' : ''}
    </div></section>
    <section class="panel"><h2>Mes données</h2>
      <p class="small muted">Votre progression est enregistrée dans ce navigateur. Exportez-la régulièrement pour la garder en lieu sûr.</p>
      <div class="row"><button class="btn" id="pexp">Exporter (JSON)</button><label class="btn">Importer une sauvegarde<input type="file" id="pimp" accept=".json" hidden></label><button class="btn ghost" id="preset">Tout effacer</button></div></section>
  </div>`;
  $('#pnd').onchange = e => { S.set.nd = Math.max(0, Math.min(100, +e.target.value || 0)); save(); toast('Réglage enregistré.'); };
  $('#pdir').onchange = e => { S.set.dir = e.target.value; save(); toast('Réglage enregistré.'); };
  $('#prr').onchange = e => { S.set.rr = e.target.checked ? 1 : 0; save(); };
  $('#pth').onchange = e => { S.set.theme = e.target.value; save(); applyTheme(); };
  if ($('#pvo')) $('#pvo').onchange = e => { S.set.voice = e.target.value; save(); };
  if ($('#ptest')) $('#ptest').onclick = () => speak('안녕하세요');
  $('#pexp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' })); a.download = 'malssi-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); };
  $('#pimp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); if (!d || d.v !== 1 || !d.cards) throw 0; if (!confirm('Remplacer la progression de cet appareil par cette sauvegarde ?')) return; replace(d); save({ now: true }); applyTheme(); toast('Sauvegarde importée.'); rerender(); } catch (err) { toast('Ce fichier n\'est pas une sauvegarde MALSSI.'); } };
  $('#preset').onclick = () => { if (!confirm('Effacer toute votre progression sur cet appareil ? Pensez à exporter d\'abord.')) return; replace(blank()); save({ now: true }); applyTheme(); toast('Progression effacée.'); rerender(); };
  // compte
  const msg = t => { const m = $('#smsg'); if (m) m.textContent = t; };
  const form = $('#sform');
  if (form) {
    const creds = () => [$('#sem').value.trim(), $('#spw').value];
    form.onsubmit = async e => { e.preventDefault(); msg('Connexion…'); try { await sync.signIn(...creds()); rerender(); toast('Connecté.'); } catch (err) { msg(sync.message(err)); } };
    $('#sup').onclick = async () => { if (!form.reportValidity()) return; msg('Création du compte…'); try { await sync.signUp(...creds()); rerender(); toast('Compte créé.'); } catch (err) { msg(sync.message(err)); } };
    $('#srec').onclick = async () => { const em = $('#sem').value.trim(); if (!em) { msg('Indiquez votre adresse e-mail.'); return; } try { await sync.recover(em); msg('Un lien de réinitialisation a été envoyé.'); } catch (err) { msg(sync.message(err)); } };
  }
  if ($('#sout')) $('#sout').onclick = () => { sync.signOut(); rerender(); toast('Déconnecté. La progression reste sur cet appareil.'); };
  if ($('#sdel')) $('#sdel').onclick = async () => { if (!confirm('Supprimer définitivement le compte et la sauvegarde en ligne ? La progression reste sur cet appareil.')) return; try { await sync.removeAccount(); rerender(); toast('Compte supprimé.'); } catch (err) { toast(sync.message(err)); } };
}

export function viewAbout(el) {
  el.innerHTML = `<div class="prose stack">
    <div class="row">${magpie(64)}<h1 style="margin:0"><span class="ko">말씨</span> MALSSI</h1></div>
    <p>MALSSI (말씨, « manière de parler ») est un site gratuit pour apprendre le coréen en français, du hangeul au TOPIK II (6급). Il fonctionne hors connexion et s'installe comme une application.</p>
    <p>Les sujets d'écriture et les épreuves blanches sont rédigés ou générés pour MALSSI ; ils reprennent les formats du TOPIK, pas ses sujets. Les annales officielles sont publiées gratuitement par le NIIED sur topik.go.kr.</p>
    <p class="note small">MALSSI est un projet personnel, sans lien avec le NIIED (국립국제교육원), qui organise le TOPIK, ni avec l'Institut national de la langue coréenne (국립국어원).</p>
    <h2>Soutenir le projet</h2>
    <p>Le site est gratuit et sans publicité. Si vous voulez aider à couvrir le temps passé, vous pouvez offrir un café sur Ko-fi. Le paiement se fait entièrement chez Ko-fi : MALSSI ne voit aucune donnée bancaire.</p>
    <p><a class="btn main" href="${CONFIG.kofi}" target="_blank" rel="noopener">Soutenir MALSSI sur Ko-fi</a></p>
    <h2>Contenu et sources</h2>
    <p>Les cours, explications, gloses et exercices sont rédigés pour MALSSI ; aucun extrait de manuel n'est reproduit. Chaque mot est vérifié automatiquement dans le <a href="https://krdict.korean.go.kr/" target="_blank" rel="noopener">한국어기초사전</a> (Institut national de la langue coréenne) : un mot absent du dictionnaire ou dont le sens ne correspond pas n'entre pas dans le site. Cette vérification est automatique : le contenu n'a pas été relu par un locuteur natif.</p>
    <p>L'écoute utilise la synthèse vocale de votre navigateur : ce n'est pas un enregistrement humain.</p>
    <h2>Licences</h2>
    <ul>
      <li><b>Dictionnaire, listes par niveau, prononciations et sens de référence</b> (fichiers <code>data/lexique.json</code>, <code>data/dico.json</code>, <code>data/vocab/</code>), ainsi que les phrases d'exemple du dictionnaire utilisées dans les épreuves blanches : extraits du 한국어기초사전, © 국립국어원, licence <a href="https://creativecommons.org/licenses/by-sa/2.0/kr/" target="_blank" rel="noopener">CC BY-SA 2.0 KR</a>. Ces fichiers restent sous cette licence.</li>
      <li><b>Romanisation</b> : système officiel de romanisation révisée du coréen (2000).</li>
      <li><b>Textes, exercices, illustrations (dont la pie) et code</b> : © ${esc(CONFIG.author)}, tous droits réservés, sauf mention contraire.</li>
      <li><b>Lecture des paquets Anki</b> : sql.js (licence MIT) ; décompression zstd : fzstd, © Arjun Barrett (licence MIT).</li>
      <li><b>Polices</b> : Gowun Batang et IBM Plex Sans KR, via Google Fonts (SIL Open Font License 1.1).</li>
    </ul>
    <h2>Mentions légales</h2>
    <p>Éditeur : ${esc(CONFIG.author)}, <a href="mailto:${esc(CONFIG.contact)}">${esc(CONFIG.contact)}</a>. Hébergement : GitHub Pages, GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.</p>
    <p>Données : sans compte, rien ne quitte votre appareil. Avec un compte, votre adresse e-mail et votre progression sont stockées par Google Firebase ; vous pouvez supprimer le compte à tout moment depuis Profil. Aucun cookie publicitaire, aucune mesure d'audience.</p>
    <p class="small muted">Version ${esc(CONFIG.version)} · <a href="${CONFIG.repo}" target="_blank" rel="noopener">code source</a></p>
  </div>`;
}
