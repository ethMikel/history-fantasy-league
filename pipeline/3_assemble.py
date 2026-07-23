#!/usr/bin/env python3
# Phase 2 - 3단계: 스코어링 결과 + 보강 데이터 → tier 부여 → roster.ts 생성
# 입력: enriched.json + scores.json (스코어링 워크플로우 결과를 저장한 것)
# tier = 유명세(fame) 백분위 기반 rarity (능력=스탯과 분리, 09_SCORING_ANCHORS 원칙)
# 출력: ../src/data/roster.ts (실데이터로 교체) — 단 검수 플래그 인물은 별도 표시
import json

enr = {o['wd_id']: o for o in json.load(open('enriched.json'))}
scores = {s['wd']: s for s in json.load(open('scores.json'))}

merged = []
for wd, o in enr.items():
    sc = scores.get(wd)
    if not sc:
        print(f"⚠️ 스코어 없음: {o['name_ko']} ({wd})"); continue
    merged.append({**o, 'scores': sc['scores'], 'evidence': sc.get('top_evidence','')})

# tier: fame 백분위 (전설 상위 15% / 명신 35% / 능신 65% / 나머지 범재)
merged.sort(key=lambda x: -x['fame'])
n = len(merged)
def tier_of(i):
    r = i / n
    return 'legend' if r < 0.15 else 'great' if r < 0.35 else 'capable' if r < 0.65 else 'common'
for i, m in enumerate(merged): m['tier'] = tier_of(i)

CIV_KO = {'EA':'동아시아','EU':'유럽','MED':'지중해','MEA':'중동','SA':'남아시아','CA':'중앙아시아','AM':'아메리카','AF':'아프리카'}
ERA_KO = {'ANC':'고대','MED':'중세','EARLY':'근세','MOD':'근대','CON':'현대'}

def esc(s): return (s or '').replace('\\','\\\\').replace("'","\\'")
lines = []
for m in merged:
    s = m['scores']
    portrait = f"{m['wd_id']}" if m.get('image_file') else ''
    flag = ',flag:true' if m.get('flag') else ''
    lines.append(
        f"  {{id:'{m['wd_id']}',name:'{esc(m['name_ko'])}',en:'{esc(m['name_en'])}',"
        f"civ:'{CIV_KO[m['civ']]}',era:'{ERA_KO[m['era']]}',tier:'{m['tier']}',"
        f"portrait:'{portrait}',"
        f"stats:{{mil:{s['mil']},str:{s['str']},dom:{s['dom']},dip:{s['dip']},sci:{s['sci']},cul:{s['cul']}}},"
        f"evidence:'{esc(m['evidence'])}'{flag}}},")

ts = ("// 자동 생성 (pipeline/3_assemble.py) — 실존 인물 실데이터. 수기 편집 금지, 재생성으로.\n"
      "// 출처: MIT Pantheon(HPI)·Wikidata·한국어 위키. 스탯=앵커 루브릭 스코어링. 초상=public/portraits/<id>.png\n"
      "import type { Character } from '../lib/types'\n\n"
      f"export const ROSTER: Character[] = [\n" + "\n".join(lines) + "\n]\n")
open('/Users/donghyeon/workspace/projects/nan-2026/game/src/data/roster.gen.ts','w').write(ts)

from collections import Counter
print(f"조립 완료: {len(merged)}명")
print("tier 분포:", dict(Counter(m['tier'] for m in merged)))
print("검수 플래그(현대정치):", sum(1 for m in merged if m.get('flag')))
print("\n=== 앵커 sanity check (각 축 상위 5) ===")
for ax,ko in [('mil','무력'),('str','지략'),('dom','내정'),('dip','외교'),('sci','과학'),('cul','문화')]:
    top = sorted(merged, key=lambda x:-x['scores'][ax])[:5]
    print(f"  {ko}: " + ', '.join(f"{m['name_ko']}({m['scores'][ax]})" for m in top))
