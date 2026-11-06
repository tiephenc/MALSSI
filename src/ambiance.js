// MALSSI · ambiance sonore de l'accueil, synthétisée (aucun fichier audio) :
// accords doux à travers un filtre passe-bas, souffle de ville, quelques notes de pentatonique.
// Coupée au départ ; muffle(true) referme le filtre (survol du bouton principal).
let A = null;
function start() {
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const master = ac.createGain(); master.gain.value = 0;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.6;
  lp.connect(master); master.connect(ac.destination);
  // souffle (bruit rose approché)
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.05; }
  const noise = ac.createBufferSource(); noise.buffer = buf; noise.loop = true; const ng = ac.createGain(); ng.gain.value = 0.05; noise.connect(ng); ng.connect(lp); noise.start();
  // accords : Fmaj7 → Em7 → Dm7 → Cmaj7
  const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const voices = [0, 1, 2, 3].map(() => { const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o2.type = 'sine'; o2.detune.value = 7; g.gain.value = 0.05; o.connect(g); o2.connect(g); g.connect(lp); o.start(); o2.start(); return { o, o2 }; });
  let k = 0;
  const step = () => { const t = ac.currentTime; chords[k % 4].forEach((m, i) => { voices[i].o.frequency.setTargetAtTime(hz(m), t, 0.6); voices[i].o2.frequency.setTargetAtTime(hz(m + 12), t, 0.6); }); k++; };
  step(); const ci = setInterval(step, 4200);
  const penta = [72, 74, 76, 79, 81, 84];
  const pi = setInterval(() => { if (Math.random() < 0.55) { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = hz(penta[(Math.random() * penta.length) | 0]); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2); o.connect(g); g.connect(lp); o.start(t); o.stop(t + 2.3); } }, 1300);
  A = { ac, master, lp, ci, pi, on: false };
}
export function toggleAmbiance() {
  if (!A) start();
  if (A.ac.state === 'suspended') A.ac.resume();
  A.on = !A.on;
  A.master.gain.setTargetAtTime(A.on ? 0.55 : 0, A.ac.currentTime, 0.6);
  return A.on;
}
export function muffle(on) { if (A) A.lp.frequency.setTargetAtTime(on ? 320 : 1100, A.ac.currentTime, 0.4); }
export function stopAmbiance() { if (A && A.on) { A.on = false; A.master.gain.setTargetAtTime(0, A.ac.currentTime, 0.3); } }
export const ambianceOn = () => !!(A && A.on);
