// near-miss 검증 — npx tsx scripts/verify_nearmiss.ts
// (1) nearMiss는 스핀한 셀에 실재하고 안 뽑힌 전설/명신 중 최고 OVR (정직성)
// (2) RNG 결정론 유지 (같은 seed → 동일 candidates + nearMiss)
// (3) 출현 빈도 (너무 잦으면 나감 → 튜닝 신호)

import { createStreams } from '../src/lib/rng'
import { spin } from '../src/game/draft'
import { ROSTER } from '../src/data/roster'
import type { Character } from '../src/lib/types'

const peak = (c: Character) => Math.max(...Object.values(c.stats))
const rank = (t: Character['tier']) => (t === 'legend' ? 2 : t === 'great' ? 1 : 0)

let withNM = 0, checked = 0, bad = 0
const sample: string[] = []
for (let seed = 1; seed <= 2000; seed++) {
  const r = spin(createStreams(seed).pool, new Set())
  checked++
  if (!r.nearMiss) continue
  withNM++
  const nm = r.nearMiss
  const drawn = new Set(r.candidates.map((c) => c.id))
  // 첫 스핀은 usedIds 비어있음 → 셀 = 같은 civ+era 전원. 기대 nearMiss 재계산.
  const cell = ROSTER.filter((c) => c.civ === r.civ && c.era === r.era)
  const expect = cell.filter((c) => !drawn.has(c.id) && (c.tier === 'legend' || c.tier === 'great'))
                     .sort((a, b) => rank(b.tier) - rank(a.tier) || peak(b) - peak(a))[0]
  const ok = !drawn.has(nm.id) && (nm.tier === 'legend' || nm.tier === 'great')
    && nm.civ === r.civ && nm.era === r.era && !!expect && nm.id === expect.id
  if (!ok) { bad++; console.log(`  ❌ seed ${seed}: nm=${nm.name}(${nm.tier}) expect=${expect?.name} cell=${r.civ}·${r.era}`) }
  if (sample.length < 6) sample.push(`  · ${r.civ}·${r.era}: 뽑힘 [${r.candidates.map((c) => c.name).join(', ')}] → 놓침 ⭐${nm.name}(${nm.tier}, peak ${peak(nm)})`)
}

// 결정론: 같은 seed 두 번 스핀 → 동일 결과
let detBad = 0
for (const seed of [1, 2, 3, 50, 123, 777, 999]) {
  const a = spin(createStreams(seed).pool, new Set())
  const b = spin(createStreams(seed).pool, new Set())
  const same = JSON.stringify(a.candidates.map((c) => c.id)) === JSON.stringify(b.candidates.map((c) => c.id))
    && (a.nearMiss?.id ?? '-') === (b.nearMiss?.id ?? '-')
  if (!same) detBad++
}

console.log(`\n[near-miss] 첫 스핀 ${checked}회`)
console.log(`  near-miss 출현: ${withNM} (${(100 * withNM / checked).toFixed(0)}%) | 정직성 위반: ${bad} | 결정론 위반: ${detBad}`)
console.log('  샘플:')
console.log(sample.join('\n'))
const okAll = bad === 0 && detBad === 0
console.log(`\n${okAll ? '✅ 전체 통과' : '❌ 실패'}`)
process.exit(okAll ? 0 : 1)
