// MALSSI · écoute par la synthèse vocale du navigateur (voix coréenne ko-KR). Ce n'est pas un enregistrement humain.
import { S } from './store.js';
let voices = [];
function load() { try { voices = speechSynthesis.getVoices().filter(v => /^ko/i.test(v.lang)); } catch (e) { voices = []; } }
if ('speechSynthesis' in window) { load(); speechSynthesis.onvoiceschanged = load; }
export const hasVoice = () => 'speechSynthesis' in window && voices.length > 0;
export const koVoices = () => voices;
export function speak(text, rate = 0.85) {
  if (!('speechSynthesis' in window) || !text) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = rate;
    const v = voices.find(x => x.name === S.set.voice) || voices.find(x => /google/i.test(x.name)) || voices[0];
    if (v) u.voice = v;
    speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}
export const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';
export const playBtn = (text, label) => `<button class="play" type="button" data-say="${text.replace(/"/g, '&quot;')}" aria-label="Écouter ${label || text}">${PLAY}</button>`;
