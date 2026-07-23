import { useRef } from 'react'
import { createStreams } from '../lib/rng'
import { spin } from '../game/draft'
import { filledCount, isCabinetFull, type Action, type GameState } from '../game/gameState'
import { SLOTS, type SlotId } from '../lib/types'
import { CharCard, CrisisBanner, ovr } from '../ui/shared'

export function DraftScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  // 세션 pool rng — seed 바뀌면 재생성 (라운드 넘어가도 소비 상태 유지)
  const rngRef = useRef<{ seed: number; rng: ReturnType<typeof createStreams>['pool'] } | null>(null)
  if (!rngRef.current || rngRef.current.seed !== state.seed) {
    rngRef.current = { seed: state.seed, rng: createStreams(state.seed).pool }
  }
  const usedIds = () => new Set(SLOTS.map((s) => state.slots[s.id]?.id).filter(Boolean) as string[])
  const currentEra = () => state.spinLabel?.split(' · ')[1]

  const doSpin = () => {
    const r = spin(rngRef.current!.rng, usedIds())
    dispatch({ type: 'SPIN', candidates: r.candidates, label: r.label })
  }
  const doRespin = (kind: 'all' | 'civ') => {
    const r = spin(rngRef.current!.rng, usedIds(), kind === 'civ' ? currentEra() : undefined)
    dispatch({ type: 'RESPIN', kind, candidates: r.candidates, label: r.label })
  }

  return (
    <div className="draft-screen">
      <header className="draft-header">
        <span className="round-badge">라운드 {filledCount(state) + 1} / {SLOTS.length}</span>
        <span className="draft-title">내각을 구성하라</span>
      </header>

      <section className="crisis-row">
        <div className="crisis-row-label">이번 정권에 닥칠 위기</div>
        <div className="crisis-list">
          {state.crises.map((c, i) => <CrisisBanner key={i} crisis={c} idx={i} />)}
        </div>
      </section>

      <div className="draft-body">
        {/* 슬롯판 */}
        <section className="slot-board">
          {SLOTS.map((slot) => {
            const occupant = state.slots[slot.id]
            const assignable = state.selected && !occupant
            return (
              <button
                key={slot.id}
                className={`slot hard-shadow${occupant ? ' filled' : ''}${assignable ? ' assignable' : ''}`}
                disabled={!assignable}
                onClick={() => assignable && dispatch({ type: 'ASSIGN', slot: slot.id as SlotId })}
              >
                <span className="slot-name">{slot.name}</span>
                {occupant ? (
                  <span className="slot-occupant">{occupant.name} <b>{ovr(occupant)}</b></span>
                ) : (
                  <span className="slot-empty">{assignable ? '여기 임명' : '비어 있음'}</span>
                )}
              </button>
            )
          })}
        </section>

        {/* 스핀/후보 영역 */}
        <section className="spin-area">
          {!state.candidates ? (
            <div className="spin-cta">
              {isCabinetFull(state) ? (
                <button className="btn-primary hard-shadow" onClick={() => dispatch({ type: 'START_SIM' })}>
                  ▶ 집권 시작
                </button>
              ) : (
                <button className="btn-spin hard-shadow" onClick={doSpin}>🎲 스핀</button>
              )}
            </div>
          ) : (
            <>
              <div className="spin-label">{state.spinLabel}</div>
              <div className="candidate-list">
                {state.candidates.map((c) => (
                  <CharCard
                    key={c.id}
                    c={c}
                    selected={state.selected === c.id}
                    onClick={() => dispatch({ type: 'SELECT', id: c.id })}
                  />
                ))}
              </div>
              <div className="respin-row">
                <button className="btn-respin" disabled={state.respinAll <= 0} onClick={() => doRespin('all')}>
                  🔄 전체 리스핀 ({state.respinAll})
                </button>
                <button className="btn-respin" disabled={state.respinCiv <= 0} onClick={() => doRespin('civ')}>
                  🔁 문명만 리스핀 ({state.respinCiv})
                </button>
              </div>
              <p className="hint">{state.selected ? '↑ 임명할 부처를 고르세요' : '후보를 눌러 선택'}</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
