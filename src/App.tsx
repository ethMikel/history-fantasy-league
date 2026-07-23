import { useReducer, useState } from 'react'
import './styles/tokens.css'
import './App.css'
import { initGame, reducer, type GameState } from './game/gameState'
import { DraftScreen } from './screens/DraftScreen'
import { SimScreen } from './screens/SimScreen'
import { ResultScreen, newSeed } from './screens/ResultScreen'
import { play, toggleMute, isMuted } from './lib/sfx'

const titleState: GameState = { ...initGame(0), screen: 'title' }

function App() {
  const [state, dispatch] = useReducer(reducer, titleState)
  const [muted, setMuted] = useState(isMuted())

  return (
    <main className="app-root">
      <button className="mute-btn" title="소리 켜기/끄기" onClick={() => setMuted(toggleMute())}>
        {muted ? '🔇' : '🔊'}
      </button>
      {state.screen === 'title' && (
        <div className="title-screen">
          <h1 className="hard-shadow game-title">히스토리 판타지 리그</h1>
          <p className="tagline">세계사 위인들로 드림 내각을 뽑아라</p>
          <p className="tagline dim">당신의 정권은 몇 년 집권할 수 있는가?</p>
          <button className="btn-primary hard-shadow start-btn" onClick={() => { play('click'); dispatch({ type: 'NEW_GAME', seed: newSeed() }) }}>
            ▶ 시작
          </button>
          <p className="build-note">위기 3개를 모두 막아 완전 집권에 도전하라 · 실존 인물 156명</p>
        </div>
      )}
      {state.screen === 'draft' && <DraftScreen state={state} dispatch={dispatch} />}
      {state.screen === 'sim' && <SimScreen state={state} dispatch={dispatch} />}
      {state.screen === 'result' && <ResultScreen state={state} dispatch={dispatch} />}
    </main>
  )
}

export default App
