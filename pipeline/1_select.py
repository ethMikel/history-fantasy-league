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
# v2 확장 시 CON(현대) 대폭 늘리며 딸려온 위험 인물 차단 (심사=NHN, 톤·안전):
#  나치 전범 / 일왕(일제 민감) / 북한 인물 / 명백한 현대 독재자
DENYLIST |= {
    'Heinrich Himmler', 'Hermann Göring', 'Hermann Goring', 'Reinhard Heydrich',
    'Adolf Eichmann', 'Joseph Goebbels', 'Rudolf Höss',
    'Hirohito',  # 쇼와 일왕 — 한국 심사 민감
    'Kim Jong-suk', 'Pak Hon-yong', 'Jang Song-thaek',  # 북한
    'Hosni Mubarak', 'Hafez al-Assad', 'Mohammad Reza Pahlavi',
    'Muhammad Zia-ul-Haq', 'Fidel Castro',  # 현대 독재/권위주의
    'Bernie Madoff',  # 폰지 사기꾼
    'Sung Jae-gi', 'Ivana Trump',  # 논란·저가치 (기업가 부스트 부작용)
}
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
    if r['occupation'] == 'BUSINESSPERSON': h += 6  # 기업가 일부 편입(정주영·록펠러·카네기 등) — 동현 요청
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
LIVE = {  # (civ,era): 목표 인원 — v2: 친숙 위주 확장(~300) + 20~21C(CON) 대폭. 비서구는 다양성 유지(상위만)
    # 동아시아 (한·중·일 — 친숙 깊음)
    ('EA','ANC'):10,('EA','MED'):12,('EA','EARLY'):12,('EA','MOD'):12,('EA','CON'):16,
    # 유럽 (친숙 최심 + 현대 강화)
    ('EU','MED'):10,('EU','EARLY'):16,('EU','MOD'):20,('EU','CON'):20,
    # 지중해 고대 (그리스·로마 — 매우 친숙)
    ('MED','ANC'):18,('MED','MED'):4,
    # 아메리카 (미국 근현대 — 친숙, 현대 강화)
    ('AM','MOD'):14,('AM','CON'):20,
    # 중동 (다양성 유지 — 상위, 현대 소폭)
    ('MEA','ANC'):6,('MEA','MED'):10,('MEA','EARLY'):7,('MEA','MOD'):5,('MEA','CON'):5,
    # 남아시아 (다양성 유지 — 상위, 현대 소폭)
    ('SA','ANC'):5,('SA','MED'):4,('SA','EARLY'):5,('SA','MOD'):8,('SA','CON'):8,
    # 중앙아시아 (다양성 — 상위 소수)
    ('CA','ANC'):3,('CA','MED'):6,
    # 아프리카 (다양성 — 상위 소수, 현대 소폭)
    ('AF','ANC'):5,('AF','MOD'):4,('AF','CON'):6,
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
