import { useState, useEffect } from 'react'
import { BALANCE as B } from '../lib/balance'
import { SLOTS, type Character, type SlotId } from '../lib/types'
import { MiniPortrait, fitScore, SupportGraph } from '../ui/shared'
import { nextGoal } from '../lib/simulate'
import { play } from '../lib/sfx'
import { record, top } from '../game/localScores'
import { shareResult } from '../game/shareCard'
import type { Action, GameState } from '../game/gameState'

const GRADE_COLOR: Record<string, string> = {
  S: 'var(--gold-400)', A: 'var(--stat-diplomacy)', B: 'var(--stat-domestic)', C: 'var(--paper-300)', D: 'var(--paper-100)',
}

export function ResultScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const r = state.result!
  const support = [B.SUPPORT_START, ...r.timeline.map((e) => e.supportAfter)]

  // 이번 판을 로컬 기록에 저장 (마운트 시 1회) → 순위·신기록 + 역대 TOP
  const [meta] = useState(() => record({
    seed: state.seed, years: r.years, grade: r.grade, cleared: r.cleared, allClear: r.allClear,
    cabinet: SLOTS.map((s) => state.slots[s.id]!.name),
  }))
  const [board] = useState(() => top(5))
  const [sharing, setSharing] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const goal = nextGoal(r) // 목표구배/near-miss — "한 끗" 근접치로 재도전 유도
  const shownYears = useCountUp(r.years) // 집권연수 카운트업 (juice)
  useEffect(() => { play(r.allClear ? 'win' : 'lose') }, [r.allClear]) // 결과 진입 효과음

  return (
    <div className="result-screen">
      {/* 우승 여부 = 1차 목표 (retry 동기) */}
      <div className={`result-verdict hard-shadow ${r.allClear ? 'win' : 'lose'}`}>
        {r.allClear ? (
          <>
            <span className="win-crown">🏆</span>
            <span className="win-title">완전 집권</span>
            <span className="verdict-sub">위기 3개 전부 극복 — 명예의 전당 등재 자격</span>
          </>
        ) : (
          <>
            <span className="verdict-label">위기 {r.cleared} / 3 극복</span>
            <span className="lose-title">정권 교체</span>
            <span className="verdict-sub">3개를 모두 막아야 완전 집권이다. 다시 도전하라.</span>
          </>
        )}
        <div className="result-metrics">
          <span className="grade-badge" style={{ color: GRADE_COLOR[r.grade], borderColor: GRADE_COLOR[r.grade] }}>{r.grade}</span>
          <span className="years-metric"><b>{shownYears}</b>년 집권</span>
        </div>
      </div>

      {/* 목표구배/near-miss — 다음 목표까지 "한 끗" (재도전 압력) */}
      {goal && <div className={`near-miss hard-shadow${goal.hot ? ' hot' : ''}`}>{goal.text}</div>}

      {/* 이번 판 순위 + 신기록 — "내 최고 깨기" retry 훅 */}
      <div className="rank-strip hard-shadow">
        {meta.isBest
          ? <span className="rank-best">🎉 개인 신기록! 역대 {meta.rank}위 / {meta.total}판</span>
          : <span className="rank-normal">이번 판 역대 <b>{meta.rank}위</b> / {meta.total}판</span>}
      </div>

      <SupportGraph series={support} total={support.length} />

      {/* 내 역대 기록 TOP 5 (로컬) — Phase 3에서 전역 리더보드로 확장 */}
      {board.length > 1 && (
        <div className="local-board hard-shadow">
          <div className="board-title">내 역대 기록</div>
          {board.map((b, i) => (
            <div key={b.ts} className="board-row">
              <span className="board-rank">{i + 1}</span>
              <span className="board-grade">{b.allClear ? '🏆' : ''}{b.grade}</span>
              <span className="board-years">{b.years}년</span>
              <span className="board-cab">{b.cabinet[0]} 정권</span>
            </div>
          ))}
        </div>
      )}

      <div className="result-cabinet">
        {SLOTS.map((s) => {
          const c = state.slots[s.id]!
          return (
            <div key={s.id} className="result-slot">
              <span>{s.name}</span>
              <b className="result-slot-who"><MiniPortrait c={c} size={22} /> {c.name} {fitScore(s, c)}</b>
            </div>
          )
        })}
      </div>

      <div className="result-actions">
        <button className="btn-primary hard-shadow" onClick={() => dispatch({ type: 'NEW_GAME', seed: newSeed() })}>
          🔄 {r.allClear ? '더 높은 등급 도전' : '다시 도전'}
        </button>
        <button className="btn-secondary" disabled={sharing} onClick={async () => {
          setSharing(true)
          const res = await shareResult(r, state.slots as Record<SlotId, Character>)
          setShareMsg(res === 'shared' ? '공유 완료!' : res === 'downloaded' ? '카드 저장됨 📥' : '실패')
          setSharing(false)
        }}>📸 {sharing ? '생성 중…' : shareMsg || '내각 자랑하기'}</button>
        <button className="btn-secondary" onClick={() => dispatch({ type: 'HOME' })}>홈</button>
      </div>
    </div>
  )
}

// 집권연수 카운트업 — 기본은 최종값(숨김/reduced-motion 안전), 화면 보일 때만 0→N 애니.
function useCountUp(target: number, ms = 700): number {
  const [n, setN] = useState(target)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (document.hidden || reduce) { setN(target); return }
    let raf = 0
    let start = 0
    setN(0)
    const step = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / ms)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3)))) // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return n
}

// 새 판 시드 — 엔트로피 소스로만 Math.random 허용 (게임 로직 아님, CLAUDE.md 규칙 1)
export const newSeed = () => Math.floor(Math.random() * 1e9)
