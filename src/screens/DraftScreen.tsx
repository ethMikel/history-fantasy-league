import { useRef } from 'react'
import { createStreams } from '../lib/rng'
import { spin } from '../game/draft'
import { filledCount, isCabinetFull, type Action, type GameState } from '../game/gameState'
import { SLOTS, type SlotId } from '../lib/types'
import { CharCard, CrisisBanner, HiddenCrisisBanner, MiniPortrait, fitScore, bestFit, SLOT_SHORT, scoreBand, RegionEra, SLOT_ROLE, SLOT_TIERS } from '../ui/shared'
import { play } from '../lib/sfx'
import { DiceIcon, PlayIcon } from '../ui/icons'

export function DraftScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  // 세션 pool rng — seed 바뀌면 재생성 (라운드 넘어가도 소비 상태 유지)
  const rngRef = useRef<{ seed: number; rng: ReturnType<typeof createStreams>['pool'] } | null>(null)
  if (!rngRef.current || rngRef.current.seed !== state.seed) {
    rngRef.current = { seed: state.seed, rng: createStreams(state.seed).pool }
  }
  const usedIds = () => new Set(SLOTS.map((s) => state.slots[s.id]?.id).filter(Boolean) as string[])
  const currentEra = () => state.spinLabel?.split(' · ')[1]

  const doSpin = () => {
    play('spin')
    const r = spin(rngRef.current!.rng, usedIds())
    dispatch({ type: 'SPIN', candidates: r.candidates, label: r.label, nearMiss: r.nearMiss })
  }
  const doRespin = (kind: 'all' | 'civ') => {
    play('spin')
    const r = spin(rngRef.current!.rng, usedIds(), kind === 'civ' ? currentEra() : undefined)
    dispatch({ type: 'RESPIN', kind, candidates: r.candidates, label: r.label, nearMiss: r.nearMiss })
  }

  return (
    <div className="draft-screen">
      <header className="draft-header">
        <span className="round-badge">라운드 {filledCount(state) + 1} / {SLOTS.length}</span>
        <span className="draft-title">내각을 구성하라</span>
      </header>

      <section className="crisis-row">
        <div className="crisis-row-label"><b>임기 미션</b> — 이 위기들을 막을 인재를 뽑아 배치하라</div>
        <div className="crisis-list">
          {state.crises.filter((c) => !c.hidden).map((c, i) => <CrisisBanner key={i} crisis={c} />)}
          {state.crises.filter((c) => c.hidden).map((_, i) => <HiddenCrisisBanner key={'h' + i} />)}
        </div>
      </section>

      <div className="draft-body">
        {/* 슬롯판 — 조직도 하이어라키: 대통령 → 총리·특임 → 6부처 (동현 #3) */}
        <section className="slot-board">
          {SLOT_TIERS.map((tier, ti) => (
            <div key={ti} className={`slot-tier slot-tier-${ti}`}>
              {tier.map((sid) => {
                const slot = SLOTS.find((s) => s.id === sid)!
                const occupant = state.slots[slot.id]
                const assignable = state.selected && !occupant
                const pick = state.selected ? state.candidates?.find((c) => c.id === state.selected) : undefined
                const fit = pick && !occupant ? fitScore(slot, pick) : null
                return (
                  <button
                    key={slot.id}
                    className={`slot hard-shadow${slot.id === 'president' ? ' president' : ''}${occupant ? ' filled' : ''}${assignable ? ' assignable' : ''}`}
                    disabled={!assignable}
                    onClick={() => { if (assignable) { play('assign'); dispatch({ type: 'ASSIGN', slot: slot.id as SlotId }) } }}
                  >
                    <span className="slot-head">
                      <span className="slot-name">{slot.name}</span>
                      {!occupant && <span className="slot-role-hint">{SLOT_ROLE[slot.id]}</span>}
                    </span>
                    {occupant ? (
                      <span className="slot-occupant">
                        <MiniPortrait c={occupant} size={slot.id === 'president' ? 40 : 26} />
                        <span className="slot-occ-name">{occupant.name}</span>
                        <b className="slot-fit-num" data-band={scoreBand(fitScore(slot, occupant))}>{fitScore(slot, occupant)}</b>
                      </span>
                    ) : fit !== null ? (
                      <span className="slot-fit">
                        <span className="slot-fit-num" data-band={scoreBand(fit)}>{fit}</span>
                        <span className="slot-fit-hint">임명 시</span>
                      </span>
                    ) : (
                      <span className="slot-empty">비어 있음</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </section>

        {/* 스핀/후보 영역 */}
        <section className="spin-area">
          {!state.candidates ? (
            <div className="spin-cta">
              {isCabinetFull(state) ? (
                <button className="btn-primary hard-shadow" onClick={() => dispatch({ type: 'START_SIM' })}>
                  <PlayIcon /> 집권 시작
                </button>
              ) : (
                <>
                  <button className="btn-spin hard-shadow" onClick={doSpin}><DiceIcon /> 스핀</button>
                  <p className="spin-explain">
                    랜덤 <b>지역 × 시대</b> 칸이 열립니다.<br />그 칸의 인물이 후보로 나와요.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="cell-banner">
                <span className="cell-tag">이번 칸</span>
                {(() => { const [civ, era] = (state.spinLabel ?? '').split(' · '); return <RegionEra civ={civ ?? ''} era={era ?? ''} /> })()}
                <span className="cell-sub">이 지역·시대 인물 중 1명을 임명</span>
              </div>
              {state.nearMiss && (() => {
                const bf = bestFit(state.nearMiss)
                return (
                  <div className="near-miss-chip" key={state.nearMiss.id}>
                    <MiniPortrait c={state.nearMiss} size={30} />
                    <span className="nm-text">
                      아깝다! 이 시대엔 <b>{state.nearMiss.name}</b> ({SLOT_SHORT[bf.slot.id]}적성 {bf.score})도 있었다
                      <span className="nm-hint">— 리스핀으로 노려볼 수도</span>
                    </span>
                  </div>
                )
              })()}
              <div className="candidate-list">
                {state.candidates.map((c) => (
                  <CharCard
                    key={c.id}
                    c={c}
                    selected={state.selected === c.id}
                    onClick={() => { play('select'); dispatch({ type: 'SELECT', id: c.id }) }}
                  />
                ))}
              </div>
              <div className="respin-caption">마음에 안 들면 칸을 다시 뽑기 (횟수 제한)</div>
              <div className="respin-row">
                <button className="btn-respin" disabled={state.respinAll <= 0} onClick={() => doRespin('all')}
                        title="지역·시대 모두 다시 뽑기">
                  <DiceIcon /> 다른 칸 <em>({state.respinAll})</em>
                </button>
                <button className="btn-respin" disabled={state.respinCiv <= 0} onClick={() => doRespin('civ')}
                        title="시대는 그대로, 지역만 다시 뽑기">
                  <DiceIcon /> 지역만 <em>({state.respinCiv})</em>
                </button>
              </div>
              <p className="hint">{state.selected ? '↑ 임명할 부처를 고르세요' : '후보를 눌러 선택 · 임명하면 다음 칸으로'}</p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
