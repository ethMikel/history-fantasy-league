// 공용 표시 컴포넌트 — 기능 컬러(축=색), 픽셀 톤 (08_REFERENCE_STUDY §2)
import { AXES, AXIS_LABEL, SLOTS, type Axis, type Character, type Crisis, type SlotDef, type SlotId, type Tier } from '../lib/types'
import { leadershipIndex, slotScore } from '../lib/simulate'

export const ovr = (c: Character) => Math.round(AXES.reduce((s, a) => s + c.stats[a], 0) / 6)

// 슬롯 짧은 라벨 (카드 적성 표기용)
export const SLOT_SHORT: Record<SlotId, string> = {
  president: '대통령', pm: '총리', defense: '국방', security: '안보',
  foreign: '외교', science: '과학', culture: '문화', flex: '만능',
}

// 슬롯별 표시 점수: 대통령=통솔지수, 장관=slotScore (04_FORMULA "같은 인물, 슬롯별 다른 가치")
export function fitScore(slot: SlotDef, c: Character): number {
  return Math.round(slot.id === 'president' ? leadershipIndex(c) : slotScore(slot, c))
}

// 카드 얼굴 = 베스트 슬롯 기준 점수 + 본직 라벨 (FIFA "본직 OVR" 문법)
export function bestFit(c: Character): { slot: SlotDef; score: number } {
  let best = { slot: SLOTS[0], score: -1 }
  for (const s of SLOTS) {
    if (s.id === 'flex') continue // 만능석은 본직이 아님
    const v = fitScore(s, c)
    if (v > best.score) best = { slot: s, score: v }
  }
  return best
}

export const AXIS_VAR: Record<Axis, string> = {
  mil: 'var(--stat-military)', str: 'var(--stat-strategy)', dom: 'var(--stat-domestic)',
  dip: 'var(--stat-diplomacy)', sci: 'var(--stat-science)', cul: 'var(--stat-culture)',
}
const TIER_COLOR: Record<Tier, string> = {
  legend: 'var(--gold-400)', great: '#c9c9d6', capable: '#c08457', common: 'var(--ink-500)',
}
const TIER_LABEL: Record<Tier, string> = { legend: '전설', great: '명신', capable: '능신', common: '범재' }

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
    <span className="mini-portrait mini-portrait-blank" style={{ width: size, height: size }}>{c.name[0]}</span>
  )
}

export function CharCard({ c, selected, onClick, compact }: {
  c: Character; selected?: boolean; onClick?: () => void; compact?: boolean
}) {
  const fit = bestFit(c) // 본직 적성 + 그 기준 점수 (평균이 아님 — "국방감 92" 문법)
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
          <span className="char-portrait char-portrait-blank">{c.name[0]}</span>
        )}
        <span className="char-name">{c.name}</span>
        <span className="char-fit">
          <b className="char-fit-score" style={{ color: TIER_COLOR[c.tier] }}>{fit.score}</b>
          <span className="char-fit-label">{SLOT_SHORT[fit.slot.id]}적성</span>
        </span>
      </div>
      <div className="char-meta">{TIER_LABEL[c.tier]} · {c.civ} · {c.era}</div>
      {!compact && (
        <div className="char-stats">
          {AXES.map((a) => <StatBar key={a} axis={a} value={c.stats[a]} />)}
        </div>
      )}
    </button>
  )
}

const CRISIS_ICON: Record<Axis, string> = {
  mil: '⚔️', str: '🎯', dom: '🏛️', dip: '🕊️', sci: '🔬', cul: '🎭',
}
// 구체적 이벤트명(헤드라인) + 서술형 예고(증상). 축 색은 왼쪽 보더로만 힌트 (처방 은닉 원칙)
export function CrisisBanner({ crisis }: { crisis: Crisis }) {
  return (
    <div className="crisis-chip hard-shadow" style={{ borderColor: AXIS_VAR[crisis.axis] }}>
      <div className="crisis-top">
        <span className="crisis-icon">{CRISIS_ICON[crisis.axis]}</span>
        <span className="crisis-name">{crisis.title}</span>
        <span className="crisis-when">{crisis.year}년차</span>
      </div>
      <p className="crisis-omen">{crisis.omen}</p>
    </div>
  )
}
