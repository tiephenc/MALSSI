// MALSSI · comptes Firebase (Auth REST + Firestore REST), repris de KOTONOHA.
// La progression est compressée (gzip + base64) dans un seul document progress/{uid}.
import { CONFIG } from './config.js';
import { S, replace, onSave } from './store.js';
const FBC = CONFIG.firebase && CONFIG.firebase.apiKey && CONFIG.firebase.projectId ? CONFIG.firebase : null;
const KEY = 'malssi.compte';
export const enabled = !!FBC;
export let session = null;
export let status = 'sur cet appareil';
const subs = new Set();
export const onStatus = fn => subs.add(fn);
const setStatus = t => { status = t; subs.forEach(f => f(t)); };
try { session = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { session = null; }
const store = () => { try { session ? localStorage.setItem(KEY, JSON.stringify(session)) : localStorage.removeItem(KEY); } catch (e) {} };

async function jfetch(url, opt = {}) {
  const r = await fetch(url, { method: opt.method || 'GET', headers: opt.headers || {}, body: opt.raw !== undefined ? opt.raw : opt.body ? JSON.stringify(opt.body) : undefined, keepalive: !!opt.keepalive });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} return { r, j };
}
const err = (r, j) => { const m = (j && j.error && (j.error.message || j.error.status)) || ('HTTP ' + r.status); return Object.assign(new Error(m), { status: r.status, code: String(m).split(' ')[0] }); };
async function gz(str) { const u = new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); let b = ''; for (let i = 0; i < u.length; i += 0x8000) b += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(b); }
async function gunz(b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); }

const idt = p => `https://identitytoolkit.googleapis.com/v1/accounts:${p}?key=${encodeURIComponent(FBC.apiKey)}`;
const docUrl = () => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FBC.projectId)}/databases/(default)/documents/progress/${encodeURIComponent(session.uid)}`;
function sess(j) { if (!j || !(j.idToken || j.id_token)) return false; session = { token: j.idToken || j.id_token, refresh: j.refreshToken || j.refresh_token, exp: Date.now() + (+(j.expiresIn || j.expires_in) || 3600) * 1000, uid: j.localId || j.user_id, email: j.email || (session && session.email) || '' }; store(); return true; }
async function auth(p, body) { const { r, j } = await jfetch(idt(p), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); if (!r.ok) throw err(r, j); return j; }
async function refresh() {
  try { const { r, j } = await jfetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(FBC.apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, raw: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(session.refresh) });
    if (!r.ok) { if (r.status === 400 || r.status === 401) drop(); return false; } return sess(j); } catch (e) { return false; }
}
async function fs(method, body, keep, retry = true) {
  if (session.exp < Date.now() + 60000) await refresh(); if (!session) throw new Error('déconnecté');
  const { r, j } = await jfetch(docUrl(), { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token }, body, keepalive: keep });
  if ((r.status === 401 || r.status === 403) && retry && await refresh()) return fs(method, body, keep, false);
  if (r.status === 404 && method === 'GET') return null; if (!r.ok && !(r.status === 404 && method === 'DELETE')) throw err(r, j); return j;
}
function drop() { session = null; store(); setStatus('sur cet appareil'); }

export function message(e) {
  const c = String(e && e.code || '').toUpperCase();
  if (['INVALID_LOGIN_CREDENTIALS', 'INVALID_PASSWORD', 'EMAIL_NOT_FOUND'].includes(c)) return 'Adresse ou mot de passe incorrect.';
  if (c === 'EMAIL_EXISTS') return 'Un compte existe déjà avec cette adresse : connectez-vous.';
  if (c === 'WEAK_PASSWORD') return 'Mot de passe trop faible : 8 caractères au moins.';
  if (c === 'INVALID_EMAIL') return 'Adresse e-mail invalide.';
  if (c === 'TOO_MANY_ATTEMPTS_TRY_LATER' || (e && e.status === 429)) return 'Trop de tentatives : réessayez dans quelques minutes.';
  if (c === 'TOO_BIG') return 'Progression trop volumineuse pour la sauvegarde en ligne : exportez-la depuis Profil.';
  if (/fetch|network/i.test(e && e.message || '')) return 'Connexion impossible : vérifiez votre accès à Internet.';
  return 'Opération impossible pour le moment (' + (e && e.message || 'erreur') + ').';
}
export async function signUp(email, password) { if (password.length < 8) throw Object.assign(new Error('x'), { code: 'WEAK_PASSWORD' }); sess(await auth('signUp', { email, password, returnSecureToken: true })); await push(); setStatus('synchronisé'); }
export async function signIn(email, password) { sess(await auth('signInWithPassword', { email, password, returnSecureToken: true })); await start(); }
export async function recover(email) { await auth('sendOobCode', { requestType: 'PASSWORD_RESET', email }); }
export function signOut() { drop(); }
export async function removeAccount() { await fs('DELETE'); await auth('delete', { idToken: session.token }); drop(); }

export async function pull() { const j = await fs('GET'); if (!j || !j.fields || !j.fields.data) return null; return JSON.parse(await gunz(j.fields.data.stringValue)); }
export async function push(keep) {
  const b64 = await gz(JSON.stringify(S));
  if (b64.length > 1000000) throw Object.assign(new Error('x'), { code: 'TOO_BIG' });
  await fs('PATCH', { fields: { data: { stringValue: b64 }, updated: { integerValue: String(S.updated || Date.now()) }, size: { integerValue: String(b64.length) } } }, keep && b64.length < 60000);
}
// Au démarrage : la version la plus récente gagne.
export async function start(onReplaced) {
  if (!enabled || !session) return;
  try {
    setStatus('connexion…');
    const remote = await pull();
    if (remote && (remote.updated || 0) > (S.updated || 0)) { replace(remote); onReplaced && onReplaced(); }
    else await push();
    setStatus('synchronisé');
  } catch (e) { setStatus('hors ligne'); }
}
let t = null;
if (enabled) onSave(() => { if (!session) return; clearTimeout(t); setStatus('modifications locales'); t = setTimeout(() => push().then(() => setStatus('synchronisé')).catch(() => setStatus('hors ligne')), 15000); });
if (enabled) addEventListener('pagehide', () => { if (session && status === 'modifications locales') push(true).catch(() => {}); });
