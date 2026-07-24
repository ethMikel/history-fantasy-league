// 공용 표시 컴포넌트 — 기능 컬러(축=색), 픽셀 톤 (08_REFERENCE_STUDY §2)
import { Fragment } from 'react'
import { AXES, AXIS_LABEL, SLOTS, type Axis, type Character, type Crisis, type Difficulty, type SlotDef, type SlotId, type Tier } from '../lib/types'
import { leadershipIndex, slotScore, signatureAxis } from '../lib/simulate'
import { crisisProgress } from '../lib/progress'
import { cardBlurb } from '../lib/blurb'
import { BoltIcon, CheckIcon, CrossIcon, BustIcon, eraRange } from './icons'

// 지역 · 시대 [연도범위] — 아이콘 없이 텍스트 + 명확한 연도 배지 (동현: 대륙 실루엣 안 읽힘 → 단순화)
export function RegionEra({ civ, era, compact }: { civ: string; era: string; compact?: boolean }) {
  const range = eraRange(era)
  return (
    <span className={`region-era${compact ? ' compact' : ''}`}>
      <span className="re-civ">{civ}</span>
      {era && (
        <>
          <span className="re-era">· {era}</span>
          {range && <span className="re-range">{range}</span>}
        </>
      )}
    </span>
  )
}

export const ovr = (c: Character) => Math.round(AXES.reduce((s, a) => s + c.stats[a], 0) / 6)

// 능력치 값 밴드 (파워 히트맵) — 적성 점수를 40/50/60/70/80대별 색으로 한눈에 (동현 #3)
export const scoreBand = (v: number) => v >= 80 ? 'b80' : v >= 70 ? 'b70' : v >= 60 ? 'b60' : v >= 50 ? 'b50' : v >= 40 ? 'b40' : 'b0'

// 슬롯 짧은 라벨 (카드 적성 표기용)
export const SLOT_SHORT: Record<SlotId, string> = {
  president: '대통령', pm: '총리', defense: '국방', security: '안보',
  foreign: '외교', science: '과학', culture: '문화', flex: '만능',
}

// 슬롯 역할 힌트 (동현 #3: "무슨 능력 보고 뽑나"). 국방=무력/안보=지략 구분 명시.
export const SLOT_ROLE: Record<SlotId, string> = {
  president: '내각 전체 배수',
  pm: '내정 · 살림/행정',
  defense: '무력 · 전쟁/반란',
  security: '지략 · 음모/첩보',
  foreign: '외교 · 협상/동맹',
  science: '과학 · 기술/재난',
  culture: '문화 · 사상/예술',
  flex: '만능 · 어느 위기든',
}

// 슬롯 계층 (동현 #3: 대통령 → 총리·특임 → 6부처). 조직도 하이어라키 렌더용.
export const SLOT_TIERS: SlotId[][] = [
  ['president'],
  ['pm', 'flex'],
  ['defense', 'security', 'foreign', 'science', 'culture'],
]

// 슬롯별 표시 점수: 대통령=통솔지수, 장관=slotScore (04_FORMULA "같은 인물, 슬롯별 다른 가치")
export function fitScore(slot: SlotDef, c: Character): number {
  return Math.round(slot.id === 'president' ? leadershipIndex(c) : slotScore(slot, c))
}

// 카드 얼굴 = 베스트 슬롯 기준 점수 + 본직 라벨 (FIFA "본직 OVR" 문법)
export function bestFit(c: Character): { slot: SlotDef; score: number } {
  return topSlotFits(c, 1)[0]
}

// 멀티슬롯 적성 — 한 인물이 여러 자리에 얼마나 맞는지 (동현 #3-A: 배치가 "선택"이 되게).
// 만능석 제외, 적성 내림차순 top n. bestFit도 이걸 재사용.
export function topSlotFits(c: Character, n = 3): { slot: SlotDef; score: number }[] {
  return SLOTS.filter((s) => s.id !== 'flex')
    .map((s) => ({ slot: s, score: fitScore(s, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

export const AXIS_VAR: Record<Axis, string> = {
  mil: 'var(--stat-military)', str: 'var(--stat-strategy)', dom: 'var(--stat-domestic)',
  dip: 'var(--stat-diplomacy)', sci: 'var(--stat-science)', cul: 'var(--stat-culture)',
}
const TIER_COLOR: Record<Tier, string> = {
  legend: 'var(--gold-400)', great: '#c9c9d6', capable: '#c08457', common: 'var(--ink-500)',
}
// 게임 rarity 문법 (동현 #5: '명신/범재' 불명확 → 가챠 표준어). 색은 gold/은/동/회색과 병행.
const TIER_LABEL: Record<Tier, string> = { legend: '전설', great: '영웅', capable: '희귀', common: '일반' }

export function StatBar({ axis, value }: { axis: Axis; value: number }) {
  return (
    <div className="statbar" title={`${AXIS_LABEL[axis]} ${value}`}>
      <span className="statbar-label" style={{ color: AXIS_VAR[axis] }}>{AXIS_LABEL[axis]}</span>
      <span className="statbar-track">
        <span className="statbar-fill" style={{ width: `${value}%`, background: AXIS_VAR[axis] }} />
      </span>
      <span className="statbar-val">{value}</span>
    </div>
  )
}

// 초상 경로: public/portraits/<id>.png → base 경로 반영
export const portraitUrl = (id: string) => `${import.meta.env.BASE_URL}portraits/${id}.png`

// 소형 초상 (슬롯판·결과 화면용)
export function MiniPortrait({ c, size = 32 }: { c: Character; size?: number }) {
  return c.portrait ? (
    <img className="mini-portrait pixelated" src={portraitUrl(c.portrait)} alt={c.name}
         style={{ width: size, height: size }}
         onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
  ) : (
    <span className="mini-portrait mini-portrait-blank" style={{ width: size, height: size }}><BustIcon /></span>
  )
}

export function CharCard({ c, selected, onClick, compact }: {
  c: Character; selected?: boolean; onClick?: () => void; compact?: boolean
}) {
  const fit = bestFit(c) // 본직 적성 + 그 기준 점수 (평균이 아님 — "국방감 92" 문법)
  const sig = signatureAxis(c) // 전설/명신 시그니처 축 (희귀도 특성) — 없으면 null
  return (
    <button
      className={`char-card hard-shadow${selected ? ' selected' : ''}`}
      onClick={onClick}
      style={{ borderColor: TIER_COLOR[c.tier] }}
    >
      <div className="char-head">
        {c.portrait ? (
          <img className="char-portrait pixelated" src={portraitUrl(c.portrait)} alt={c.name}
               onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <span className="char-portrait char-portrait-blank"><BustIcon /></span>
        )}
        <span className="char-name">{c.name}</span>
        <span className="char-fit">
          <b className="char-fit-score" data-band={scoreBand(fit.score)}>{fit.score}</b>
          <span className="char-fit-label">{SLOT_SHORT[fit.slot.id]}적성</span>
        </span>
      </div>
      <div className="char-meta">
        <span className="char-tier">{TIER_LABEL[c.tier]}</span>
        <RegionEra civ={c.civ} era={c.era} compact />
        {sig && <span className="char-trait" title="이 축의 위기를 이 인물이 맡으면 판정 보너스"><BoltIcon /><b style={{ color: AXIS_VAR[sig] }}>{AXIS_LABEL[sig]}</b> 위기에 강함</span>}
      </div>
      {cardBlurb(c) && <div className="char-blurb">{cardBlurb(c)}</div>}
      {!compact && (
        <>
          <div className="fit-slots" title="이 인물이 어느 자리에 얼마나 맞는지 — 배치를 고민해보세요">
            <span className="fs-label">자리별 적성</span>
            {topSlotFits(c, 3).map(({ slot, score }) => (
              <span className="fs-item" key={slot.id}>
                <span className="fs-name">{SLOT_SHORT[slot.id]}</span>
                <b data-band={scoreBand(score)}>{score}</b>
              </span>
            ))}
          </div>
          <div className="char-stats">
            {AXES.map((a) => <StatBar key={a} axis={a} value={c.stats[a]} />)}
          </div>
        </>
      )}
    </button>
  )
}

// 구체적 이벤트명(헤드라인) + 서술형 예고(증상). 축 색은 왼쪽 보더로만 힌트 (처방 은닉 원칙)
export function CrisisBanner({ crisis }: { crisis: Crisis }) {
  return (
    <div className="crisis-chip hard-shadow gilt" style={{ borderColor: AXIS_VAR[crisis.axis] }}>
      <div className="crisis-top">
        <span className="crisis-name">{crisis.title}</span>
        <span className="crisis-when">{crisis.year}년차</span>
      </div>
      <p className="crisis-omen">{crisis.omen}</p>
    </div>
  )
}

// 히든 위기 = 같은 프레임의 "?" 카드 (동현 #2: 별도 노트 말고 인라인 물음표 스퀘어로)
export function HiddenCrisisBanner() {
  return (
    <div className="crisis-chip crisis-hidden hard-shadow gilt">
      <div className="crisis-top">
        <span className="crisis-icon"><b className="crisis-q">?</b></span>
        <span className="crisis-name">예상치 못한 위기</span>
      </div>
      <p className="crisis-omen">예고 없이 임기 중 터진다 — 대비할 수 없다</p>
    </div>
  )
}

// 국운 그래프 — 시뮬 중엔 series가 자라며 오른쪽으로 그려지고(관전의 서사), 결과에선 전체.
// series=[시작지지율, ...누적 supportAfter], total=전체 포인트 수(x축 고정 → 자라는 효과).
export function SupportGraph({ series, total }: { series: number[]; total: number }) {
  const n = Math.max(total, 2)
  const X = (i: number) => (i / (n - 1)) * 100
  const pts = series.map((s, i) => `${X(i)},${100 - s}`).join(' ')
  const cur = series.length ? Math.round(series[series.length - 1]) : 0
  const prev = series.length > 1 ? Math.round(series[series.length - 2]) : cur
  const start = series.length ? series[0] : 55 // 시작 지지율 = 기준선
  const rising = cur >= prev
  const lastX = series.length ? X(series.length - 1) : 0
  const lastY = 100 - cur
  const zone = cur >= start ? 'up' : cur >= 25 ? 'mid' : 'down' // 안정 / 흔들림 / 위태
  const danger = series.length > 1 && cur < 25 // 붕괴 임박 = 크래시 긴장
  const area = series.length > 1 ? `0,100 ${pts} ${lastX},100` : '' // 선 아래 면적(구간색 무드)
  return (
    <div className={`support-graph hard-shadow gilt zone-${zone}${danger ? ' danger' : ''}`}>
      <div className="graph-head">
        <span className="graph-title">국운 그래프</span>
        <span className="graph-cur">{danger && <span className="graph-warn">위태</span>}{cur}</span>
      </div>
      <div className="graph-body">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="graph-svg">
          {/* 기준선: 위=안정, 아래=위태 (오를까 떨어질까 긴장의 기준) */}
          <line x1="0" y1={100 - start} x2="100" y2={100 - start} className="graph-baseline" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          {area && <polygon points={area} className="graph-area" />}
          {series.length > 0 && <line x1={lastX} y1={lastY} x2={lastX} y2="100" className="graph-tracer" vectorEffect="non-scaling-stroke" />}
          <polyline points={pts} fill="none" className="graph-line" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        {series.length > 0 && <span className={`graph-marker ${rising ? 'rise' : 'fall'}`} style={{ left: `${lastX}%`, top: `${lastY}%` }} />}
      </div>
    </div>
  )
}

const DIFF_LABEL: Record<Difficulty, string> = { low: '하', mid: '중', high: '상' }

// 목표구배 진행바 (Kivetz) — 위기 3개 저지 현황을 라이브로. "2/3 저지! 마지막 하나"로
// 결승 직전 몰입·재도전 압력 급증. outcomes[i]=null(대기)/true(저지)/false(실패), crises와 정렬.
export function CrisisTracker({ crises, outcomes }: { crises: Crisis[]; outcomes: (boolean | null)[] }) {
  const total = crises.length
  const { headline, hot } = crisisProgress(total, outcomes)
  return (
    <div className={`crisis-tracker${hot ? ' hot' : ''}`}>
      <div className="tracker-head">{headline}</div>
      <div className="tracker-nodes">
        {crises.map((c, i) => {
          const o = outcomes[i]
          const state = o === null ? 'pending' : o ? 'cleared' : 'failed'
          const concealed = o === null && c.hidden // 히든 미발생 = 축·난이도 은닉
          return (
            <Fragment key={i}>
              <div className="tracker-node hard-shadow" data-state={state} data-hidden={concealed}
                   style={{ borderColor: concealed ? 'var(--ink-500)' : AXIS_VAR[c.axis] }}>
                <span className="tracker-icon" style={{ color: o === null ? (concealed ? 'var(--text-dim)' : AXIS_VAR[c.axis]) : o ? 'var(--green-400)' : 'var(--red-400)' }}>
                  {o === null ? (concealed ? <b className="tracker-q">?</b> : <b className="tracker-dlabel">{DIFF_LABEL[c.difficulty]}</b>) : o ? <CheckIcon /> : <CrossIcon />}
                </span>
              </div>
              {i < total - 1 && <div className="tracker-link" data-on={outcomes[i] === true} />}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
