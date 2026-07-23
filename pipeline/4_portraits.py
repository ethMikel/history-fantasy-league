#!/usr/bin/env python3
# Phase 2 - 4단계: 퍼블릭 도메인 초상 다운로드 → Pillow 저해상+팔레트감색+디더로 픽셀 톤 통일
# (ImageMagick 없어 Pillow 대체 — 08_REFERENCE_STUDY §3 디더 파이프라인)
# 입력: enriched.json (image_file = Commons 파일명) + Commons imageinfo로 라이선스
# 출력: public/portraits/<wd_id>.png (96px 픽셀 초상) + credits_portraits.json (출처·라이선스)
import json, time, io, os, urllib.parse, urllib.request
from PIL import Image

UA = 'NAN2026-HFL/0.1 (https://github.com/ethMikel/history-fantasy-league; eastboy12321@gmail.com)'
OUT = '/Users/donghyeon/workspace/projects/nan-2026/game/public/portraits'
os.makedirs(OUT, exist_ok=True)
enr = json.load(open('enriched.json'))

# 16색 게임 팔레트 (tokens.css 원시 팔레트 + 스킨톤 보강) — 초상=UI 동일 팔레트로 세계관 통일
PALETTE = [
    (0x14,0x12,0x1f),(0x26,0x23,0x36),(0x4a,0x45,0x62),(0xef,0xe9,0xd9),(0xcf,0xc6,0xae),
    (0xe8,0xb5,0x3a),(0xd9,0x48,0x4a),(0x4a,0x7f,0xd9),(0x55,0xa8,0x68),(0x9a,0x6b,0xd9),
    (0x56,0xb8,0xc9),(0x8a,0x5a,0x3c),(0xc0,0x84,0x57),(0xe0,0xb0,0x88),(0x70,0x50,0x40),(0x9a,0x9a,0xa6),
]
def palette_img():
    p = Image.new('P', (1,1))
    flat = [v for c in PALETTE for v in c] + [0,0,0]*(256-len(PALETTE))
    p.putpalette(flat)
    return p
PAL = palette_img()

def get_bytes(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()

def imageinfo(filename):
    # Commons: 썸네일 URL + 라이선스 메타
    url = ('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
           '&iiprop=url|extmetadata&iiurlwidth=300'
           '&iiextmetadatafilter=LicenseShortName|Artist|Credit'
           f'&titles={urllib.parse.quote("File:"+filename)}')
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        pages = json.load(r)['query']['pages']
    info = next(iter(pages.values())).get('imageinfo', [{}])[0]
    ext = info.get('extmetadata', {})
    def field(k):
        v = ext.get(k, {}).get('value', '')
        import re; return re.sub('<[^>]+>', '', v).strip()
    return info.get('thumburl'), field('LicenseShortName'), field('Artist')

def pixelize(raw):
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    # 정사각 크롭(상단 위주 — 얼굴) → 96px → 팔레트 감색 + FS 디더
    w,h = im.size; s = min(w,h)
    im = im.crop(((w-s)//2, 0, (w-s)//2+s, s)).resize((96,96), Image.LANCZOS)
    return im.quantize(palette=PAL, dither=Image.FLOYDSTEINBERG).convert('RGB')

credits = []
ok = fail = 0
for o in enr:
    wd, fn = o['wd_id'], o.get('image_file')
    if not fn:
        credits.append({'wd_id': wd, 'name': o['name_ko'], 'portrait': None}); continue
    try:
        thumb, lic, artist = imageinfo(fn)
        if not thumb: raise ValueError('no thumburl')
        px = pixelize(get_bytes(thumb))
        px.save(f'{OUT}/{wd}.png')
        credits.append({'wd_id': wd, 'name': o['name_ko'], 'file': fn,
                        'license': lic or 'unknown', 'artist': artist or '',
                        'source': f'https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(fn)}'})
        ok += 1
    except Exception as e:
        credits.append({'wd_id': wd, 'name': o['name_ko'], 'portrait': None, 'error': str(e)[:60]})
        fail += 1
    time.sleep(0.2)

json.dump(credits, open('credits_portraits.json','w'), ensure_ascii=False, indent=1)
print(f"초상 처리 완료: 성공 {ok} / 실패 {fail} / 초상없음 {sum(1 for c in credits if c.get('portrait') is None and 'error' not in c)}")
# 라이선스 분포
from collections import Counter
print("라이선스 분포:", dict(Counter(c.get('license','-') for c in credits if c.get('file'))))
