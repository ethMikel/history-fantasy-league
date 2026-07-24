// 시뮬 코어 — 순수 함수 (06_SIM_SPEC §1~§7 구현)
// DOM/React 의존 금지: 클라이언트·봇 러너·(향후) Edge Function이 이 모듈을 공유한다.

import { BALANCE as B } from './balance'
import { CRISIS_POOL } from '../data/crises'
import { minorText } from '../data/minors'
import { createStreams, mulberry32, hashSeed, randInt, type Rng } from './rng'
import {
  AXES, SLOTS,
  type Axis, type Cabinet, type Character, type Crisis, type Difficulty,
  type SimResult, type SlotDef, type TimelineEvent,
} from './types'

// ── 위기 생성 (예고 시스템) ─────────────────────────────────────────
// 드래프트 화면과 시뮬이 같은 seed로 같은 위기 N개를 얻는다 (예고 = 계약).
// v0.5: 5개 (난이도 구성 high2·mid2·low1 셔플), 축 중복 없이 5/6, 그중 HIDDEN_COUNT개는
// 히든(드래프트 비노출, 시뮬에서만 등장 — 불확실성). rng_crisis 전용 파생 스트림.
export function generateCrises(seed: number): Crisis[] {
  const rng = mulberry32(hashSeed(`crisis:${seed}`))
  const n = B.CRISIS_COUNT
  const axes = pickDistinct(rng, AXES, n)
  const diffs = pickDistinct(rng, B.CRISIS_DIFFS as readonly Difficulty[], n) // 난이도 구성 셔플(중복 보존)
  const bands = B.CRISIS_BANDS
  const hiddenIdx = new Set(pickDistinct(rng, Array.from({ length: n }, (_, i) => i), B.HIDDEN_COUNT))
  const list: Crisis[] = []
  for (let i = 0; i < n; i++) {
    const axis = axes[i]
    const difficulty = diffs[i]
    const [lo, hi] = bands[i]
    const pool = CRISIS_POOL[axis][difficulty]
    const scenario = pool[randInt(rng, pool.length)]
    list.push({
      axis, difficulty,
      year: lo + randInt(rng, hi - lo + 1),
      title: scenario.title,
      omen: scenario.omen,
      hidden: hiddenIdx.has(i),
    })
  }
  return list.sort((a, b) => a.year - b.year)
}

// ── 판정 보조 ───────────────────────────────────────────────────────
const avg6 = (c: Character) => AXES.reduce((s, a) => s + c.stats[a], 0) / 6

// 대통령 배수 M = PRES_MIN + PRES_RANGE × (통솔지수/99)
// 통솔지수 = 지략 0.3 + 내정 0.3 + 외교 0.2 + 문화 0.1 + 무력 0.1 (06_SIM_SPEC §3)
// 통솔지수 (대통령 적성 — UI 표시에도 사용)
export function leadershipIndex(c: Character): number {
  const s = c.stats
  return 0.3 * s.str + 0.3 * s.dom + 0.2 * s.dip + 0.1 * s.cul + 0.1 * s.mil
}

export function presidentMultiplier(president: Character): number {
  return B.PRES_MIN + B.PRES_RANGE * (leadershipIndex(president) / 99)
}

// 슬롯 기여도 S = 0.65×주스탯 + 0.20×부스탯 + 0.15×(6축 평균)
export function slotScore(slot: SlotDef, c: Character): number {
  if (!slot.mainAxis || !slot.subAxis) return avg6(c)
  return B.W_MAIN * c.stats[slot.mainAxis] + B.W_SUB * c.stats[slot.subAxis] + B.W_AVG * avg6(c)
}

// 시그니처 축 = 전설/명신의 최고 스탯 축 (희귀도 특성). 그 외 티어는 특성 없음(null).
// 담당 위기 축과 일치하면 판정 보너스 발동 → "딱 맞는 거물을 딱 맞는 자리에" 실력 보상.
export function signatureAxis(c: Character): Axis | null {
  if (c.tier !== 'legend' && c.tier !== 'great') return null
  let best: Axis = AXES[0]
  for (const a of AXES) if (c.stats[a] > c.stats[best]) best = a
  return best
}

// 위기 담당자 결정: 주무 장관 vs 무임소(위기 축 스탯 ×0.9) 중 높은 쪽이 대응
// ("구원 등판" — v0.1 해석, 06_SIM_SPEC §3 무임소 조항)
export function responder(cabinet: Cabinet, crisis: Crisis): { S: number; who: Character; viaFlex: boolean } {
  const slot = SLOTS.find((s) => s.mainAxis === crisis.axis)!
  const minister = cabinet[slot.id]
  const flex = cabinet.flex
  const ministerS = slotScore(slot, minister)
  const flexS = B.FLEX_PENALTY * (B.W_MAIN * flex.stats[crisis.axis] + (1 - B.W_MAIN) * avg6(flex))
  return flexS > ministerS
    ? { S: flexS, who: flex, viaFlex: true }
    : { S: ministerS, who: minister, viaFlex: false }
}

// 성공확률 P = clamp(1/(1+10^((D−S·M)/K)), 5%, 95%) — 로지스틱 (06_SIM_SPEC §5)
export function successProb(S: number, M: number, difficulty: Difficulty): number {
  const D = B.D[difficulty]
  const p = 1 / (1 + Math.pow(10, (D - S * M) / B.K))
  return Math.min(B.P_CLAMP.max, Math.max(B.P_CLAMP.min, p))
}

// ── 메인: 집권 시뮬 ────────────────────────────────────────────────
export function simulate(seed: number, cabinet: Cabinet): SimResult {
  const { crisis: minorRng, check } = createStreams(seed)
  const crises = generateCrises(seed)
  const M = presidentMultiplier(cabinet.president)

  const timeline: TimelineEvent[] = []
  let support: number = B.SUPPORT_START
  let years: number = B.Y_BASE

  // 소이벤트 (연출·소폭 변동, rng_crisis 스트림) — v0.5: 개수↑ + 내각 인물 활약/부작용 참조
  const minorCount = B.MINOR_MIN + randInt(minorRng, B.MINOR_MAX - B.MINOR_MIN + 1)
  const minors = Array.from({ length: minorCount }, () => {
    const slot = SLOTS[randInt(minorRng, SLOTS.length)]
    const person = cabinet[slot.id]
    const standing = avg6(person)
    let kind: 'active' | 'mishap' | 'neutral' = 'neutral'
    let delta = randInt(minorRng, 3) - 1 // −1..+1 (무탈)
    if (standing >= B.MINOR_ACTIVE_STAT) { kind = 'active'; delta = 1 + randInt(minorRng, 2) } // +1..+2
    else if (standing <= B.MINOR_MISHAP_STAT) { kind = 'mishap'; delta = -1 }
    return {
      year: 1 + randInt(minorRng, B.MINOR_YEAR_MAX),
      delta, kind, who: person.name,
      text: minorText(kind, randInt(minorRng, 6), person.name, slot.name),
    }
  })

  const events: Array<{ year: number; run: () => TimelineEvent }> = []

  for (const c of crises) {
    events.push({
      year: c.year,
      run: () => {
        const { S: baseS, who, viaFlex } = responder(cabinet, c)
        // 시그니처 특성: 담당자의 최고 축 == 위기 축이면 S 가산 (전설/명신 한정)
        const traitFired = signatureAxis(who) === c.axis
        const S = traitFired ? baseS + B.TRAIT_BONUS : baseS
        const p = successProb(S, M, c.difficulty)
        // '유리'(P≥0.75) 판정은 2RN — 고확률 실패 원한 완화, 전원 동일 규칙 (§5)
        const roll = p >= B.FAVORABLE_2RN_THRESHOLD ? (check() + check()) / 2 : check()
        const success = roll < p
        const margin = S * M - B.D[c.difficulty]
        const delta = success
          ? B.G_MAX[c.difficulty] * (1 - Math.exp(-Math.max(margin, 0) / B.MARGIN_SOFTCAP_S))
          : -B.L_FAIL[c.difficulty]
        years += delta
        support += success
          ? B.SUPPORT_SUCCESS.min + (B.SUPPORT_SUCCESS.max - B.SUPPORT_SUCCESS.min) * Math.min(1, Math.max(margin, 0) / 30)
          : -(B.SUPPORT_FAIL.min + (B.SUPPORT_FAIL.max - B.SUPPORT_FAIL.min) * check())
        support = Math.min(100, Math.max(0, support))
        return {
          year: c.year, kind: 'crisis', axis: c.axis, difficulty: c.difficulty, title: c.title,
          success, margin, deltaYears: delta, supportAfter: support,
          responder: who.name, viaFlex, traitFired, hidden: c.hidden,
        }
      },
    })
  }

  for (const m of minors) {
    events.push({
      year: m.year,
      run: () => {
        years += m.delta
        support = Math.min(100, Math.max(0, support + (m.delta >= 0 ? 1 : -1) * B.SUPPORT_MINOR))
        return {
          year: m.year, kind: 'minor', deltaYears: m.delta, supportAfter: support,
          flavor: m.kind === 'neutral' ? null : m.kind, text: m.text, responder: m.who,
        }
      },
    })
  }

  events.sort((a, b) => a.year - b.year)
  for (const e of events) timeline.push(e.run())

  // 올클리어 보너스 + 황금기: 위기 전부 성공 시 (§6 + v0.3 구조 추가)
  // 황금기 = (내각 8인 전체 평균/99)² × GOLDEN_AGE_MAX — 위기 축 밖의 픽에도 가치 부여, 상위 꼬리 형성
  const crisisEvents = timeline.filter((e) => e.kind === 'crisis')
  if (crisisEvents.length > 0 && crisisEvents.every((e) => e.success)) {
    const cabinetAvg = SLOTS.reduce((s, sl) => s + avg6(cabinet[sl.id]), 0) / SLOTS.length
    years += B.ALL_CLEAR_BONUS + B.GOLDEN_AGE_MAX * Math.pow(cabinetAvg / 99, 2)
  }

  const finalYears = Math.min(B.HARD_CAP_YEARS, Math.max(1, Math.round(years)))
  const total = crisisEvents.length
  const cleared = crisisEvents.filter((e) => e.success).length
  const allClear = cleared === total && total > 0
  return { years: finalYears, timeline, crises, finalSupport: support, cleared, allClear, grade: gradeOf(cleared, total, finalYears, allClear) }
}

// 등급: 완전집권(전부 극복) 전제로 집권연수가 가를수록 높게. 미우승은 극복 수로 상한.
// 컷은 balance.ts GRADE_YEARS 단일 출처 (near-miss 문구와 drift 방지). v0.5: 위기 5개 일반화.
export function gradeOf(cleared: number, total: number, years: number, allClear: boolean): SimResult['grade'] {
  const g = B.GRADE_YEARS
  if (allClear) return years >= g.allClearS ? 'S' : years >= g.allClearA ? 'A' : 'B'
  if (cleared >= total - 1) return years >= g.nearMissB ? 'B' : 'C' // 하나 빼고 전부 극복
  if (cleared >= 2) return 'C' // 2개 이상 극복
  return 'D' // 0~1개 = 사실상 붕괴
}

// 목표구배(Kivetz) + 손실회피 — 결과 화면 "다음 목표까지 한 끗" 근접 문구.
// hot = 재도전 압력 최고조 (완전집권 한 끗 / 상위 등급 근접). 등급 컷은 gradeOf와 동일 출처.
export function nextGoal(r: SimResult): { text: string; hot: boolean } | null {
  const g = B.GRADE_YEARS
  const NEAR = 6 // 상위 등급까지 N년 이내면 '한 끗'으로 강조
  const total = r.crises.length
  if (r.allClear) {
    if (r.grade === 'S') return { text: '최고 등급 — 더 긴 집권으로 신기록에 도전하라', hot: false }
    if (r.grade === 'A') return { text: `S 등급까지 ${g.allClearS - r.years}년`, hot: g.allClearS - r.years <= NEAR }
    return { text: `A 등급까지 ${g.allClearA - r.years}년`, hot: g.allClearA - r.years <= NEAR }
  }
  const miss = total - r.cleared
  if (miss === 1) return { text: '위기 하나만 더 막았다면 완전 집권 — 한 끗 차이!', hot: true }
  if (r.cleared >= Math.ceil(total / 2)) return { text: `완전 집권까지 위기 ${miss}개 더 — 내각을 다시 짜보자`, hot: false }
  return { text: '이번 내각으론 역부족 — 판을 다시 돌려라', hot: false }
}

// ── 유틸 ───────────────────────────────────────────────────────────
function pickDistinct<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  const pool = arr.slice()
  const out: T[] = []
  for (let i = 0; i < n; i++) out.push(pool.splice(randInt(rng, pool.length), 1)[0])
  return out
}
