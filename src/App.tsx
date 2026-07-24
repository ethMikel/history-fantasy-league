import { useReducer, useState } from 'react'
import './styles/fonts.css'
import './styles/tokens.css'
import './App.css'
import { initGame, reducer, type GameState } from './game/gameState'
import { DraftScreen } from './screens/DraftScreen'
import { SimScreen } from './screens/SimScreen'
import { ResultScreen, newSeed } from './screens/ResultScreen'
import { play, toggleMute, isMuted } from './lib/sfx'
import { AtlasBackground } from './ui/AtlasBackground'
import { SoundOnIcon, SoundOffIcon, CrownIcon, PlayIcon } from './ui/icons'

const titleState: GameState = { ...initGame(0), screen: 'title' }

function App() {
  const [state, dispatch] = useReducer(reducer, titleState)
  const [muted, setMuted] = useState(isMuted())

  return (
    <main className="app-root">
      <AtlasBackground />
      <button className="mute-btn" title="소리 켜기/끄기" onClick={() => setMuted(toggleMute())}>
        {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      </button>
      {state.screen === 'title' && (
        <div className="title-screen">
          <h1 className="hard-shadow game-title">히스토리 판타지 리그</h1>
          <p className="tagline">세종·나폴레옹·다빈치… 최강 내각을 뽑아라</p>
          <p className="tagline dim">당신의 정권, 과연 몇 년이나 버틸까? <CrownIcon /></p>
          <button className="btn-primary hard-shadow start-btn" onClick={() => { play('click'); dispatch({ type: 'NEW_GAME', seed: newSeed() }) }}>
            <PlayIcon /> 시작
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
