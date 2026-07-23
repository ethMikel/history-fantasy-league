// 도메인 타입 (06_SIM_SPEC 용어 그대로 — drift 방지)

export type Axis = 'mil' | 'str' | 'dom' | 'dip' | 'sci' | 'cul'
export const AXES: Axis[] = ['mil', 'str', 'dom', 'dip', 'sci', 'cul']
export const AXIS_LABEL: Record<Axis, string> = {
  mil: '무력', str: '지략', dom: '내정', dip: '외교', sci: '과학', cul: '문화',
}

export type Tier = 'legend' | 'great' | 'capable' | 'common'
export type Difficulty = 'low' | 'mid' | 'high'

export interface Character {
  id: string
  name: string
  civ: string // 문명권 (스핀 셀)
  era: string // 시대 (스핀 셀)
  tier: Tier
  stats: Record<Axis, number> // 0-99, 티어 예산 합
}

export type SlotId =
  | 'president' | 'pm' | 'defense' | 'security' | 'foreign' | 'science' | 'culture' | 'flex'

export interface SlotDef {
  id: SlotId
  name: string
  mainAxis: Axis | null // president/flex = null (특수)
  subAxis: Axis | null
}

// 8석 (05_GDD 확정): 대통령(배수) + 6개 부처 + 무임소(FLEX)
export const SLOTS: SlotDef[] = [
  { id: 'president', name: '대통령', mainAxis: null, subAxis: null },
  { id: 'pm', name: '국무총리', mainAxis: 'dom', subAxis: 'str' },
  { id: 'defense', name: '국방부 장관', mainAxis: 'mil', subAxis: 'str' },
  { id: 'security', name: '국가안보실장', mainAxis: 'str', subAxis: 'mil' },
  { id: 'foreign', name: '외교부 장관', mainAxis: 'dip', subAxis: 'cul' },
  { id: 'science', name: '과학기술부 장관', mainAxis: 'sci', subAxis: 'dom' },
  { id: 'culture', name: '문화부 장관', mainAxis: 'cul', subAxis: 'dip' },
  { id: 'flex', name: '무임소 장관', mainAxis: null, subAxis: null },
]

export type Cabinet = Record<SlotId, Character>

export interface Crisis {
  axis: Axis
  difficulty: Difficulty
  year: number // 발생 연차 (타임라인 배치)
  label: string // 서술형 예고문 (v0.1은 자리표시 문구)
}

export interface TimelineEvent {
  year: number
  kind: 'crisis' | 'minor'
  axis?: Axis
  difficulty?: Difficulty
  success?: boolean
  margin?: number
  deltaYears: number
  supportAfter: number
  responder?: string // 대응한 장관 이름 (구국공신/역적 연출용)
  viaFlex?: boolean // 무임소 구원 등판 여부
}

export interface SimResult {
  years: number
  timeline: TimelineEvent[]
  crises: Crisis[]
  finalSupport: number
}
