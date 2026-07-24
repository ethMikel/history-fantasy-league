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
  nick?: string // 아케이드 닉네임 (명예의 전당 표시)
  seeded?: boolean // true = 심어둔 고득점(표시 전용, localStorage 저장 안 함)
}

// 시드 고득점 — 오락실 명예의 전당을 "살아있게" + 심사위원 후킹용 목표 제시.
// 절대 저장 안 됨(표시 전용). 등급은 gradeOf 규칙과 일치하게 구성.
export const SEEDED: RunRecord[] = [
  { nick: '고인물철수', cabinet: ['조선 세종'], years: 96, grade: 'S', cleared: 5, allClear: true, seeded: true, seed: 0, ts: 0 },
  { nick: '역사덕후',   cabinet: ['아우구스투스'], years: 88, grade: 'S', cleared: 5, allClear: true, seeded: true, seed: 0, ts: 0 },
  { nick: '내각장인',   cabinet: ['나폴레옹 보나파르트'], years: 71, grade: 'A', cleared: 5, allClear: true, seeded: true, seed: 0, ts: 0 },
  { nick: '킹갓다빈치', cabinet: ['레오나르도 다 빈치'], years: 55, grade: 'A', cleared: 5, allClear: true, seeded: true, seed: 0, ts: 0 },
  { nick: '스핀의신',   cabinet: ['이순신'], years: 44, grade: 'B', cleared: 5, allClear: true, seeded: true, seed: 0, ts: 0 },
  { nick: '아깝다1픽',  cabinet: ['율리우스 카이사르'], years: 47, grade: 'B', cleared: 4, allClear: false, seeded: true, seed: 0, ts: 0 },
  { nick: '리스핀요정', cabinet: ['클레오파트라 7세'], years: 38, grade: 'B', cleared: 4, allClear: false, seeded: true, seed: 0, ts: 0 },
  { nick: '중수정치',   cabinet: ['악바르'], years: 33, grade: 'C', cleared: 3, allClear: false, seeded: true, seed: 0, ts: 0 },
  { nick: '첫판입니다', cabinet: ['에이브러햄 링컨'], years: 29, grade: 'C', cleared: 2, allClear: false, seeded: true, seed: 0, ts: 0 },
  { nick: '폭망정권',   cabinet: ['측천무후'], years: 19, grade: 'D', cleared: 1, allClear: false, seeded: true, seed: 0, ts: 0 },
]

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

// 새 기록 저장 → { rank(개인 순위), total, isBest(개인 신기록), ts(닉네임 갱신용) }
export function record(r: Omit<RunRecord, 'ts'>, nick?: string): { rank: number; total: number; isBest: boolean; ts: number } {
  const prev = load()
  const prevBestKey = prev.length ? Math.max(...prev.map(rankKey)) : -1
  const rec: RunRecord = { ...r, nick, ts: Date.now() }
  const all = sorted([rec, ...prev])
  save(all)
  const rank = all.findIndex((x) => x === rec) + 1
  return { rank, total: all.length, isBest: rankKey(rec) > prevBestKey, ts: rec.ts }
}

// 방금 저장한 기록의 닉네임 갱신 (아케이드 이름 입력)
export function updateNick(ts: number, nick: string) {
  const list = load()
  const r = list.find((x) => x.ts === ts)
  if (r) { r.nick = nick.slice(0, 12); save(sorted(list)) }
}

// 명예의 전당: 시드 고득점 + 내 기록 병합 정렬 (표시 전용). isMine으로 하이라이트.
export function leaderboard(n = 10): (RunRecord & { isMine: boolean })[] {
  return sorted([...SEEDED, ...load()]).slice(0, n).map((r) => ({ ...r, isMine: !r.seeded }))
}

// 병합 보드에서 특정 기록(ts)의 순위(1-based)와 전체 수
export function rankOf(ts: number): { rank: number; total: number } {
  const all = sorted([...SEEDED, ...load()])
  const i = all.findIndex((r) => !r.seeded && r.ts === ts)
  return { rank: i < 0 ? all.length : i + 1, total: all.length }
}

export function top(n = 5): RunRecord[] {
  return sorted(load()).slice(0, n)
}

export function personalBest(): RunRecord | null {
  return top(1)[0] ?? null
}
