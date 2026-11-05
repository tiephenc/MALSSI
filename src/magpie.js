// MALSSI · la pie (까치), mascotte dessinée pour le site : tête et dos noirs, ventre blanc, reflets bleus sur l'aile, longue queue.
export function magpie(size = 72, opts = {}) {
  const cls = 'magpie' + (opts.hop ? ' hop' : '');
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${opts.label || 'La pie de MALSSI'}">
  <g class="tail"><path d="M58 64 L96 90 L90 94 L54 70Z" fill="#1d2433"/><path d="M60 66 L93 89" stroke="#3d6ea8" stroke-width="2" opacity=".7"/></g>
  <path d="M30 38 C30 24 42 18 52 22 C60 25 63 33 62 42 L66 62 C60 74 42 76 33 66 C27 58 28 46 30 38Z" fill="#1d2433"/>
  <path d="M36 52 C40 64 54 68 63 60 L62 46 C56 54 44 56 36 52Z" fill="#f4f5f0"/>
  <path d="M44 40 C52 38 60 44 62 52 C56 50 49 49 44 46Z" fill="#2f5d8a"/>
  <path d="M46 44 C52 43 57 46 59 50" stroke="#f4f5f0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M30 31 L18 34 L30 37Z" fill="#1d2433"/>
  <circle cx="38" cy="30" r="3.4" fill="#f4f5f0"/><circle cx="38.6" cy="30.2" r="1.8" fill="#1d2433"/>
  <path d="M44 72 L42 82 M50 73 L50 83" stroke="#1d2433" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M38 82 L46 82 M46 83 L54 83" stroke="#1d2433" stroke-width="2" stroke-linecap="round"/>
</svg>`;
}
