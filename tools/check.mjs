// Contrôle avant publication : syntaxe des modules, contenu et lexique cohérents, fichiers du service worker présents.
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'); let bad = 0;
const fail = m => { console.error('✗ ' + m); bad++; };
for (const f of execSync('git ls-files -co --exclude-standard "js/*.js" "js/**/*.js" sw.js', { cwd: root }).toString().trim().split('\n'))
  try { execSync(`node --check ${f}`, { cwd: root, stdio: 'pipe' }); } catch (e) { fail('syntaxe : ' + f); }
const lex = JSON.parse(fs.readFileSync(path.join(root, 'data/lexique.json')));
const files = ['etape0', 'niveau1', 'niveau2', 'niveau3', 'niveau4', 'niveau5', 'niveau6'];
const all = files.flatMap(f => JSON.parse(fs.readFileSync(path.join(root, 'data', f + '.json'))).unites);
const seen = new Set();
for (const u of all) {
  if (seen.has(u.id)) fail('unité en double : ' + u.id); seen.add(u.id);
  for (const k of ['titre', 'objectif', u.points ? 'points' : 'explication', 'mots']) if (!u[k]) fail(`${u.id} : champ ${k} manquant`);
  for (const [ko] of u.mots) if (!lex[ko]) fail(`${u.id} : « ${ko} » non vérifié (relancer tools/verifier.py)`);
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const m of sw.matchAll(/'\.\/([^']+)'/g)) if (m[1] && !fs.existsSync(path.join(root, m[1]))) fail('sw.js : fichier absent ' + m[1]);
console.log(bad ? `${bad} problème(s)` : `OK · ${all.length} unités, ${Object.keys(lex).length} mots vérifiés`); process.exit(bad ? 1 : 0);
