// 목표구배 진행바 검증 — npx tsx scripts/verify_goalgradient.ts
// 브라우저 애니메이션 타이밍에 의존하지 않고, UI가 쓰는 '실제' 순수 로직을 직접 호출해
// (1) CrisisTracker 헤드라인 전 분기 (2) nextGoal near-miss 전 분기 + 산술 (3) grade↔nextGoal 정합
// (4) UI 드래프트 정책 재현 후 cleared/grade 분포로 hot 분기 도달가능성 확인.

import { BALANCE as B } from '../src/lib/balance'
import { createStreams } from '../src/lib/rng'
import { simulate, gradeOf, nextGoal } from '../src/lib/simulate'
import { crisisProgress } from '../src/lib/progress'
import { spin } from '../src/game/draft'
import { SLOTS, type Cabinet } from '../src/lib/types'

let pass = 0, fail = 0
function eq(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  console.log(`  ${ok ? '✅' : '❌'} ${label}${ok ? '' : `\n      got : ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`)
  ok ? pass++ : fail++
}
function assert(label: string, cond: boolean) {
  console.log(`  ${cond ? '✅' : '❌'} ${label}`)
  cond ? pass++ : fail++
}

// ── 1. CrisisTracker 헤드라인 (실제 crisisProgress) ──────────────────
console.log('\n[1] CrisisTracker 헤드라인 (총 3위기)')
const N = null
eq('시작(대기3)', crisisProgress(3, [N, N, N]), { headline: '0/3 저지 — 완전 집권까지 3개', hot: false })
eq('1저지 무패', crisisProgress(3, [true, N, N]), { headline: '1/3 저지 — 완전 집권까지 2개', hot: false })
eq('🔥 2저지 마지막하나(HOT)', crisisProgress(3, [true, true, N]), { headline: '🔥 2/3 저지! 마지막 하나', hot: true })
eq('첫판 실패 즉시', crisisProgress(3, [false, N, N]), { headline: '완전 집권 무산 — 0/3 저지', hot: false })
eq('실패 후엔 hot 안뜸', crisisProgress(3, [true, false, N]), { headline: '완전 집권 무산 — 1/3 저지', hot: false })
eq('🏆 완전집권', crisisProgress(3, [true, true, true]), { headline: '🏆 완전 집권 달성!', hot: false })
eq('막판 실패 2/3', crisisProgress(3, [true, true, false]), { headline: '위기 2/3 저지', hot: false })
eq('완패 0/3', crisisProgress(3, [false, false, false]), { headline: '위기 0/3 저지', hot: false })

// ── 2. nextGoal near-miss 전 분기 + 산술 (합성 SimResult) ────────────
console.log('\n[2] nextGoal near-miss (등급 컷 GRADE_YEARS = ' + JSON.stringify(B.GRADE_YEARS) + ')')
const mk = (cleared: number, years: number, allClear: boolean) =>
  ({ cleared, years, allClear, grade: gradeOf(cleared, years, allClear) } as ReturnType<typeof simulate>)
eq('완패(0극복)', nextGoal(mk(0, 12, false)), { text: '이번 내각으론 역부족 — 판을 다시 돌려라', hot: false })
eq('1극복', nextGoal(mk(1, 20, false)), { text: '완전 집권까지 위기 2개 더 — 내각을 다시 짜보자', hot: false })
eq('2극복 한끗(HOT)', nextGoal(mk(2, 40, false)), { text: '위기 하나만 더 막았다면 완전 집권 🏆 — 한 끗 차이!', hot: true })
eq('완전집권 B (years 44)', nextGoal(mk(3, 44, true)), { text: 'A 등급까지 1년', hot: true })
eq('완전집권 B (years 20)', nextGoal(mk(3, 20, true)), { text: 'A 등급까지 25년', hot: false })
eq('완전집권 A (years 69, S 코앞)', nextGoal(mk(3, 69, true)), { text: 'S 등급까지 1년', hot: true })
eq('완전집권 A (years 45)', nextGoal(mk(3, 45, true)), { text: 'S 등급까지 25년', hot: false })
eq('완전집권 S (최고)', nextGoal(mk(3, 80, true)), { text: '🏆 최고 등급 — 더 긴 집권으로 신기록에 도전하라', hot: false })

// 등급 경계 정확성 (컷 = balance 단일 출처)
console.log('\n[2b] gradeOf 경계 (allClearS=' + B.GRADE_YEARS.allClearS + ', allClearA=' + B.GRADE_YEARS.allClearA + ', cleared2B=' + B.GRADE_YEARS.cleared2B + ')')
assert('allClear 70→S, 69→A', gradeOf(3, 70, true) === 'S' && gradeOf(3, 69, true) === 'A')
assert('allClear 45→A, 44→B', gradeOf(3, 45, true) === 'A' && gradeOf(3, 44, true) === 'B')
assert('2극복 30→B, 29→C', gradeOf(2, 30, false) === 'B' && gradeOf(2, 29, false) === 'C')
assert('1극복→C, 0극복→D', gradeOf(1, 99, false) === 'C' && gradeOf(0, 99, false) === 'D')

// ── 3. 실 게임 정합 + 분기 도달가능성 (UI 드래프트 정책 재현) ─────────
// 브라우저 자동드래프트와 동일: 매 라운드 spin → 최고 OVR 후보(candidates[0]) → 첫 빈 슬롯(SLOTS 순)
function uiDraft(seed: number): Cabinet {
  const pool = createStreams(seed).pool
  const cab: Partial<Cabinet> = {}
  const used = new Set<string>()
  for (let r = 0; r < SLOTS.length; r++) {
    const emptyFirst = SLOTS.find((s) => !cab[s.id])!
    const pick = spin(pool, used).candidates[0]
    cab[emptyFirst.id] = pick
    used.add(pick.id)
  }
  return cab as Cabinet
}

console.log('\n[3] 실 게임 정합 + 분기 분포 (UI 정책, 시드 1..3000)')
const dist = { c0: 0, c1: 0, c2: 0, c3: 0 }
const gradeDist: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
let mismatch = 0
const example: Record<string, string> = {}
for (let seed = 1; seed <= 3000; seed++) {
  const r = simulate(seed, uiDraft(seed))
  dist[`c${r.cleared}` as keyof typeof dist]++
  gradeDist[r.grade]++
  // 정합: grade는 gradeOf와 일치, nextGoal은 항상 값 반환
  if (r.grade !== gradeOf(r.cleared, r.years, r.allClear)) mismatch++
  const g = nextGoal(r)
  if (!g) mismatch++
  const key = r.allClear ? `allClear-${r.grade}` : `cleared${r.cleared}`
  if (!example[key]) example[key] = `seed ${seed}: ${r.cleared}/3, ${r.years}년, ${r.grade} → "${g!.text}"${g!.hot ? ' [HOT]' : ''}`
}
console.log(`  극복 분포: 0=${dist.c0} 1=${dist.c1} 2=${dist.c2} 3=${dist.c3}  |  등급: S${gradeDist.S} A${gradeDist.A} B${gradeDist.B} C${gradeDist.C} D${gradeDist.D}`)
assert('grade↔gradeOf 정합 + nextGoal 항상 반환 (mismatch 0)', mismatch === 0)
assert('2극복(한끗 near-miss) 실제 도달', dist.c2 > 0)
assert('완전집권(hot 트래커 발생) 실제 도달', dist.c3 > 0)
console.log('  분기별 실 게임 예시:')
for (const k of Object.keys(example).sort()) console.log(`    · ${k.padEnd(14)} ${example[k]}`)

// ── 결과 ─────────────────────────────────────────────────────────────
console.log(`\n${fail === 0 ? '✅ 전체 통과' : '❌ 실패 있음'} — pass ${pass}, fail ${fail}`)
process.exit(fail === 0 ? 0 : 1)
