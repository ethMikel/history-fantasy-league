#!/usr/bin/env python3
# Phase 2 - 1단계: Pantheon에서 후보 풀 선정 (10_CELL_MATRIX 매핑)
# 출력: candidates.json (셀별 후보) + 콘솔 요약(동현 검수용)
import csv, json, collections

rows = [r for r in csv.DictReader(open('person.csv')) if r['is_group'] == 'FALSE' and r['hpi']]

# ── 안전 필터 (동현 검수로 조정 가능) ──
# 1) 생존 인물 제외 (초상권·논란)
# 2) 종교 창시자/종교인 제외 (논란)
# 3) 명백한 학살·전체주의 인물 denylist (키치 게임 부적합)
DENYLIST = {
    # 학살·전체주의·전범 (키치 게임 명백 부적합)
    'Adolf Hitler', 'Joseph Stalin', 'Mao Zedong', 'Kim Il-sung', 'Kim Jong-il', 'Kim Jong-un',
    'Pol Pot', 'Benito Mussolini', 'Hideki Tojo', 'Vladimir Lenin', 'Saddam Hussein',
    'Idi Amin', 'Nicolae Ceaușescu', 'Francisco Franco', 'Augusto Pinochet',
    'Osama bin Laden', 'Muammar Gaddafi', 'Rudolf Hess', 'Che Guevara',
    # 종교 창시자·성인 (논란 회피 — occupation 분류 누락분 수동 제외)
    'Gautama Buddha', 'Augustine of Hippo', 'Rumi', 'Padmasambhava', 'Adi Shankara',
    'Nagarjuna', 'Kabir', 'Swami Vivekananda', 'Rajneesh', 'Haile Selassie',
}
# 정복 논란 인물은 제외 안 함(쿠빌라이·티무르 등 유지) — 칭기즈칸만 상징성 커서 동현 판단 대기로 보류 제외
DENYLIST |= {'Genghis Khan'}
EXCLUDE_OCC = {'RELIGIOUS FIGURE', 'COMPANION', 'CELEBRITY', 'PORNOGRAPHIC ACTOR',
               'EXTREMIST', 'CRIMINAL', 'SOCCER PLAYER', 'RACING DRIVER', 'COACH',
               'ACTOR', 'SINGER', 'MUSICIAN', 'CHEF', 'MODEL', 'BASKETBALL PLAYER'}
# 배우/가수 등 현대 연예는 "위인 내각" 톤과 안 맞아 제외 (WRITER/COMPOSER/PAINTER는 문화축으로 유지)

# 검수 플래그: 자동 통과했으나 동현 최종 판단 권장 (현대 정치인 = 당파성·초상권 잔여 리스크)
def review_flag(r):
    y = int(r['birthyear'])
    if y >= 1900 and r['occupation'] in {'POLITICIAN','DIPLOMAT','NOBLEMAN','BUSINESSPERSON'}:
        return 'MODERN_POLITICS'
    return ''

def era_of(y):
    y = int(y)
    if y < 500: return 'ANC'
    if y < 1400: return 'MED'
    if y < 1700: return 'EARLY'
    if y < 1900: return 'MOD'
    return 'CON'

# bplace_country → 문명권 버킷
EU = {'Italy','France','Germany','United Kingdom','Spain','Austria','Poland','Netherlands',
      'Belgium','Sweden','Denmark','Norway','Switzerland','Portugal','Ireland','Czechia',
      'Hungary','Russia','Ukraine','Finland','Scotland','England','Romania','Croatia','Serbia'}
MEA = {'Türkiye','Iran','Iraq','Saudi Arabia','Israel','Syria','Lebanon','Jordan','Afghanistan',
       'Azerbaijan','Palestine','Yemen','Kuwait'}
SA = {'India','Pakistan','Bangladesh','Nepal','Sri Lanka'}
CA = {'Mongolia','Kazakhstan','Uzbekistan','Turkmenistan','Kyrgyzstan','Tajikistan'}
AM = {'United States','Canada','Brazil','Argentina','Mexico','Chile','Peru','Colombia',
      'Venezuela','Cuba','Bolivia','Uruguay','Paraguay','Ecuador'}
EA = {'China','Japan','South Korea','North Korea','Taiwan','Vietnam'}
AF = {'Egypt','Nigeria','Ethiopia','South Africa','Kenya','Ghana','Morocco','Algeria','Tunisia','Libya','Mali'}
MED_COUNTRIES = {'Greece','Italy','Egypt','Türkiye','North Macedonia','Cyprus'}  # 고대 한정

def civ_of(country, era):
    # 고대 지중해권은 MED로 흡수
    if era == 'ANC' and country in MED_COUNTRIES: return 'MED'
    if country in EA: return 'EA'
    if country in EU: return 'EU'
    if country in MEA: return 'MEA'
    if country in SA: return 'SA'
    if country in CA: return 'CA'
    if country in AM: return 'AM'
    if country in AF: return 'AF'
    return None  # 매핑 불가 → 제외

# 한국 인지도 보정: 한국 출생 인물에 HPI 가산 (세종·이순신이 EA 셀 상위로)
def fame(r):
    h = float(r['hpi'])
    if r['bplace_country'] in {'South Korea','North Korea'}: h += 15
    if r['bplace_country'] in {'China','Japan'}: h += 3  # 동아시아 친숙도 소폭
    return h

pool = []
for r in rows:
    if not r['birthyear'] or not r['bplace_country']: continue
    if r['alive'] == 'TRUE': continue
    if r['name'] in DENYLIST: continue
    if r['occupation'] in EXCLUDE_OCC: continue
    try: era = era_of(r['birthyear'])
    except: continue
    civ = civ_of(r['bplace_country'], era)
    if civ is None: continue
    pool.append({
        'wd_id': r['wd_id'], 'name_en': r['name'], 'hpi': round(float(r['hpi']),1),
        'fame': round(fame(r),1), 'occupation': r['occupation'],
        'birthyear': int(r['birthyear']), 'country': r['bplace_country'],
        'civ': civ, 'era': era, 'flag': review_flag(r),
    })

# 라이브 셀(10_CELL_MATRIX)만 + 셀별 fame 상위 N
LIVE = {  # (civ,era): 목표 인원  — 밀도 반영
    ('EA','ANC'):6,('EA','MED'):8,('EA','EARLY'):8,('EA','MOD'):8,('EA','CON'):6,
    ('EU','MED'):6,('EU','EARLY'):8,('EU','MOD'):10,('EU','CON'):8,
    ('MED','ANC'):10,('MED','MED'):4,
    ('MEA','ANC'):4,('MEA','MED'):8,('MEA','EARLY'):5,('MEA','MOD'):4,
    ('SA','ANC'):5,('SA','MED'):4,('SA','EARLY'):4,('SA','MOD'):5,('SA','CON'):4,
    ('CA','ANC'):3,('CA','MED'):6,
    ('AM','MOD'):8,('AM','CON'):8,
    ('AF','ANC'):4,('AF','MOD'):3,('AF','CON'):3,
}
by_cell = collections.defaultdict(list)
for p in pool: by_cell[(p['civ'],p['era'])].append(p)

selected = []
summary = []
for cell, target in sorted(LIVE.items()):
    members = sorted(by_cell.get(cell, []), key=lambda x:-x['fame'])[:target]
    selected.extend(members)
    got = len(members)
    flag = '' if got>=max(3,target*0.6) else '  ⚠️부족'
    summary.append((cell, target, got, [m['name_en'] for m in members[:5]], flag))

json.dump(selected, open('candidates.json','w'), ensure_ascii=False, indent=1)
print(f"=== 후보 풀: {len(selected)}명 / {len(LIVE)} 라이브 셀 ===\n")
for cell,target,got,names,flag in summary:
    print(f"[{cell[0]:3}·{cell[1]:5}] 목표{target:2} 확보{got:2}{flag}  {', '.join(names)}")
flagged = [p for p in selected if p['flag']]
print(f"\n=== ⚑ 검수 권장 (현대 정치/재계 {len(flagged)}명 — 당파성·초상권) ===")
print(', '.join(f"{p['name_en']}" for p in flagged))
