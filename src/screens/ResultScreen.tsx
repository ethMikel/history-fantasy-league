import { BALANCE as B } from '../lib/balance'
import { SLOTS } from '../lib/types'
import { MiniPortrait, fitScore } from '../ui/shared'
import type { Action, GameState } from '../game/gameState'

// walking skeleton: 지지율 스파크라인(SVG) + 집권 연수. 정식 국정 그래프 연출은 Phase 2.
export function ResultScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const r = state.result!
  const support = [B.SUPPORT_START, ...r.timeline.map((e) => e.supportAfter)]
  const path = support.map((s, i) => `${(i / (support.length - 1)) * 100},${100 - s}`).join(' ')
  const crises = r.timeline.filter((e) => e.kind === 'crisis')
  const cleared = crises.filter((e) => e.success).length

  return (
    <div className="result-screen">
      <div className="result-verdict hard-shadow">
        <span className="verdict-label">우리 정권은</span>
        <span className="verdict-years">{r.years}년</span>
        <span className="verdict-sub">집권했다 · 위기 {cleared}/{crises.length} 극복</span>
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
          🔄 다시 하기
        </button>
        <button className="btn-secondary" onClick={() => dispatch({ type: 'HOME' })}>홈</button>
      </div>
    </div>
  )
}

// 새 판 시드 — 엔트로피 소스로만 Math.random 허용 (게임 로직 아님, CLAUDE.md 규칙 1)
export const newSeed = () => Math.floor(Math.random() * 1e9)
