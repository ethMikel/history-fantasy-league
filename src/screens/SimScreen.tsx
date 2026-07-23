import { useEffect, useState } from 'react'
import { AXIS_LABEL } from '../lib/types'
import type { Action, GameState } from '../game/gameState'

// walking skeleton: 텍스트 로그가 한 줄씩 등장 (지지율 그래프 연출은 Phase 2 juice pass).
export function SimScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const result = state.result!
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (shown >= result.timeline.length) return
    const t = setTimeout(() => setShown((n) => n + 1), 550)
    return () => clearTimeout(t)
  }, [shown, result.timeline.length])

  const done = shown >= result.timeline.length

  return (
    <div className="sim-screen">
      <header className="sim-header">집권 시뮬레이션</header>
      <div className="sim-log">
        {result.timeline.slice(0, shown).map((e, i) => {
          if (e.kind === 'minor') {
            return <div key={i} className="log-line minor">· {e.year}년차 — 소소한 정사 ({e.deltaYears >= 0 ? '+' : ''}{e.deltaYears}년)</div>
          }
          const tone = e.success ? 'ok' : 'fail'
          return (
            <div key={i} className={`log-line crisis ${tone}`}>
              <b>{e.year}년차 · {AXIS_LABEL[e.axis!]} 위기</b> — {e.responder}
              {e.viaFlex ? '(무임소 구원등판)' : ''} {e.success ? '✅ 극복' : '❌ 실패'}
              <span className="log-delta">{e.deltaYears >= 0 ? '+' : ''}{e.deltaYears.toFixed(1)}년</span>
            </div>
          )
        })}
      </div>
      <div className="sim-footer">
        {!done && <button className="btn-skip" onClick={() => setShown(result.timeline.length)}>▶▶ 건너뛰기</button>}
        {done && (
          <button className="btn-primary hard-shadow" onClick={() => dispatch({ type: 'GOTO', screen: 'result' })}>
            결과 보기
          </button>
        )}
      </div>
    </div>
  )
}
