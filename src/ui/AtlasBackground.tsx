// 배경 — 타이틀은 유명 인물 '초상 벽'(몰입), 게임 화면은 차분한 '고지도'(가독성).
// 장식용(aria-hidden, pointer-events none). 동현 피드백: 게임 진입 후 초상이 정신없음 → 지도 톤.
import { portraitUrl } from './shared'

const FACES = [
  'Q935', 'Q37682', 'Q517', 'Q762', 'Q937', 'Q635', 'Q8409', 'Q1048',
  'Q7186', 'Q255', 'Q254', 'Q50184', 'Q7192', 'Q868', 'Q913', 'Q859',
  'Q5582', 'Q5592', 'Q307', 'Q4604', 'Q1001', 'Q7207', 'Q11812', 'Q991',
]

export function AtlasBackground({ mode = 'portraits' }: { mode?: 'portraits' | 'map' }) {
  // 게임 화면: 초상 없는 고지도 — 위경도 격자 + 나침반 + 비네트 (인터페이스 가독성 우선)
  if (mode === 'map') {
    return (
      <div className="atlas-bg atlas-map" aria-hidden="true">
        <div className="atlas-map-grid" />
        <svg className="atlas-compass" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path d="M16 2 L18 16 L16 30 L14 16 Z" fill="currentColor" />
          <path d="M2 16 L16 14 L30 16 L16 18 Z" fill="currentColor" opacity="0.5" />
        </svg>
        <div className="atlas-map-veil" />
      </div>
    )
  }
  // 타이틀: 초상 벽
  const tiles = Array.from({ length: 108 }, (_, i) => FACES[i % FACES.length])
  return (
    <div className="atlas-bg" aria-hidden="true">
      <div className="atlas-faces">
        {tiles.map((id, i) => (
          <img
            key={i}
            className="atlas-face pixelated"
            src={portraitUrl(id)}
            alt=""
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
          />
        ))}
      </div>
      <div className="atlas-veil" />
    </div>
  )
}
