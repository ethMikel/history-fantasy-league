import { useEffect, useMemo, useState } from 'react'
import { AXIS_LABEL, SLOTS, type SlotId } from '../lib/types'
import { pickVerdict, FLEX_HERO, MVP_LABEL, GOAT_LABEL } from '../data/verdicts'
import { MiniPortrait, CrisisTracker } from '../ui/shared'
import type { Action, GameState } from '../game/gameState'

// 관전의 서사: 위기 판정을 밈 코멘트 + 담당자 초상 + 구국공신/역적 라벨로 (11_CRISIS_NARRATIVE)
export function SimScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const result = state.result!
  const [shown, setShown] = useState(0)

  // 담당자 이름 → 캐릭터(초상용) 매핑
  const byName = useMemo(() => {
    const m: Record<string, (typeof state.slots)[SlotId]> = {}
    for (const s of SLOTS) { const c = state.slots[s.id]; if (c) m[c.name] = c }
    return m
  }, [state.slots])

  // 구국공신(최고 마진 성공) / 역적(최악 실패) 1명씩
  const { mvp, goat } = useMemo(() => {
    const cr = result.timeline.filter((e) => e.kind === 'crisis')
    const ok = cr.filter((e) => e.success).sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))
    const bad = cr.filter((e) => !e.success).sort((a, b) => (a.margin ?? 0) - (b.margin ?? 0))
    return { mvp: ok[0]?.responder, goat: bad[0]?.responder }
  }, [result])

  useEffect(() => {
    if (shown >= result.timeline.length) return
    const t = setTimeout(() => setShown((n) => n + 1), 900)
    return () => clearTimeout(t)
  }, [shown, result.timeline.length])

  const done = shown >= result.timeline.length

  // 목표구배: 지금까지 드러난 위기 판정만 반영 (crisis 이벤트는 result.crises와 같은 연차순)
  const shownCrises = result.timeline.slice(0, shown).filter((e) => e.kind === 'crisis')
  const outcomes = result.crises.map((_, i) => (i < shownCrises.length ? shownCrises[i].success! : null))

  return (
    <div className="sim-screen">
      <header className="sim-header">집권 실록</header>
      <CrisisTracker crises={result.crises} outcomes={outcomes} />
      <div className="sim-log">
        {result.timeline.slice(0, shown).map((e, i) => {
          if (e.kind === 'minor') {
            return <div key={i} className="log-line minor">· {e.year}년차 — 소소한 정사 ({e.deltaYears >= 0 ? '+' : ''}{e.deltaYears}년)</div>
          }
          const who = e.responder!
          const c = byName[who]
          const verdict = pickVerdict(e.axis!, e.success!, who, e.title ?? '', e.year)
          const badge = who === mvp && e.success ? MVP_LABEL : who === goat && !e.success ? GOAT_LABEL : null
          return (
            <div key={i} className={`log-line crisis ${e.success ? 'ok' : 'fail'}`}>
              <div className="log-head">
                <span className="log-year">{e.year}년차</span>
                <span className="log-crisis-name">{e.title}</span>
                <span className="log-axis" data-axis={e.axis}>{AXIS_LABEL[e.axis!]}</span>
                {e.traitFired && <span className="log-trait" title="담당자 시그니처 발동">⚡</span>}
                <span className="log-delta">{e.deltaYears >= 0 ? '+' : ''}{e.deltaYears.toFixed(0)}년</span>
              </div>
              <div className="log-verdict">
                {c && <MiniPortrait c={c} size={28} />}
                <span className="log-text">
                  {e.viaFlex && e.success ? FLEX_HERO : ''}{verdict}
                  {badge && <b className="log-badge">{badge}</b>}
                </span>
              </div>
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
