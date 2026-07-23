// 로컬 기록 (localStorage) — Supabase 이전의 1차 리더보드 (02_GAMEDEV_STUDY: local-first)
// retry 동기: "내 역대 최고 깨기" + 이번 판 순위. 원격 리더보드는 이 위에 얹는다.
import type { Grade } from '../lib/types'

const KEY = 'hfl.scores.v1'
const MAX = 50

export interface RunRecord {
  seed: number
  years: number
  grade: Grade
  cleared: number
  allClear: boolean
  cabinet: string[] // 8인 이름 (자랑·재현용)
  ts: number // 기록 시각 (표시용, 정렬엔 미사용)
}

function load(): RunRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RunRecord[]) : []
  } catch {
    return []
  }
}

function save(list: RunRecord[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))) } catch { /* 무시 */ }
}

// 리더보드 정렬: 1차 우승(올클리어) → 2차 집권연수 (동현 확정) → 3차 등급
export function rankKey(r: { allClear: boolean; years: number; cleared: number }): number {
  return (r.allClear ? 1_000_000 : 0) + r.cleared * 100_000 + r.years
}

export function sorted(list: RunRecord[]): RunRecord[] {
  return [...list].sort((a, b) => rankKey(b) - rankKey(a))
}

// 새 기록 저장 → { rank(이번 판 순위, 1-based), total, isBest(개인 신기록 여부) }
export function record(r: Omit<RunRecord, 'ts'>): { rank: number; total: number; isBest: boolean } {
  const prev = load()
  const prevBestKey = prev.length ? Math.max(...prev.map(rankKey)) : -1
  const rec: RunRecord = { ...r, ts: Date.now() }
  const all = sorted([rec, ...prev])
  save(all)
  const rank = all.findIndex((x) => x === rec) + 1
  return { rank, total: all.length, isBest: rankKey(rec) > prevBestKey }
}

export function top(n = 5): RunRecord[] {
  return sorted(load()).slice(0, n)
}

export function personalBest(): RunRecord | null {
  return top(1)[0] ?? null
}
