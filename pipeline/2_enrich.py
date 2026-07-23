#!/usr/bin/env python3
# Phase 2 - 2단계: Wikidata + 한국어 위키로 후보 보강
# 채우는 것: 한국어 이름, 위키 sitelinks(유명세 프록시), P18 초상 파일, 사료 요약(스코어링 근거)
# 출력: enriched.json
import json, time, urllib.parse, urllib.request

UA = 'NAN2026-HFL/0.1 (https://github.com/ethMikel/history-fantasy-league; eastboy12321@gmail.com)'
cands = json.load(open('candidates.json'))

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

# ── 1) Wikidata 배치 조회 (50개씩): ko/en 라벨, sitelinks, P18 ──
def wbget(ids):
    url = ('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json'
           f'&ids={"|".join(ids)}&props=labels|sitelinks|claims&languages=ko|en')
    return get(url)['entities']

wd = {}
for i in range(0, len(cands), 50):
    batch = [c['wd_id'] for c in cands[i:i+50]]
    ent = wbget(batch)
    for qid, e in ent.items():
        labels = e.get('labels', {})
        sitelinks = e.get('sitelinks', {})
        p18 = e.get('claims', {}).get('P18', [])
        img = None
        if p18:
            try: img = p18[0]['mainsnak']['datavalue']['value']
            except: pass
        wd[qid] = {
            'label_ko': labels.get('ko', {}).get('value'),
            'label_en': labels.get('en', {}).get('value'),
            'ko_title': sitelinks.get('kowiki', {}).get('title'),
            'sitelinks': len(sitelinks),
            'image_file': img,
        }
    time.sleep(0.3)
print(f"Wikidata 조회 완료: {len(wd)}/{len(cands)}")

# ── 2) 한국어 위키 요약 (없으면 영어) — 스코어링 근거 팩트 ──
def summary(title, lang):
    t = urllib.parse.quote(title.replace(' ', '_'))
    try:
        j = get(f'https://{lang}.wikipedia.org/api/rest_v1/page/summary/{t}')
        return j.get('extract'), j.get('description')
    except Exception:
        return None, None

out = []
missing_ko = 0
for c in cands:
    w = wd.get(c['wd_id'], {})
    name_ko = w.get('label_ko') or w.get('ko_title') or c['name_en']
    if not w.get('label_ko') and not w.get('ko_title'): missing_ko += 1
    # 요약: ko 우선, 없으면 en
    ext, desc = (None, None)
    if w.get('ko_title'):
        ext, desc = summary(w['ko_title'], 'ko')
    if not ext:
        ext, desc = summary(c['name_en'], 'en')
    out.append({**c,
        'name_ko': name_ko,
        'sitelinks': w.get('sitelinks', 0),
        'image_file': w.get('image_file'),
        'summary': (ext or '')[:900],
        'desc': desc or '',
    })
    time.sleep(0.15)

json.dump(out, open('enriched.json','w'), ensure_ascii=False, indent=1)
print(f"보강 완료: {len(out)}명 | 한국어 이름 없음: {missing_ko} | 초상 있음: {sum(1 for o in out if o['image_file'])} | 요약 있음: {sum(1 for o in out if o['summary'])}")
print("\n=== 샘플 5명 ===")
for o in out[:5]:
    print(f"  {o['name_ko']} ({o['name_en']}) | sitelinks {o['sitelinks']} | 초상 {'O' if o['image_file'] else 'X'} | {o['desc']}")
