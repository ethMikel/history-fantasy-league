// 아틀라스 배경 — 유명 인물 픽셀 초상을 흐릿하게 타일링한 '초상 벽' + 양피지 색조.
// 장식용(aria-hidden, pointer-events none). 모든 화면 공통이라 화면 전환해도 같은 세계 위에 있는 느낌.
import { portraitUrl } from './shared'

// 알아볼 만한 유명 인물 초상 (배경 흥미 유발). onError로 없는 파일은 숨김.
const FACES = [
  'Q935', 'Q37682', 'Q517', 'Q762', 'Q937', 'Q635', 'Q8409', 'Q1048',
  'Q7186', 'Q255', 'Q254', 'Q50184', 'Q7192', 'Q868', 'Q913', 'Q859',
  'Q5582', 'Q5592', 'Q307', 'Q4604', 'Q1001', 'Q7207', 'Q11812', 'Q991',
]

export function AtlasBackground() {
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
