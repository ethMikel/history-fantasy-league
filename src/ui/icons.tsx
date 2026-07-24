// 픽셀 톤 인라인 SVG 아이콘 — 아이폰 이모지 대체 (UI 개편 #2, 프로토타입 느낌 제거).
// currentColor 상속 → 버튼/텍스트 색을 그대로 따름. 크기는 폰트 크기(1em) 기준.
import type { ReactNode, ReactElement } from 'react'
import type { Axis } from '../lib/types'

type P = { size?: number | string; className?: string; title?: string }
function Svg({ size, className, title, children }: P & { children: ReactNode }) {
  return (
    <svg className={`icon${className ? ' ' + className : ''}`} viewBox="0 0 16 16"
         width={size} height={size} fill="currentColor" aria-hidden={title ? undefined : true}
         role={title ? 'img' : undefined} focusable="false">
      {title && <title>{title}</title>}
      {children}
    </svg>
  )
}

export const DiceIcon = (p: P) => (
  <Svg {...p}>
    <rect x="1.5" y="1.5" width="13" height="13" />
    <g fill="var(--accent, #d9a441)">
      <rect x="4" y="4" width="2.2" height="2.2" /><rect x="9.8" y="4" width="2.2" height="2.2" />
      <rect x="6.9" y="6.9" width="2.2" height="2.2" />
      <rect x="4" y="9.8" width="2.2" height="2.2" /><rect x="9.8" y="9.8" width="2.2" height="2.2" />
    </g>
  </Svg>
)

export const PlayIcon = (p: P) => (
  <Svg {...p}><path d="M3 2 L13 8 L3 14 Z" /></Svg>
)

export const CrownIcon = (p: P) => (
  <Svg {...p}>
    <path d="M1 5 L4 9 L8 3 L12 9 L15 5 L13.5 13 L2.5 13 Z" />
    <rect x="2" y="13.5" width="12" height="1.6" />
  </Svg>
)

export const SoundOnIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 6 H5 L9 3 V13 L5 10 H2 Z" />
    <path d="M11 5 Q13.5 8 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12.8 3.3 Q16 8 12.8 12.7" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </Svg>
)

export const SoundOffIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 6 H5 L9 3 V13 L5 10 H2 Z" />
    <path d="M11.5 5.5 L15 9.5 M15 5.5 L11.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </Svg>
)

export const BoltIcon = (p: P) => (
  <Svg {...p}><path d="M9 1 L3 9 H7 L6 15 L13 6 H8.5 Z" /></Svg>
)

export const CheckIcon = (p: P) => (
  <Svg {...p}><path d="M2 8 L6.5 12.5 L14 3.5 L12 2 L6.3 9 L3.7 6.3 Z" /></Svg>
)

export const CrossIcon = (p: P) => (
  <Svg {...p}><path d="M3 2 L8 7 L13 2 L14 5 L11 8 L14 11 L13 14 L8 9 L3 14 L2 11 L5 8 L2 5 Z" /></Svg>
)

export const RetryIcon = (p: P) => (
  <Svg {...p}>
    <path d="M8 2 A6 6 0 1 1 2.6 5.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 0 L8 4.4 L4 2.2 Z" />
  </Svg>
)

// 초상 없는 인물 폴백 (태종·광종 등) — 맨 글자 대신 흉상 실루엣
export const BustIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="8" cy="5.4" r="3.1" />
    <path d="M1.8 15.5 C1.8 10.5 4.6 9 8 9 C11.4 9 14.2 10.5 14.2 15.5 Z" />
  </Svg>
)

export const CameraIcon = (p: P) => (
  <Svg {...p}>
    <path d="M1 4 H4 L5 2.5 H11 L12 4 H15 V13 H1 Z" />
    <circle cx="8" cy="8.5" r="3" fill="var(--panel, #241c14)" />
    <circle cx="8" cy="8.5" r="1.4" fill="currentColor" />
  </Svg>
)

// ── 위기 축별 아이콘 (색=축은 카드 보더로만, 아이콘은 형태로 축 암시) ──
const SwordsIcon = (p: P) => (
  <Svg {...p}>
    <g transform="rotate(45 8 8)"><rect x="7" y="1" width="2" height="9.5" /><rect x="5.3" y="10.3" width="5.4" height="1.6" /><rect x="7" y="11.9" width="2" height="2.6" /></g>
    <g transform="rotate(-45 8 8)"><rect x="7" y="1" width="2" height="9.5" /><rect x="5.3" y="10.3" width="5.4" height="1.6" /><rect x="7" y="11.9" width="2" height="2.6" /></g>
  </Svg>
)
const TargetIcon = (p: P) => (
  <Svg {...p}>
    <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="5" y="5" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="7" y="7" width="2" height="2" />
  </Svg>
)
const TempleIcon = (p: P) => (
  <Svg {...p}>
    <path d="M8 1 L15 5 H1 Z" />
    <rect x="2" y="6" width="1.8" height="6" /><rect x="5" y="6" width="1.8" height="6" />
    <rect x="9.2" y="6" width="1.8" height="6" /><rect x="12.2" y="6" width="1.8" height="6" />
    <rect x="1" y="12.5" width="14" height="2" />
  </Svg>
)
const DoveIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 3 Q9 4 6 8 Q4 11 2 11 Q5 13 8 12 Q12 10.5 13 6 L15 6 Z" />
    <rect x="4.5" y="11" width="1.5" height="3" transform="rotate(20 5 12)" />
  </Svg>
)
const FlaskIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 1 H10 V2 H9 V6 L13 13 Q13.5 14.5 12 14.5 H4 Q2.5 14.5 3 13 L7 6 V2 H6 Z" />
    <rect x="5.3" y="10" width="5.4" height="1.4" fill="var(--panel, #241c14)" />
  </Svg>
)
const MaskIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 2 H13 V8 Q13 14 8 14 Q3 14 3 8 Z" />
    <rect x="5" y="5" width="2" height="2" fill="var(--panel, #241c14)" />
    <rect x="9" y="5" width="2" height="2" fill="var(--panel, #241c14)" />
    <rect x="6" y="10" width="4" height="1.4" fill="var(--panel, #241c14)" />
  </Svg>
)

const AXIS_ICON: Record<Axis, (p: P) => ReactElement> = {
  mil: SwordsIcon, str: TargetIcon, dom: TempleIcon, dip: DoveIcon, sci: FlaskIcon, cul: MaskIcon,
}
export function CrisisAxisIcon({ axis, ...p }: P & { axis: Axis }) {
  const I = AXIS_ICON[axis]
  return <I {...p} />
}
