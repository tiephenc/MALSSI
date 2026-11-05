// MALSSI · outils hangeul : décomposition et composition Unicode, romanisation officielle (révisée, 2000)
// La romanisation s'applique à la prononciation donnée par le dictionnaire (ex. [한구거] → hangugeo).
export const INI = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
export const VOW = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
export const FIN = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const BASE = 0xAC00;
export const isSyl = ch => { const c = ch.codePointAt(0); return c >= BASE && c <= 0xD7A3; };
export function split(ch) {
  if (!isSyl(ch)) return null;
  const n = ch.codePointAt(0) - BASE;
  return { i: INI[Math.floor(n / 588)], v: VOW[Math.floor((n % 588) / 28)], f: FIN[n % 28] };
}
export function join(i, v, f = '') {
  const a = INI.indexOf(i), b = VOW.indexOf(v), c = FIN.indexOf(f || '');
  if (a < 0 || b < 0 || c < 0) return '';
  return String.fromCharCode(BASE + a * 588 + b * 28 + c);
}
// voyelles placées sous la consonne (ㅗ ㅛ ㅜ ㅠ ㅡ) ou combinées
export const HORIZ = new Set(['ㅗ','ㅛ','ㅜ','ㅠ','ㅡ']);
export const MIXED = new Set(['ㅘ','ㅙ','ㅚ','ㅝ','ㅞ','ㅟ','ㅢ']);

const RI = { 'ㄱ':'g','ㄲ':'kk','ㄴ':'n','ㄷ':'d','ㄸ':'tt','ㄹ':'r','ㅁ':'m','ㅂ':'b','ㅃ':'pp','ㅅ':'s','ㅆ':'ss','ㅇ':'','ㅈ':'j','ㅉ':'jj','ㅊ':'ch','ㅋ':'k','ㅌ':'t','ㅍ':'p','ㅎ':'h' };
const RV = { 'ㅏ':'a','ㅐ':'ae','ㅑ':'ya','ㅒ':'yae','ㅓ':'eo','ㅔ':'e','ㅕ':'yeo','ㅖ':'ye','ㅗ':'o','ㅘ':'wa','ㅙ':'wae','ㅚ':'oe','ㅛ':'yo','ㅜ':'u','ㅝ':'wo','ㅞ':'we','ㅟ':'wi','ㅠ':'yu','ㅡ':'eu','ㅢ':'ui','ㅣ':'i' };
const RF = { '':'', 'ㄱ':'k','ㄲ':'k','ㅋ':'k','ㄴ':'n','ㄷ':'t','ㅅ':'t','ㅆ':'t','ㅈ':'t','ㅊ':'t','ㅌ':'t','ㅎ':'t','ㄹ':'l','ㅁ':'m','ㅂ':'p','ㅍ':'p','ㅇ':'ng' };
// Romanise une forme déjà prononcée (les assimilations sont dans la prononciation).
export function romanize(pron) {
  if (!pron) return '';
  const word = pron.split('/')[0].replace(/[ː\s]/g, '');
  const sy = [...word].map(split);
  if (sy.some(s => !s)) return '';
  let out = '';
  sy.forEach((s, k) => {
    let ini = RI[s.i];
    // ㄹ initial après ㄹ final : « ll »
    if (s.i === 'ㄹ' && k > 0 && sy[k - 1].f === 'ㄹ') ini = 'l';
    out += ini + RV[s.v] + (RF[s.f] ?? '');
  });
  return out;
}
