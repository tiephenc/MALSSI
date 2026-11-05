"""MALSSI · listes de vocabulaire par niveau et dictionnaire intégré, à partir du 한국어기초사전
(© 국립국어원, CC BY-SA 2.0 KR). Les fichiers produits restent sous cette licence.

Usage : python3 tools/build_vocab.py krdict.json
  krdict.json : export analysé (voir tools/krdict_lex.py ; même découpage, toutes les clés gardées).
Sorties :
  data/vocab/t1.json (초급 → TOPIK I), t2.json (중급 → 3–4급), t3.json (고급 → 5–6급)
  data/dico.json : tous les sens notés 초급/중급/고급 et les entrées grammaticales, pour la recherche et les exercices.
"""
import json, re, sys, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIERS = {'초급': 1, '중급': 2, '고급': 3}
TOP = {'개념': 'Notions', '인간': 'L\'être humain', '사회 생활': 'Vie sociale', '삶': 'La vie', '경제 생활': 'Économie',
       '식생활': 'Alimentation', '주생활': 'Logement', '의생활': 'Vêtements', '교육': 'Éducation', '자연': 'Nature',
       '동식물': 'Animaux et plantes', '정치와 행정': 'Politique et administration', '문화': 'Culture', '종교': 'Religion'}
SUB = {'신체 행위': 'Gestes et mouvements', '시간': 'Le temps', '사회 활동': 'Activités sociales', '감정': 'Émotions', '모양': 'Formes',
  '태도': 'Attitudes', '언어 행위': 'Parler et dire', '위치 및 방향': 'Lieux et directions', '인지 행위': 'Penser et comprendre', '정도': 'Degré',
  '사람의 종류': 'Les gens', '신체 부위': 'Le corps', '경제 행위': 'Acheter, payer, gagner', '수': 'Les nombres', '병과 증상': 'Maladies et symptômes',
  '경제 수단': 'Argent et moyens de paiement', '여가 활동': 'Loisirs', '능력': 'Capacités', '양': 'Quantités', '기상 및 기후': 'Météo et climat',
  '친족 관계': 'La famille', '성질': 'Qualités et propriétés', '세는 말': 'Compteurs (classificateurs)', '지역': 'Régions et lieux', '성격': 'Caractère',
  '식사 및 조리 행위': 'Manger et cuisiner', '순서': 'L\'ordre', '교수 학습 행위': 'Enseigner et apprendre', '경제 상태': 'Situation économique', '색깔': 'Couleurs',
  '음식': 'Plats', '생활 용품': 'Objets du quotidien', '밝기': 'Lumière', '감각': 'Sensations', '지형': 'Relief et paysages', '지시': 'Démonstratifs',
  '주택 구성': 'La maison', '일상 행위': 'Gestes du quotidien', '삶의 상태': 'Conditions de vie', '직업': 'Métiers', '의복 착용 행위': 'S\'habiller',
  '사법 및 치안 행위': 'Justice et sécurité', '삶의 행위': 'Les étapes de la vie', '인간관계': 'Relations', '사회 생활 상태': 'Vie en société',
  '식재료': 'Ingrédients', '정치 및 행정 행위': 'Action publique', '동물류': 'Animaux', '맛': 'Saveurs', '통신 행위': 'Communiquer', '소통 수단': 'Moyens de communication',
  '용모': 'Apparence', '교통 이용 장소': 'Lieux de transport', '교통 이용 행위': 'Se déplacer', '체력 상태': 'Forme physique', '치료 행위': 'Soigner',
  '가사 행위': 'Tâches ménagères', '생리 현상': 'Fonctions du corps', '정치 및 행정 주체': 'Institutions', '교통 수단': 'Moyens de transport', '말': 'La parole',
  '직장 생활': 'Au travail', '경제 행위 장소': 'Commerces et lieux économiques', '의문': 'Questions', '전공과 교과목': 'Matières et spécialités',
  '옷 종류': 'Vêtements', '동식물 행위': 'Vie animale et végétale', '직위': 'Postes et fonctions', '모자 | 신발 | 장신구': 'Chaussures et accessoires',
  '학문 용어': 'Vocabulaire savant', '식물의 부분': 'Parties des plantes', '경제 행위 주체': 'Acteurs économiques', '학습 관련 사물': 'Matériel scolaire',
  '인칭': 'Pronoms personnels', '음료': 'Boissons', '사법 및 치안 주체': 'Police et justice', '신체에 가하는 행위': 'Agir sur le corps', '주거 상태': 'L\'habitat',
  '매체': 'Médias', '가족 행사': 'Fêtes de famille', '학문 행위': 'Recherche et études', '자원': 'Ressources', '조리 도구': 'Ustensiles',
  '전통 문화': 'Culture traditionnelle', '문화 활동 주체': 'Artistes et acteurs culturels', '교수 학습 주체': 'Enseignants et élèves', '천체': 'Le ciel et les astres',
  '속도': 'Vitesse', '신체 내부 구성': 'L\'intérieur du corps', '빈도': 'Fréquence', '접속': 'Connecteurs', '여가 시설': 'Lieux de loisirs',
  '미용 행위': 'Soins et beauté', '정치 및 치안 상태': 'Ordre public', '대중 문화': 'Culture populaire', '신체 변화': 'Changements du corps',
  '문화 활동': 'Activités culturelles', '여가 도구': 'Matériel de loisirs', '사회 행사': 'Événements', '채소': 'Légumes', '학교 시설': 'L\'école',
  '공공 기관': 'Services publics', '재해': 'Catastrophes', '건물 종류': 'Bâtiments', '지표면 사물': 'Éléments du paysage', '약품류': 'Médicaments',
  '온도': 'Température', '예술': 'Les arts', '문화 생활 장소': 'Lieux culturels', '식물류': 'Plantes', '과일': 'Fruits',
  '식생활 관련 장소': 'Où manger', '교육 기관': 'Établissements scolaires', '옷의 부분': 'Parties d\'un vêtement', '치료 시설': 'Lieux de soins',
  '주거 행위': 'Habiter', '직장': 'Le lieu de travail', '음악': 'Musique', '곡류': 'Céréales', '동물의 부분': 'Parties des animaux', '문학': 'Littérature',
  '소리': 'Sons et bruits', '의복 착용 상태': 'Tenue', '주거 형태': 'Types de logement', '종교어': 'Vocabulaire religieux', '경제 산물': 'Produits',
  '신앙 대상': 'Croyances', '곤충류': 'Insectes', '종교인': 'Religieux', '무기': 'Armes', '종교 유형': 'Religions', '미술': 'Arts plastiques',
  '주거 지역': 'Quartiers et zones', '종교 활동 도구': 'Objets religieux', '종교 행위': 'Pratiques religieuses', '옷감': 'Tissus',
  '의생활 관련 장소': 'Boutiques de vêtements', '동물 소리': 'Cris d\'animaux', '종교 활동 장소': 'Lieux de culte'}
POS = {'명사': 'nom', '동사': 'verbe', '형용사': 'adjectif', '부사': 'adverbe', '대명사': 'pronom', '수사': 'numéral', '관형사': 'déterminant',
       '감탄사': 'interjection', '의존 명사': 'nom dépendant', '보조 동사': 'auxiliaire', '보조 형용사': 'auxiliaire', '조사': 'particule',
       '어미': 'terminaison', '접사': 'affixe', '품사 없음': 'expression'}

def gloss(fr, fr_def):
    items = [x.strip() for x in re.split(r',\s*', fr or '') if x.strip()]
    items = [x for x in items if not x.startswith('(Pas d') and not re.fullmatch(r'\(.*\)', x)]
    if items:
        out, n = [], 0
        for x in items:
            if n + len(x) > 46 and out: break
            out.append(x); n += len(x) + 2
            if len(out) == 3: break
        return ', '.join(out)
    d = (fr_def or '').split('. ')[0].rstrip('.')
    return d[:80] + ('…' if len(d) > 80 else '')

def main(src):
    data = json.load(open(src, encoding='utf-8'))
    heads = collections.defaultdict(list)
    for x in data:
        hw = re.sub(r'\d+$', '', x.get('표제어', ''))
        if hw and x.get('뜻풀이'): heads[hw].append(x)
    tiers = {1: collections.defaultdict(list), 2: collections.defaultdict(list), 3: collections.defaultdict(list)}
    dico = {}
    for hw, senses in heads.items():
        graded = [(i, s) for i, s in enumerate(senses) if s.get('어휘 등급') in TIERS]
        gram = [s for s in senses if s.get('구분') == '문법‧표현' or s.get('품사') in ('어미', '조사')]
        if not graded and not gram: continue
        keep = graded if graded else [(i, s) for i, s in enumerate(senses) if s in gram]
        rows = []
        for i, s in keep:
            ex = re.findall(r'<(?:문장|대화)> ([^<\n]+)', s.get('용례', ''))
            ex = [e.strip().rstrip(',').strip() for e in ex if 6 <= len(e.strip()) <= 70][:2]
            rows.append([i + 1, POS.get(s.get('품사'), s.get('품사') or ''), TIERS.get(s.get('어휘 등급'), 0),
                         (s.get('발음') or '').replace('ː', ''), s.get('원어') or '', gloss(s.get('프랑스어 대역어'), s.get('프랑스어 대역어 뜻풀이')),
                         (s.get('프랑스어 대역어 뜻풀이') or '')[:220], ex])
        dico[hw] = rows
        seen_t = set()
        for i, s in graded:
            t = TIERS[s['어휘 등급']]
            if t in seen_t: continue  # un mot par niveau : le premier sens de ce niveau
            seen_t.add(t)
            cat = (s.get('의미 범주') or '').split(', ')[0].split('\n')[0].strip()
            top, _, sub = cat.partition(' > ')
            label = SUB.get(sub.strip()) or TOP.get(top.strip()) or {'동사': 'Verbes courants', '형용사': 'Adjectifs courants', '부사': 'Adverbes',
                    '의존 명사': 'Noms dépendants', '관형사': 'Déterminants', '감탄사': 'Interjections', '대명사': 'Pronoms'}.get(s.get('품사'), 'Noms courants')
            tiers[t][label].append([hw, gloss(s.get('프랑스어 대역어'), s.get('프랑스어 대역어 뜻풀이')), i + 1])
    os.makedirs(os.path.join(ROOT, 'data', 'vocab'), exist_ok=True)
    for t, groups in tiers.items():
        lists = []
        for label, words in sorted(groups.items(), key=lambda kv: -len(kv[1])):
            words.sort(key=lambda w: (len(w[0]), w[0]))
            for k in range(0, len(words), 40):
                chunk = words[k:k + 40]
                n = len(words) // 40 + (1 if len(words) % 40 else 0)
                lists.append({'id': f't{t}-{len(lists) + 1:03d}', 'titre': label + (f' ({k // 40 + 1}/{n})' if n > 1 else ''), 'mots': chunk})
        json.dump({'tier': t, 'listes': lists}, open(os.path.join(ROOT, 'data', 'vocab', f't{t}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(f't{t}: {sum(len(l["mots"]) for l in lists)} mots, {len(lists)} listes')
    json.dump(dico, open(os.path.join(ROOT, 'data', 'dico.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('dico:', len(dico), 'entrées')

if __name__ == '__main__':
    main(sys.argv[1])
