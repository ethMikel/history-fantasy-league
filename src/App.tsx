import { useReducer, useState } from 'react'
import './styles/fonts.css'
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
          <p className="tagline">세종·나폴레옹·다빈치… 최강 내각을 뽑아라</p>
          <p className="tagline dim">위기 셋을 넘어, 당신의 정권은 몇 년이나 갈까? 👑</p>
          <button className="btn-primary hard-shadow start-btn" onClick={() => { play('click'); dispatch({ type: 'NEW_GAME', seed: newSeed() }) }}>
            ▶ 시작
          </button>
        </div>
      )}
      {state.screen === 'draft' && <DraftScreen state={state} dispatch={dispatch} />}
      {state.screen === 'sim' && <SimScreen state={state} dispatch={dispatch} />}
      {state.screen === 'result' && <ResultScreen state={state} dispatch={dispatch} />}
    </main>
  )
}

export default App
