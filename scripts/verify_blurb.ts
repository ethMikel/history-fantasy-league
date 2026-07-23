// 한 줄 코멘트 변환 검증 — npx tsx scripts/verify_blurb.ts
// evidence(실데이터)에서 채점 문법을 벗긴 blurb를 전 156명에 적용해 이상치를 잡는다.

import { blurb } from '../src/lib/blurb'
import { ROSTER } from '../src/data/roster'

let empty = 0, leftover = 0, tooLong = 0
const LEFTOVER = /(무력|군사|지략|내정|외교|과학|문화)\s*\d+\s*:|앵커/ // 남으면 안 되는 심사 문법
const samples: string[] = []
for (const c of ROSTER) {
  const b = blurb(c.evidence)
  if (!b) { empty++; console.log(`  ❌ 빈 코멘트: ${c.name} (evidence=${JSON.stringify(c.evidence)})`) }
  if (LEFTOVER.test(b)) { leftover++; console.log(`  ❌ 심사문법 잔존: ${c.name} → "${b}"`) }
  if (b.length > 60) tooLong++
}
// 무작위 대신 앞/중간/뒤 몇 개를 눈으로 확인
for (const i of [0, 7, 25, 60, 100, 140, 155]) {
  const c = ROSTER[i]; if (c) samples.push(`  · ${c.name.padEnd(16)} → ${blurb(c.evidence)}`)
}

console.log(`\n[blurb 변환] ${ROSTER.length}명`)
console.log(`  빈 코멘트: ${empty} | 심사문법 잔존: ${leftover} | 60자 초과(2줄클램프 처리): ${tooLong}`)
console.log('  샘플:')
console.log(samples.join('\n'))
const ok = empty === 0 && leftover === 0
console.log(`\n${ok ? '✅ 전체 통과' : '❌ 이상치 있음'}`)
process.exit(ok ? 0 : 1)
