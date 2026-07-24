// 배경 — 타이틀은 유명 인물 '초상 벽'(몰입), 게임 화면은 차분한 '고지도'(가독성).
// 장식용(aria-hidden, pointer-events none). 동현 피드백: 게임 진입 후 초상이 정신없음 → 지도 톤.
import { portraitUrl } from './shared'

const FACES = [
  'Q935', 'Q37682', 'Q517', 'Q762', 'Q937', 'Q635', 'Q8409', 'Q1048',
  'Q7186', 'Q255', 'Q254', 'Q50184', 'Q7192', 'Q868', 'Q913', 'Q859',
  'Q5582', 'Q5592', 'Q307', 'Q4604', 'Q1001', 'Q7207', 'Q11812', 'Q991',
]

export function AtlasBackground({ mode = 'portraits' }: { mode?: 'portraits' | 'map' }) {
  // 게임 화면: 펼쳐진 양피지 고지도 — 위경도 격자 + 종이 결 + 낡은 가장자리 (나침반 제거, 동현)
  if (mode === 'map') {
    return (
      <div className="atlas-bg atlas-map" aria-hidden="true">
        <div className="atlas-map-grid" />
        <div className="atlas-map-fiber" />
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
