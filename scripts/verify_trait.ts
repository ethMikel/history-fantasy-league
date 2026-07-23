// 시그니처 특성 검증 — npx tsx scripts/verify_trait.ts
// (1) signatureAxis = 전설/명신의 최고 스탯 축, 그 외 null (2) sim에서 traitFired가
// 정확히 '담당자 시그니처 == 위기 축'일 때만 발동 (3) 발동 빈도.

import { createStreams } from '../src/lib/rng'
import { spin } from '../src/game/draft'
import { simulate, signatureAxis } from '../src/lib/simulate'
import { ROSTER } from '../src/data/roster'
import { AXES, SLOTS, type Axis, type Cabinet, type Character } from '../src/lib/types'

let bad = 0
// (1) signatureAxis 정확성 — 전 로스터
const sigDist: Record<string, number> = {}
for (const c of ROSTER) {
  const sig = signatureAxis(c)
  if (c.tier === 'legend' || c.tier === 'great') {
    const expect = AXES.reduce((b, a) => (c.stats[a] > c.stats[b] ? a : b), AXES[0])
    if (sig !== expect) { bad++; console.log(`  ❌ ${c.name}: sig=${sig} expect=${expect}`) }
    sigDist[sig!] = (sigDist[sig!] ?? 0) + 1
  } else if (sig !== null) {
    bad++; console.log(`  ❌ ${c.name}(${c.tier}): 특성 없어야 하는데 ${sig}`)
  }
}

// (2)(3) sim 배선 — UI 정책 드래프트로 여러 판, traitFired 발동 조건 검증
function uiDraft(seed: number): Cabinet {
  const pool = createStreams(seed).pool
  const cab: Partial<Cabinet> = {}
  const used = new Set<string>()
  for (let r = 0; r < SLOTS.length; r++) {
    const first = SLOTS.find((s) => !cab[s.id])!
    const pick = spin(pool, used).candidates[0]
    cab[first.id] = pick; used.add(pick.id)
  }
  return cab as Cabinet
}
let fired = 0, crisisN = 0, wireBad = 0
for (let seed = 1; seed <= 2000; seed++) {
  const cab = uiDraft(seed)
  const byName: Record<string, Character> = {}
  for (const s of SLOTS) byName[cab[s.id].name] = cab[s.id]
  for (const e of simulate(seed, cab).timeline) {
    if (e.kind !== 'crisis') continue
    crisisN++
    const who = byName[e.responder!]
    const shouldFire = !!who && signatureAxis(who) === e.axis
    if (!!e.traitFired !== shouldFire) { wireBad++; if (wireBad <= 5) console.log(`  ❌ 배선 seed ${seed}: ${e.responder} axis=${e.axis} fired=${e.traitFired} should=${shouldFire}`) }
    if (e.traitFired) fired++
  }
}

console.log(`\n[특성] signatureAxis 분포(전설/명신): ${AXES.map((a) => `${a}${sigDist[a] ?? 0}`).join(' ')}`)
console.log(`  발동: ${fired}/${crisisN} 위기 (${(100 * fired / crisisN).toFixed(0)}%) | signatureAxis 오류: ${bad} | traitFired 배선 오류: ${wireBad}`)
const ok = bad === 0 && wireBad === 0
console.log(`\n${ok ? '✅ 전체 통과' : '❌ 실패'}`)
process.exit(ok ? 0 : 1)
