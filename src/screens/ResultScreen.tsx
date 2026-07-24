import { useState, useEffect, useMemo } from 'react'
import { BALANCE as B } from '../lib/balance'
import { SLOTS, type Character, type SlotId } from '../lib/types'
import { MiniPortrait, fitScore, SupportGraph } from '../ui/shared'
import { nextGoal } from '../lib/simulate'
import { play } from '../lib/sfx'
import { record, updateNick, leaderboard, rankOf } from '../game/localScores'
import { shareResult } from '../game/shareCard'
import { CrownIcon, RetryIcon, CameraIcon } from '../ui/icons'
import type { Action, GameState } from '../game/gameState'

const GRADE_COLOR: Record<string, string> = {
  S: 'var(--gold-400)', A: 'var(--stat-diplomacy)', B: 'var(--stat-domestic)', C: 'var(--paper-300)', D: 'var(--paper-100)',
}

export function ResultScreen({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const r = state.result!
  const support = [B.SUPPORT_START, ...r.timeline.map((e) => e.supportAfter)]

  // 이번 판을 로컬 기록에 저장 (마운트 시 1회) → 명예의 전당 등재
  const [meta] = useState(() => record({
    seed: state.seed, years: r.years, grade: r.grade, cleared: r.cleared, allClear: r.allClear,
    cabinet: SLOTS.map((s) => state.slots[s.id]!.name),
  }))
  const [nick, setNick] = useState('') // 아케이드 이름 입력
  const board = useMemo(() => leaderboard(10), [nick]) // 닉 변경 시 재계산(저장 후)
  const myRank = useMemo(() => rankOf(meta.ts), [meta.ts])
  const [sharing, setSharing] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const goal = nextGoal(r) // 목표구배/near-miss — "한 끗" 근접치로 재도전 유도
  const shownYears = useCountUp(r.years) // 집권연수 카운트업 (juice)
  useEffect(() => { play(r.allClear ? 'win' : 'lose') }, [r.allClear]) // 결과 진입 효과음

  // 담당자 이름 → 캐릭터(초상) 매핑 + 정권 요약(구국공신/역적) — 동현 #2/사진9 "누가 활약/어떤 일로 끝났나"
  const byName = useMemo(() => {
    const m: Record<string, Character> = {}
    for (const s of SLOTS) { const c = state.slots[s.id]; if (c) m[c.name] = c }
    return m
  }, [state.slots])
  const recap = useMemo(() => {
    const cr = r.timeline.filter((e) => e.kind === 'crisis')
    const ok = cr.filter((e) => e.success).sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))
    const bad = cr.filter((e) => !e.success).sort((a, b) => (a.margin ?? 0) - (b.margin ?? 0))
    return { mvp: ok[0], goat: bad[0] }
  }, [r])

  return (
    <div className="result-screen">
      {/* 우승 여부 = 1차 목표 (retry 동기) */}
      <div className={`result-verdict hard-shadow gilt ${r.allClear ? 'win' : 'lose'}`}>
        {r.allClear ? (
          <>
            <span className="win-crown"><CrownIcon /></span>
            <span className="win-title">완전 집권</span>
            <span className="verdict-sub">위기 {r.crises.length}개 전부 극복 — 명예의 전당 등재 자격</span>
          </>
        ) : (
          <>
            <span className="verdict-label">위기 {r.cleared} / {r.crises.length} 극복</span>
            <span className="lose-title">정권 교체</span>
            <span className="verdict-sub">{r.crises.length}개를 모두 막아야 완전 집권이다. 다시 도전하라.</span>
          </>
        )}
        <div className="result-metrics">
          <span className="grade-badge" style={{ color: GRADE_COLOR[r.grade], borderColor: GRADE_COLOR[r.grade] }}>{r.grade}</span>
          <span className="years-metric"><b>{shownYears}</b>년 집권</span>
        </div>
      </div>

      {/* 목표구배/near-miss — 다음 목표까지 "한 끗" (재도전 압력) */}
      {goal && <div className={`near-miss hard-shadow${goal.hot ? ' hot' : ''}`}>{goal.text}</div>}

      {/* 명예의 전당 순위 + 신기록 — retry 훅 */}
      <div className="rank-strip hard-shadow">
        {meta.isBest
          ? <span className="rank-best">🎉 개인 신기록! 명예의 전당 {myRank.rank}위 / {myRank.total}</span>
          : <span className="rank-normal">명예의 전당 <b>{myRank.rank}위</b> / {myRank.total}</span>}
      </div>

      <SupportGraph series={support} total={support.length} />

      {/* 정권 요약 — 누가 활약/책임, 어떤 일로 끝났나 (스크롤 없이 결말 파악) */}
      {(recap.mvp || recap.goat) && (
        <div className="reign-recap hard-shadow gilt">
          <div className="recap-title">정권 요약</div>
          {recap.mvp && (
            <div className="recap-row">
              {byName[recap.mvp.responder!] && <MiniPortrait c={byName[recap.mvp.responder!]} size={26} />}
              <span className="recap-tag mvp">구국공신</span>
              <span className="recap-text"><b>{recap.mvp.responder}</b> — “{recap.mvp.title}” 저지 <em className="up">+{Math.round(recap.mvp.deltaYears)}년</em></span>
            </div>
          )}
          {recap.goat && (
            <div className="recap-row">
              {byName[recap.goat.responder!] && <MiniPortrait c={byName[recap.goat.responder!]} size={26} />}
              <span className="recap-tag goat">역적</span>
              <span className="recap-text"><b>{recap.goat.responder}</b> — “{recap.goat.title}” 실패 <em className="down">{Math.round(recap.goat.deltaYears)}년</em></span>
            </div>
          )}
          <div className="recap-line">위기 {r.cleared}/{r.crises.length} 저지 · 집권 {r.years}년으로 마감</div>
        </div>
      )}

      {/* 명예의 전당 — 시드 고득점 + 내 기록 병합 (오락실 리더보드) */}
      <div className="hall-of-fame hard-shadow gilt">
        <div className="hof-title">명예의 전당</div>
        <label className="hof-nick-row">
          <span className="hof-nick-label">이름을 남겨라</span>
          <input className="hof-nick-input" value={nick} maxLength={12} placeholder="무명의 지도자"
                 onChange={(e) => { const v = e.target.value; updateNick(meta.ts, v); setNick(v) }} />
        </label>
        {board.map((b, i) => {
          const me = b.isMine && b.ts === meta.ts
          return (
            <div key={(b.seeded ? 's' : 'm') + i} className={`hof-row${me ? ' me' : ''}`}>
              <span className="hof-rank" data-medal={i < 3 ? i + 1 : undefined}>{i + 1}</span>
              <span className="hof-grade" data-g={b.grade}>{b.grade}</span>
              <span className="hof-nick">{me ? (nick || '무명의 지도자') : (b.nick || '무명')}</span>
              <span className="hof-cab" title={b.cabinet.join(' · ')}>
                {b.cabinet.slice(0, 4).join(' · ')}{b.cabinet.length > 4 ? ` +${b.cabinet.length - 4}` : ''}
              </span>
              <span className="hof-years">{b.years}년</span>
            </div>
          )
        })}
        {myRank.rank > 10 && (
          <div className="hof-myrank">⋯ 너의 순위 <b>{myRank.rank}</b> / {myRank.total}</div>
        )}
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
          <RetryIcon /> {r.allClear ? '더 높은 등급 도전' : '다시 도전'}
        </button>
        <button className="btn-secondary" disabled={sharing} onClick={async () => {
          setSharing(true)
          const res = await shareResult(r, state.slots as Record<SlotId, Character>)
          setShareMsg(res === 'shared' ? '공유 완료!' : res === 'downloaded' ? '카드 저장됨 📥' : '실패')
          setSharing(false)
        }}><CameraIcon /> {sharing ? '생성 중…' : shareMsg || '내각 자랑하기'}</button>
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
