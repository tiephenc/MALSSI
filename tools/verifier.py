"""MALSSI · vérification du vocabulaire avec le 한국어기초사전 (NIKL, CC BY-SA 2.0 KR).

Pour chaque mot des fichiers data/etape*.json et data/niveau*.json :
  1. le mot doit exister dans le dictionnaire ;
  2. la glose française rédigée pour MALSSI doit correspondre à l'un de ses sens
     (au moins un mot significatif en commun avec l'équivalent ou la définition française du dictionnaire) ;
  3. la prononciation, le niveau, l'origine (hanja) et le sens retenu sont recopiés dans data/lexique.json.
Un mot sans correspondance fait échouer la vérification : aucune définition n'entre dans le site sans source.

Usage : python3 tools/verifier.py chemin/vers/lex.json
(lex.json se construit avec tools/krdict_lex.py à partir de l'export public du dictionnaire.)
"""
import json, re, sys, glob, os, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOP = set('''de du des la le les un une et ou en au aux pour par sur dans avec sans est être qui que
d l s qu à a ne pas plus très son sa ses ce cet cette ces se fait terme forme mot dont ayant'''.split())
GRADES = {'초급': 1, '중급': 2, '고급': 3}

def norm(s):
    s = unicodedata.normalize('NFC', (s or '').lower())
    return [t for t in re.split(r"[^a-zàâäéèêëîïôöùûüçœæ]+", s) if len(t) >= 3 and t not in STOP]

def stems(tokens):
    return {t[:5] for t in tokens}

def main(lexpath):
    lex = json.load(open(lexpath, encoding='utf-8'))
    out, errors = {}, []
    files = sorted(glob.glob(os.path.join(ROOT, 'data', 'etape*.json')) + glob.glob(os.path.join(ROOT, 'data', 'niveau*.json')))
    for f in files:
        data = json.load(open(f, encoding='utf-8'))
        for u in data['unites']:
            for pt in u.get('points', []):
                for k in pt.get('k', []):
                    if k not in lex: errors.append(f"{u['id']} grammaire « {pt['f']} » : clé {k} absente du dictionnaire")
                for ex in pt.get('ex', []):
                    if ex[0].count('[') < 1 or ex[0].count('[') != ex[0].count(']'): errors.append(f"{u['id']} exemple sans repère [ ] : {ex[0]}")
            for item in u.get('mots', []):
                ko, gloss = item[0], item[1]
                senses = lex.get(ko, [])
                if not senses:
                    errors.append(f"{u['id']} {ko} : absent du dictionnaire"); continue
                want = stems(norm(gloss)) or {t for t in re.split(r"[^a-zàâäéèêëîïôöùûüçœæ]+", gloss.lower()) if t}
                best = None
                for i, s in enumerate(senses):
                    raw = ' '.join([s.get('fr') or '', s.get('fr_def') or '']).lower()
                    have = stems(norm(raw)) | set(re.split(r"[^a-zàâäéèêëîïôöùûüçœæ]+", raw))
                    if want & have:
                        eq = (s.get('fr') or '').lower()
                        eqtok = set(re.split(r"[^a-zàâäéèêëîïôöùûüçœæ]+", eq))
                        gtok = set(norm(gloss)) or set(re.split(r"[^a-zàâäéèêëîïôöùûüçœæ]+", gloss.lower()))
                        m = 0 if gtok & eqtok else 1 if want & stems(norm(eq)) else 2
                        rank = (GRADES.get(s.get('grade'), 9), m, i)
                        if best is None or rank < best[0]:
                            best = (rank, i, s)
                if not best:
                    errors.append(f"{u['id']} {ko} « {gloss} » : aucun sens correspondant"); continue
                _, i, s = best
                pron = (s.get('pron') or '').replace('ː', '')
                out[ko] = {
                    'fr': gloss, 'pron': pron or None, 'niveau': s.get('grade'),
                    'origine': s.get('origin'), 'pos': s.get('pos'),
                    'dico_fr': s.get('fr'), 'dico_def': s.get('fr_def'), 'sens': i + 1,
                    'unite': u['id']}
    if errors:
        print('\n'.join(errors)); print(f'{len(errors)} erreur(s)'); sys.exit(1)
    dest = os.path.join(ROOT, 'data', 'lexique.json')
    json.dump(out, open(dest, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'{len(out)} mots vérifiés -> data/lexique.json')

if __name__ == '__main__':
    main(sys.argv[1])
