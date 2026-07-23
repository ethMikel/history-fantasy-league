import { BALANCE as B } from '../lib/balance'
import { SLOTS } from '../lib/types'
import { MiniPortrait, fitScore } from '../ui/shared'
import type { Action, GameState } from '../game/gameState'

const GRADE_COLOR: Record<string, string> = {
  S: 'var(--gold-400)', A: 'var(--stat-diplomacy)', B: 'var(--stat-domestic)', C: 'var(--paper-300)', D: 'var(--paper-100)',
}

export function ResultScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const r = state.result!
  const support = [B.SUPPORT_START, ...r.timeline.map((e) => e.supportAfter)]
  const path = support.map((s, i) => `${(i / (support.length - 1)) * 100},${100 - s}`).join(' ')

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
          <span className="years-metric"><b>{r.years}</b>년 집권</span>
        </div>
      </div>

      <div className="support-graph hard-shadow">
        <div className="graph-title">국정 지지율 추이</div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="graph-svg">
          <polyline points={path} fill="none" stroke="var(--accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

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
        <button className="btn-secondary" disabled title="Phase 3 예정">🏅 랭킹 (준비 중)</button>
        <button className="btn-secondary" onClick={() => dispatch({ type: 'HOME' })}>홈</button>
      </div>
    </div>
  )
}

// 새 판 시드 — 엔트로피 소스로만 Math.random 허용 (게임 로직 아님, CLAUDE.md 규칙 1)
export const newSeed = () => Math.floor(Math.random() * 1e9)
