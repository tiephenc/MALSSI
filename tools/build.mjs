// MALSSI · construction : un seul fichier JS et un seul fichier CSS, au nom neutre et versionné.
// Les modules séparés (src/…) étaient bloqués par certains bloqueurs de publicité selon leur nom ;
// un fichier unique « build/m-<empreinte>.js » ne correspond à aucune règle de filtrage courante.
import { build } from 'esbuild';
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'build');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
const js = await build({ entryPoints: [path.join(root, 'src/app.js')], bundle: true, format: 'esm', minify: true, target: ['es2020'], write: false, legalComments: 'none' });
const jsCode = js.outputFiles[0].contents;
const css = await build({ entryPoints: [path.join(root, 'css/index.css')], bundle: true, minify: true, write: false, loader: { '.css': 'css' } });
const cssCode = css.outputFiles[0].contents;
const h = crypto.createHash('sha1').update(jsCode).update(cssCode).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(out, `m-${h}.js`), jsCode);
fs.writeFileSync(path.join(out, `m-${h}.css`), cssCode);
// index.html
const idxP = path.join(root, 'index.html');
let idx = fs.readFileSync(idxP, 'utf8');
idx = idx.replace(/<link rel="stylesheet" href="(css\/malssi\.css|build\/m-[0-9a-f]+\.css)">/, `<link rel="stylesheet" href="build/m-${h}.css">`)
         .replace(/<script type="module" src="(js\/app\.js|src\/app\.js|build\/m-[0-9a-f]+\.js)"><\/script>/, `<script type="module" src="build/m-${h}.js"></script>`);
fs.writeFileSync(idxP, idx);
// service worker
const data = fs.readdirSync(path.join(root, 'data')).filter(f => f.endsWith('.json') && f !== 'dico.json').map(f => './data/' + f);
const shell = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', `./build/m-${h}.js`, `./build/m-${h}.css`, ...data];
const swP = path.join(root, 'sw.js');
let sw = fs.readFileSync(swP, 'utf8');
sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = 'malssi-${h}';`).replace(/const SHELL = \[[\s\S]*?\];/, `const SHELL = ${JSON.stringify(shell)};`);
fs.writeFileSync(swP, sw);
console.log(`build/m-${h}.js (${(jsCode.length / 1024).toFixed(0)} Ko) · build/m-${h}.css (${(cssCode.length / 1024).toFixed(0)} Ko)`);
