// 도메인 타입 (06_SIM_SPEC 용어 그대로 — drift 방지)

export type Axis = 'mil' | 'str' | 'dom' | 'dip' | 'sci' | 'cul'
export const AXES: Axis[] = ['mil', 'str', 'dom', 'dip', 'sci', 'cul']
export const AXIS_LABEL: Record<Axis, string> = {
  mil: '군사', str: '지략', dom: '내정', dip: '외교', sci: '과학', cul: '문화',
}

export type Tier = 'legend' | 'great' | 'capable' | 'common'
export type Difficulty = 'low' | 'mid' | 'high'

export interface Character {
  id: string
  name: string
  civ: string // 문명권 (스핀 셀)
  era: string // 시대 (스핀 셀)
  tier: Tier
  stats: Record<Axis, number> // 0-99, 앵커 루브릭 스코어링
  en?: string // 영문명
  portrait?: string // public/portraits/<id>.png 존재 시 id, 없으면 ''
  evidence?: string // 최고 축 근거 한 줄 (툴팁·심사 방어용)
  flag?: boolean // 검수 플래그 (현대 정치인 등 — 동현 큐레이션 대기)
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
  title: string // 구체적 이벤트명 (배너 헤드라인, 예: "대역병 창궐")
  omen: string // 서술형 예고 — 증상만 노출, 축은 은닉 (11_CRISIS_NARRATIVE)
}

export interface TimelineEvent {
  year: number
  kind: 'crisis' | 'minor'
  axis?: Axis
  difficulty?: Difficulty
  title?: string // 위기 이벤트명 (판정 코멘트용)
  success?: boolean
  margin?: number
  deltaYears: number
  supportAfter: number
  responder?: string // 대응한 장관 이름 (구국공신/역적 연출용)
  viaFlex?: boolean // 무임소 구원 등판 여부
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

export interface SimResult {
  years: number
  timeline: TimelineEvent[]
  crises: Crisis[]
  finalSupport: number
  cleared: number // 극복한 위기 수 (0~3)
  allClear: boolean // 🏆 우승 = 3개 전부 극복
  grade: Grade // 등급 (극복 수 + 집권연수)
}
