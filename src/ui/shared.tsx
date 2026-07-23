// 공용 표시 컴포넌트 — 기능 컬러(축=색), 픽셀 톤 (08_REFERENCE_STUDY §2)
import { AXES, AXIS_LABEL, type Axis, type Character, type Crisis, type Tier } from '../lib/types'

export const ovr = (c: Character) => Math.round(AXES.reduce((s, a) => s + c.stats[a], 0) / 6)

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

export function CharCard({ c, selected, onClick, compact }: {
  c: Character; selected?: boolean; onClick?: () => void; compact?: boolean
}) {
  return (
    <button
      className={`char-card hard-shadow${selected ? ' selected' : ''}`}
      onClick={onClick}
      style={{ borderColor: TIER_COLOR[c.tier] }}
    >
      <div className="char-head">
        <span className="char-name">{c.name}</span>
        <span className="char-ovr" style={{ color: TIER_COLOR[c.tier] }}>{ovr(c)}</span>
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
// walking skeleton: 실 예고문(11_CRISIS_NARRATIVE)은 다음 Fable 작업. 지금은 축 라벨 자리표시.
export function CrisisBanner({ crisis, idx }: { crisis: Crisis; idx: number }) {
  return (
    <div className="crisis-chip hard-shadow" style={{ borderColor: AXIS_VAR[crisis.axis] }}>
      <span className="crisis-icon">{CRISIS_ICON[crisis.axis]}</span>
      <span className="crisis-body">
        <span className="crisis-title">위기 {idx + 1} · {crisis.year}년차</span>
        <span className="crisis-hint" style={{ color: AXIS_VAR[crisis.axis] }}>
          {AXIS_LABEL[crisis.axis]} 역량이 시험대에 오른다
        </span>
      </span>
    </div>
  )
}
