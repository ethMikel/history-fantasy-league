// 더미 로스터 30명 — Phase 1 walking skeleton 전용.
// 스탯은 아키타입 템플릿 × 티어 예산(balance.ts)에서 결정론 생성 (07_DATA_PIPELINE의 실데이터로 교체 예정).
// 이름은 실존 인물이지만 스탯은 자리표시 — 실스코어링은 Phase 2 (앵커 루브릭 + 근거 인용).

import { BALANCE as B } from '../lib/balance'
import { mulberry32, hashSeed } from '../lib/rng'
import { AXES, type Axis, type Character, type Tier } from '../lib/types'

type Archetype = 'conqueror' | 'strategist' | 'statesman' | 'diplomat' | 'scientist' | 'artist' | 'polymath'

// 아키타입별 6축 배분 비중 (합 1.0) — mil, str, dom, dip, sci, cul 순
const TEMPLATE: Record<Archetype, [number, number, number, number, number, number]> = {
  conqueror: [0.30, 0.22, 0.13, 0.12, 0.06, 0.17],
  strategist: [0.20, 0.30, 0.16, 0.15, 0.08, 0.11],
  statesman: [0.08, 0.20, 0.30, 0.20, 0.08, 0.14],
  diplomat: [0.06, 0.20, 0.16, 0.32, 0.08, 0.18],
  scientist: [0.04, 0.16, 0.14, 0.10, 0.38, 0.18],
  artist: [0.04, 0.12, 0.10, 0.16, 0.14, 0.44],
  polymath: [0.10, 0.18, 0.16, 0.14, 0.22, 0.20],
}

function makeStats(name: string, tier: Tier, arch: Archetype): Record<Axis, number> {
  const budget = B.TIER_BUDGET[
    tier === 'legend' ? 'legend' : tier === 'great' ? 'great' : tier === 'capable' ? 'capable' : 'common'
  ]
  const jitter = mulberry32(hashSeed(name))
  const w = TEMPLATE[arch]
  const stats = {} as Record<Axis, number>
  AXES.forEach((a, i) => {
    const noise = 0.9 + jitter() * 0.2 // ±10% 결정론 지터
    stats[a] = Math.min(99, Math.max(5, Math.round(budget * w[i] * noise)))
  })
  return stats
}

const def = (name: string, civ: string, era: string, tier: Tier, arch: Archetype): Character => ({
  id: name, name, civ, era, tier, stats: makeStats(name, tier, arch),
})

// 6문명 × 시대 셀 분포, 티어: 전설 8 / 명신 8 / 능신 8 / 범재 6
export const ROSTER: Character[] = [
  // 전설 (8)
  def('세종대왕', '동아시아', '15세기', 'legend', 'statesman'),
  def('이순신', '동아시아', '16세기', 'legend', 'strategist'),
  def('알렉산드로스', '지중해', '고대', 'legend', 'conqueror'),
  def('레오나르도 다빈치', '유럽', '르네상스', 'legend', 'polymath'),
  def('아이작 뉴턴', '유럽', '17세기', 'legend', 'scientist'),
  def('칭기즈 칸', '중앙아시아', '13세기', 'legend', 'conqueror'),
  def('클레오파트라', '지중해', '고대', 'legend', 'diplomat'),
  def('나폴레옹', '유럽', '19세기', 'legend', 'conqueror'),
  // 명신 (8)
  def('제갈량', '동아시아', '고대', 'great', 'strategist'),
  def('비스마르크', '유럽', '19세기', 'great', 'diplomat'),
  def('한니발', '지중해', '고대', 'great', 'strategist'),
  def('마리 퀴리', '유럽', '근대', 'great', 'scientist'),
  def('람세스 2세', '지중해', '고대', 'great', 'statesman'),
  def('살라딘', '중동', '12세기', 'great', 'conqueror'),
  def('베토벤', '유럽', '19세기', 'great', 'artist'),
  def('장영실', '동아시아', '15세기', 'great', 'scientist'),
  // 능신 (8)
  def('우탄트', '동남아시아', '현대', 'capable', 'diplomat'),
  def('산마르틴', '남미', '19세기', 'capable', 'strategist'),
  def('포청천', '동아시아', '11세기', 'capable', 'statesman'),
  def('잔 다르크', '유럽', '중세', 'capable', 'conqueror'),
  def('아쇼카', '남아시아', '고대', 'capable', 'statesman'),
  def('막사이사이', '동남아시아', '현대', 'capable', 'statesman'),
  def('히포크라테스', '지중해', '고대', 'capable', 'scientist'),
  def('두보', '동아시아', '8세기', 'capable', 'artist'),
  // 범재 (6)
  def('무명 문관 갑', '동아시아', '중세', 'common', 'statesman'),
  def('무명 무관 을', '유럽', '중세', 'common', 'conqueror'),
  def('무명 책사 병', '중동', '중세', 'common', 'strategist'),
  def('무명 상인 정', '지중해', '중세', 'common', 'diplomat'),
  def('무명 학자 무', '남아시아', '중세', 'common', 'scientist'),
  def('무명 악사 기', '남미', '중세', 'common', 'artist'),
]
