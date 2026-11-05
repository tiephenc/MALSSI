"""Construit un index du 한국어기초사전 (NIKL, CC BY-SA 2.0 KR) à partir de l'export public
hac541309/basic_korean_dict (Hugging Face). Usage : python3 krdict_lex.py export.parquet lex.json"""
import re, json, sys, pandas as pd
df = pd.read_parquet(sys.argv[1])
lex = {}
for t in df.text:
    parts = re.split(r', (?=[가-힣][가-힣 ]{0,18}: )', t)
    d = {}
    for p in parts:
        if ': ' in p:
            k, v = p.split(': ', 1)
            if re.fullmatch(r'[가-힣 ]{1,20}', k):
                d.setdefault(k, v); continue
        if d:
            last = list(d)[-1]; d[last] += ', ' + p
    hw = re.sub(r'\d+$', '', d.get('표제어', ''))
    if not hw or not d.get('뜻풀이'):
        continue
    ex = re.findall(r'<(?:문장|구|대화)> ([^<]+?)(?=\n<|, [가-힣]+ 대역어|$)', d.get('용례', ''), re.S)
    lex.setdefault(hw, []).append({
        'pos': d.get('품사'), 'grade': d.get('어휘 등급'), 'origin': d.get('원어'),
        'pron': d.get('발음'), 'kind': d.get('구분'), 'ko_def': d.get('뜻풀이'),
        'fr': d.get('프랑스어 대역어'), 'fr_def': d.get('프랑스어 대역어 뜻풀이'),
        'ex': [e.strip() for e in ex][:6]})
json.dump(lex, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(lex), 'entrées')
