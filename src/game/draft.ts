// 드래프트 스핀 로직 — 세션 rng(pool 스트림)로 후보를 뽑는다.
// walking skeleton: 정식 셀 매트릭스(10_CELL_MATRIX)는 Phase 2. 여기선 로스터의 civ/era를
// 셀 라벨로 쓰고, 아직 등용 안 된 인물 중 한 셀을 골라 그 셀 후보를 제시한다.

import { ROSTER } from '../data/roster'
import { randInt, type Rng } from '../lib/rng'
import type { Character } from '../lib/types'

const CANDIDATES_PER_SPIN = 4

export interface SpinResult {
  candidates: Character[]
  label: string // "동아시아 · 15세기"
  civ: string
  era: string
}

// 이미 배치된 인물 id 집합을 제외하고, 남은 인물에서 한 셀을 골라 후보 제시.
// fixedEra: "문명만 respin"(시대 유지, 문명 재추첨) 시 현재 시대를 고정 (06_SIM_SPEC §2)
export function spin(rng: Rng, usedIds: Set<string>, fixedEra?: string): SpinResult {
  const pool = ROSTER.filter((c) => !usedIds.has(c.id))
  const cells = buildCells(pool, fixedEra)
  if (cells.length === 0) {
    // 폴백: 남은 인물에서 무작위 (셀 구분 불가할 만큼 소진된 경우)
    const cand = drawN(rng, pool, CANDIDATES_PER_SPIN)
    return { candidates: cand, label: '재야 인사', civ: '재야', era: '' }
  }
  const cell = cells[randInt(rng, cells.length)]
  return {
    candidates: drawN(rng, cell.members, CANDIDATES_PER_SPIN),
    label: `${cell.civ} · ${cell.era}`,
    civ: cell.civ,
    era: cell.era,
  }
}

interface Cell {
  civ: string
  era: string
  members: Character[]
}

function buildCells(pool: Character[], fixedEra?: string): Cell[] {
  const map = new Map<string, Cell>()
  for (const c of pool) {
    if (fixedEra && c.era !== fixedEra) continue
    const key = `${c.civ}|${c.era}`
    if (!map.has(key)) map.set(key, { civ: c.civ, era: c.era, members: [] })
    map.get(key)!.members.push(c)
  }
  // 후보가 최소 1명인 셀만 (skeleton — 실제 데드엔드 방지는 셀당 ≥6명, Phase 2)
  return [...map.values()].filter((c) => c.members.length >= 1)
}

function drawN(rng: Rng, arr: Character[], n: number): Character[] {
  const a = arr.slice()
  const out: Character[] = []
  for (let i = 0; i < n && a.length > 0; i++) out.push(a.splice(randInt(rng, a.length), 1)[0])
  // 종합치 내림차순 (ultimate11 후보 정렬 문법)
  return out.sort((x, y) => ovr(y) - ovr(x))
}

const ovr = (c: Character) => Math.round(Object.values(c.stats).reduce((s, v) => s + v, 0) / 6)
