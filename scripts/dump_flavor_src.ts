// 키치 톤 생성용 원본 추출 — npx tsx scripts/dump_flavor_src.ts
// 비플래그(플래그=현대정치인은 키치 제외, 사실 톤 유지) 인물의 사실 근거만 덤프.
import { ROSTER } from '../src/data/roster'
const src = ROSTER.filter((c) => !c.flag).map((c) => ({
  id: c.id, name: c.name, tier: c.tier, civ: c.civ, era: c.era, evidence: c.evidence ?? '',
}))
console.log(JSON.stringify(src))
console.error(`비플래그 ${src.length}명 / 전체 ${ROSTER.length}명 (플래그 ${ROSTER.length - src.length}명 제외)`)
