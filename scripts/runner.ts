// 봇 밸런스 러너 (06_SIM_SPEC §8) — npm run sim
// 봇 3단 사다리: Random / Greedy(예고를 읽는 평균 유저) / Oracle(판정식을 아는 최적 유저)
// 합격 기준: Greedy ≫ Random (드래프트가 유의미), Oracle ≤ Greedy×~1.3 (예고가 읽히되 자명하지 않음)

import { BALANCE as B } from '../src/lib/balance'
import { createStreams, randInt, type Rng } from '../src/lib/rng'
import { generateCrises, presidentMultiplier, simulate, slotScore, successProb, responder } from '../src/lib/simulate'
import { ROSTER } from '../src/data/roster'
import { SLOTS, type Cabinet, type Character, type Crisis, type SlotId } from '../src/lib/types'

type Policy = 'random' | 'greedy' | 'oracle'
const N_GAMES = 2000
const CANDIDATES_PER_ROUND = 3

// ── 드래프트 시뮬 (봇용): 라운드마다 후보 3명 제시 → 정책이 (인물, 슬롯) 선택 ──
function draft(seed: number, policy: Policy): Cabinet {
  const { pool } = createStreams(seed)
  const crises = generateCrises(seed) // 예고 — greedy/oracle이 읽는 정보
  const remaining = ROSTER.slice()
  const cabinet = {} as Cabinet
  const emptySlots = () => SLOTS.filter((s) => !cabinet[s.id])

  for (let round = 0; round < B.SLOTS; round++) {
    const candidates: Character[] = []
    for (let i = 0; i < CANDIDATES_PER_ROUND && remaining.length > 0; i++) {
      candidates.push(remaining.splice(randInt(pool, remaining.length), 1)[0])
    }
    const { pick, slot } = choose(policy, candidates, cabinet, crises, pool)
    cabinet[slot] = pick
    // 미선택 후보는 풀에 반환
    for (const c of candidates) if (c !== pick) remaining.push(c)
  }
  return cabinet

  function choose(p: Policy, cands: Character[], cab: Partial<Cabinet>, cr: Crisis[], rng: Rng) {
    const empty = emptySlots()
    if (p === 'random') {
      return { pick: cands[randInt(rng, cands.length)], slot: empty[randInt(rng, empty.length)].id as SlotId }
    }
    // greedy: 예고된 위기 축의 미충원 부처를 우선, 해당 축 스탯 최고 후보 배치. 없으면 최고 슬롯 점수.
    if (p === 'greedy') {
      const crisisAxes = cr.map((c) => c.axis)
      const urgent = empty.filter((s) => s.mainAxis && crisisAxes.includes(s.mainAxis))
      if (urgent.length > 0) {
        let best = { v: -1, pick: cands[0], slot: urgent[0].id as SlotId }
        for (const s of urgent) for (const c of cands) {
          const v = c.stats[s.mainAxis!]
          if (v > best.v) best = { v, pick: c, slot: s.id as SlotId }
        }
        return { pick: best.pick, slot: best.slot }
      }
      let best = { v: -1, pick: cands[0], slot: empty[0].id as SlotId }
      for (const s of empty) for (const c of cands) {
        const v = slotScore(s, c)
        if (v > best.v) best = { v, pick: c, slot: s.id as SlotId }
      }
      return { pick: best.pick, slot: best.slot }
    }
    // oracle: 판정식 기반 기대 연수 근사 — (인물×빈 슬롯) 전 조합 평가
    let best = { v: -Infinity, pick: cands[0], slot: empty[0].id as SlotId }
    for (const s of empty) for (const c of cands) {
      const trial = { ...cab, [s.id]: c } as Cabinet
      const v = expectedYears(trial, cr)
      if (v > best.v) best = { v, pick: c, slot: s.id as SlotId }
    }
    return { pick: best.pick, slot: best.slot }
  }
}

// oracle 평가함수: 채워진 슬롯 기준 기대 연수 (미충원 슬롯은 로스터 평균 가정)
function expectedYears(cab: Partial<Cabinet>, crises: Crisis[]): number {
  const M = cab.president ? presidentMultiplier(cab.president) : 1.0
  let e = B.Y_BASE
  for (const c of crises) {
    const slot = SLOTS.find((s) => s.mainAxis === c.axis)!
    const filled = cab[slot.id] || cab.flex
    if (!filled) { e += 0; continue }
    const full = cab as Cabinet
    const S = cab[slot.id] && cab.flex ? responder(full, c).S
      : cab[slot.id] ? slotScore(slot, cab[slot.id]!)
      : B.FLEX_PENALTY * cab.flex!.stats[c.axis]
    const p = successProb(S, M, c.difficulty)
    const margin = Math.max(S * M - B.D[c.difficulty], 0)
    e += p * B.G_MAX[c.difficulty] * (1 - Math.exp(-margin / B.MARGIN_SOFTCAP_S)) - (1 - p) * B.L_FAIL[c.difficulty]
  }
  return e
}

// ── 실행 및 리포트 ──────────────────────────────────────────────────
function pct(sorted: number[], q: number) { return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] }

function run(policy: Policy) {
  const years: number[] = []
  const crisisStats: Record<string, { n: number; ok: number }> = { low: { n: 0, ok: 0 }, mid: { n: 0, ok: 0 }, high: { n: 0, ok: 0 } }
  for (let seed = 1; seed <= N_GAMES; seed++) {
    const cab = draft(seed, policy)
    const r = simulate(seed, cab)
    years.push(r.years)
    for (const e of r.timeline) if (e.kind === 'crisis') {
      crisisStats[e.difficulty!].n++
      if (e.success) crisisStats[e.difficulty!].ok++
    }
  }
  years.sort((a, b) => a - b)
  const mean = years.reduce((s, y) => s + y, 0) / years.length
  return {
    policy, mean,
    median: pct(years, 0.5), p5: pct(years, 0.05), p95: pct(years, 0.95),
    p99: pct(years, 0.99), max: years[years.length - 1],
    trimmedSpan: pct(years, 0.975) - pct(years, 0.025),
    success: Object.fromEntries(Object.entries(crisisStats).map(([k, v]) => [k, (100 * v.ok / Math.max(1, v.n)).toFixed(0) + '%'])),
  }
}

console.log(`히스토리 판타지 리그 — 봇 밸런스 러너 (${N_GAMES}판 × 3정책, 동일 시드셋)\n`)
const results = (['random', 'greedy', 'oracle'] as Policy[]).map(run)
for (const r of results) {
  console.log(`[${r.policy.padEnd(6)}] median ${String(r.median).padStart(3)}년 | mean ${r.mean.toFixed(1)} | p5 ${r.p5} | p95 ${r.p95} | p99 ${r.p99} | max ${r.max} | 성공률 하${r.success.low} 중${r.success.mid} 상${r.success.high}`)
}
const [rand, greedy, oracle] = results
const K = greedy.mean - rand.mean
const L = greedy.trimmedSpan / 2
const S = (K - L) / (K + L)
console.log(`\n실력 레버리지 K = greedy−random 평균차 = ${K.toFixed(1)}년`)
console.log(`운 레버리지 L = greedy trimmed span/2 = ${L.toFixed(1)}년`)
console.log(`운/실력 지수 S = (K−L)/(K+L) = ${S.toFixed(2)}  (목표 0 ~ +0.4)`)
console.log(`oracle/greedy 배율 = ${(oracle.mean / greedy.mean).toFixed(2)}  (목표 ≤ ~1.3)`)
console.log(`판정: ${K > 3 ? '✅ 드래프트가 유의미 (Greedy ≫ Random)' : '❌ 운 게임 위험 — 예고 정보가치 강화 필요'}`)
