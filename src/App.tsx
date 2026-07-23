import './styles/tokens.css'
import './App.css'

// Phase 0 스캐폴드: 타이틀 플레이스홀더. 화면 전환은 라우터 없이 상태 머신으로 구현 예정 (CLAUDE.md 규칙 7)
function App() {
  return (
    <main className="title-screen">
      <h1 className="hard-shadow game-title">히스토리 판타지 리그</h1>
      <p className="tagline">세계사 위인들로 드림 내각을 뽑아라</p>
      <p className="tagline dim">당신의 정권은 몇 년 집권할 수 있는가?</p>
      <p className="build-note">Phase 0 — 배포 파이프라인 검증 빌드</p>
    </main>
  )
}

export default App
