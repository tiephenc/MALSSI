# MALSSI · 말씨

Site gratuit pour apprendre le coréen en français, du hangeul au TOPIK II (6급). Il reprend le moteur de KOTONOHA :

- un parcours d'unités (étape 0 « hangeul » disponible ; 1급 à 6급 en préparation) ;
- la révision espacée FSRS-4.5, avec une séance du jour ;
- un vocabulaire vérifié dans le 한국어기초사전 ;
- l'import de paquets Anki (.apkg), lus sur l'appareil ;
- un minuteur Focus ;
- des comptes facultatifs (Firebase) ;
- un fonctionnement hors connexion (PWA).

Auteur : Titi (Tiéphen Chauvin). Soutenir le projet : https://ko-fi.com/tiephenchauvin

## Contenu du dépôt

- `index.html`, `css/`, `js/` : le site (modules ES, aucune dépendance npm).
- `data/etape0.json` : les unités rédigées pour MALSSI.
- `data/lexique.json` : prononciation, niveau et sens de référence de chaque mot, extraits du 한국어기초사전 par `tools/verifier.py`.
- `vendor/` : sql.js et fzstd (lecture des paquets Anki).
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et hors connexion.
- `firebase/firestore.rules` : règles de sécurité des comptes.
- `tools/` : serveur local, vérification du vocabulaire, contrôle avant publication.

## Vérification du contenu

Aucun mot n'entre dans le site sans source. `tools/verifier.py` vérifie que chaque mot existe dans le 한국어기초사전 et que la glose française rédigée pour MALSSI correspond à l'un de ses sens. Il recopie ensuite la prononciation, le niveau et le hanja dans `data/lexique.json`. La vérification échoue au moindre mot non confirmé.

```
python3 tools/krdict_lex.py export.parquet lex.json   # export public : huggingface.co/datasets/hac541309/basic_korean_dict
python3 tools/verifier.py lex.json
node tools/check.mjs
```

## Développement et publication

- `node tools/serve.mjs` : site local sur http://127.0.0.1:8766/
- Avant de publier, changer `VERSION` dans `sw.js`.
- GitHub Pages : Settings › Pages › Deploy from a branch › `main` / `(root)`.
- Comptes : créer un projet Firebase (Authentication par e-mail + Firestore), coller sa configuration web dans `js/config.js` et publier `firebase/firestore.rules`.

## Licences

- **Textes, exercices, illustrations (dont la pie) et code** : © Tiéphen Chauvin, tous droits réservés, sauf mention contraire ci-dessous.
- **`data/lexique.json`** : données extraites du 한국어기초사전, © 국립국어원 (Institut national de la langue coréenne), licence CC BY-SA 2.0 KR. Ce fichier reste sous cette licence.
- **sql.js** (`vendor/sql-wasm.*`) : licence MIT. **fzstd** (`vendor/fzstd.js`) : © Arjun Barrett, licence MIT.
- **Polices** : Gowun Batang, IBM Plex Sans KR (Google Fonts, SIL Open Font License 1.1).

MALSSI n'est affilié ni au NIIED (국립국제교육원), qui organise le TOPIK, ni à l'Institut national de la langue coréenne.
