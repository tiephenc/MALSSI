// MALSSI · petits utilitaires d'interface
import { speak } from './tts.js';
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function toast(msg, ms = 2600) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => { t.hidden = true; }, ms);
}
export const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const pick = (a, n, not = []) => shuffle(a.filter(x => !not.includes(x))).slice(0, n);
export const gradeTag = g => g === '초급' ? '<span class="tag g1" title="Niveau débutant dans le 한국어기초사전">초급</span>' : g === '중급' ? '<span class="tag g2" title="Niveau intermédiaire dans le 한국어기초사전">중급</span>' : g === '고급' ? '<span class="tag g3" title="Niveau avancé dans le 한국어기초사전">고급</span>' : '';
// Délégation globale : boutons d'écoute
document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) speak(b.dataset.say); });

// Nettoyage à la sortie d'une vue (animations, minuteurs)
const leaves = [];
export const onLeave = fn => leaves.push(fn);
export const leave = () => { while (leaves.length) { try { leaves.pop()(); } catch (e) {} } };
