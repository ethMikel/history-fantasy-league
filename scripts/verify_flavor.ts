// 키치 톤(FLAVOR) 검증 — npx tsx scripts/verify_flavor.ts
// (1) 커버리지: 비플래그 141명 전원 존재 (2) 플래그 15명 제외 (3) 키 전부 로스터에 존재
// (4) 채점 문법 잔존 없음 (5) 숫자 환각 휴리스틱: 키치에 든 숫자가 evidence에 없으면 경고

import { FLAVOR } from '../src/data/flavor'
import { ROSTER } from '../src/data/roster'

const byId = Object.fromEntries(ROSTER.map((c) => [c.id, c]))
let err = 0, warn = 0
const nonFlag = ROSTER.filter((c) => !c.flag)

// (3) 키가 전부 실재
for (const id of Object.keys(FLAVOR)) {
  if (!byId[id]) { err++; console.log(`  ❌ 로스터에 없는 id: ${id}`) }
  else if (byId[id].flag) { err++; console.log(`  ❌ 플래그 인물에 키치 부여됨: ${byId[id].name}`) }
}
// (1) 커버리지
for (const c of nonFlag) if (!FLAVOR[c.id]) { err++; console.log(`  ❌ 키치 누락: ${c.name} (${c.id})`) }

// (4)(5) 잔존 문법 + 숫자 환각
const JARGON = /(무력|군사|지략|내정|외교|과학|문화)\s*\d+\s*:|앵커/
for (const [id, line] of Object.entries(FLAVOR)) {
  const c = byId[id]
  if (!c) continue
  if (JARGON.test(line)) { err++; console.log(`  ❌ 채점문법 잔존: ${c.name} → "${line}"`) }
  if ([...line].length > 40) { warn++; console.log(`  ⚠️ 40자 초과(${[...line].length}): ${c.name} → "${line}"`) }
  // 숫자 환각: 키치의 각 숫자 토큰이 evidence에 그대로 있어야 (콤마 제거 후 비교)
  const ev = (c.evidence ?? '').replace(/,/g, '')
  for (const num of line.replace(/,/g, '').match(/\d+/g) ?? []) {
    if (!ev.includes(num)) { warn++; console.log(`  ⚠️ 숫자 '${num}' evidence에 없음: ${c.name} → "${line}"`) }
  }
}

console.log(`\n[flavor] 총 ${Object.keys(FLAVOR).length}개 / 비플래그 ${nonFlag.length}명 | 오류 ${err} | 경고 ${warn}`)
process.exit(err === 0 ? 0 : 1)
