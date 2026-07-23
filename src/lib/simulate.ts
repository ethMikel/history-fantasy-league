// 시뮬 코어 — 순수 함수 (06_SIM_SPEC §1~§7 구현)
// DOM/React 의존 금지: 클라이언트·봇 러너·(향후) Edge Function이 이 모듈을 공유한다.

import { BALANCE as B } from './balance'
import { CRISIS_POOL } from '../data/crises'
import { createStreams, mulberry32, hashSeed, randInt, type Rng } from './rng'
import {
  AXES, SLOTS,
  type Cabinet, type Character, type Crisis, type Difficulty,
  type SimResult, type SlotDef, type TimelineEvent,
} from './types'

const DIFFS: Difficulty[] = ['low', 'mid', 'high']

// ── 위기 생성 (예고 시스템) ─────────────────────────────────────────
// 드래프트 화면과 시뮬이 같은 seed로 같은 위기 3개를 얻는다 (예고 = 계약).
// 난이도 하/중/상 각 1개 고정 구성, 축은 중복 없이 3개 (rng_crisis 전용 파생 스트림).
export function generateCrises(seed: number): Crisis[] {
  const rng = mulberry32(hashSeed(`crisis:${seed}`))
  const axes = pickDistinct(rng, AXES, 3)
  // 발생 연차: 초반(2~5) / 중반(6~10) / 후반(11~15) — 난이도와 시기는 독립 셔플
  const yearBands: Array<[number, number]> = [[2, 5], [6, 10], [11, 15]]
  const shuffledDiffs = pickDistinct(rng, DIFFS, 3)
  return yearBands.map(([lo, hi], i) => {
    const axis = axes[i]
    const difficulty = shuffledDiffs[i]
    const pool = CRISIS_POOL[axis][difficulty]
    const scenario = pool[randInt(rng, pool.length)]
    return {
      axis, difficulty,
      year: lo + randInt(rng, hi - lo + 1),
      title: scenario.title,
      omen: scenario.omen,
    }
  }).sort((a, b) => a.year - b.year)
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

  // 소이벤트 2~4개 (연출·소폭 변동, rng_crisis 스트림)
  const minorCount = 2 + randInt(minorRng, 3)
  const minors = Array.from({ length: minorCount }, () => ({
    year: 1 + randInt(minorRng, 15),
    delta: randInt(minorRng, 4) - 1, // −1..+2
  }))

  const events: Array<{ year: number; run: () => TimelineEvent }> = []

  for (const c of crises) {
    events.push({
      year: c.year,
      run: () => {
        const { S, who, viaFlex } = responder(cabinet, c)
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
          year: c.year, kind: 'crisis', axis: c.axis, difficulty: c.difficulty,
          success, margin, deltaYears: delta, supportAfter: support,
          responder: who.name, viaFlex,
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
        return { year: m.year, kind: 'minor', deltaYears: m.delta, supportAfter: support }
      },
    })
  }

  events.sort((a, b) => a.year - b.year)
  for (const e of events) timeline.push(e.run())

  // 올클리어 보너스 + 황금기: 위기 3개 전부 성공 시 (§6 + v0.3 구조 추가)
  // 황금기 = (내각 8인 전체 평균/99)² × GOLDEN_AGE_MAX — 위기 축 밖의 픽에도 가치 부여, 상위 꼬리 형성
  const crisisEvents = timeline.filter((e) => e.kind === 'crisis')
  if (crisisEvents.length > 0 && crisisEvents.every((e) => e.success)) {
    const cabinetAvg = SLOTS.reduce((s, sl) => s + avg6(cabinet[sl.id]), 0) / SLOTS.length
    years += B.ALL_CLEAR_BONUS + B.GOLDEN_AGE_MAX * Math.pow(cabinetAvg / 99, 2)
  }

  const finalYears = Math.min(B.HARD_CAP_YEARS, Math.max(1, Math.round(years)))
  return { years: finalYears, timeline, crises, finalSupport: support }
}

// ── 유틸 ───────────────────────────────────────────────────────────
function pickDistinct<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  const pool = arr.slice()
  const out: T[] = []
  for (let i = 0; i < n; i++) out.push(pool.splice(randInt(rng, pool.length), 1)[0])
  return out
}
