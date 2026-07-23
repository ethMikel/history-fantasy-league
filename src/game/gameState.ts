// 게임 상태 머신 (라우터 없음, CLAUDE.md 규칙 7)
// title → draft → sim → result. reducer는 순수 — 스핀 난수 결과는 액션 payload로 주입.

import { generateCrises, simulate } from '../lib/simulate'
import { SLOTS, type Cabinet, type Character, type Crisis, type SimResult, type SlotId } from '../lib/types'

export type Screen = 'title' | 'draft' | 'sim' | 'result'

export interface GameState {
  screen: Screen
  seed: number
  crises: Crisis[]
  slots: Record<SlotId, Character | null>
  candidates: Character[] | null // 현재 스핀 결과 (null = 아직 스핀 전)
  spinLabel: string | null // "동아시아 · 15세기"
  nearMiss: Character | null // 이번 스핀에서 놓친 거물 (정직한 near-miss 연출)
  selected: string | null // 선택한 후보 id (슬롯 배치 대기)
  respinAll: number
  respinCiv: number
  result: SimResult | null
}

const emptySlots = (): Record<SlotId, Character | null> =>
  Object.fromEntries(SLOTS.map((s) => [s.id, null])) as Record<SlotId, Character | null>

export function initGame(seed: number): GameState {
  return {
    screen: 'draft',
    seed,
    crises: generateCrises(seed),
    slots: emptySlots(),
    candidates: null,
    spinLabel: null,
    nearMiss: null,
    selected: null,
    respinAll: 1, // 06_SIM_SPEC §2 (v0.1 판 전체 각 1회)
    respinCiv: 1,
    result: null,
  }
}

export type Action =
  | { type: 'NEW_GAME'; seed: number }
  | { type: 'SPIN'; candidates: Character[]; label: string; nearMiss?: Character } // payload = 컴포넌트가 rng로 뽑은 결과
  | { type: 'RESPIN'; kind: 'all' | 'civ'; candidates: Character[]; label: string; nearMiss?: Character }
  | { type: 'SELECT'; id: string }
  | { type: 'ASSIGN'; slot: SlotId }
  | { type: 'START_SIM' }
  | { type: 'GOTO'; screen: Screen }
  | { type: 'HOME' }

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return initGame(action.seed)

    case 'SPIN':
      return { ...state, candidates: action.candidates, spinLabel: action.label, nearMiss: action.nearMiss ?? null, selected: null }

    case 'RESPIN': {
      if (action.kind === 'all' && state.respinAll <= 0) return state
      if (action.kind === 'civ' && state.respinCiv <= 0) return state
      return {
        ...state,
        candidates: action.candidates,
        spinLabel: action.label,
        nearMiss: action.nearMiss ?? null,
        selected: null,
        respinAll: action.kind === 'all' ? state.respinAll - 1 : state.respinAll,
        respinCiv: action.kind === 'civ' ? state.respinCiv - 1 : state.respinCiv,
      }
    }

    case 'SELECT':
      return { ...state, selected: state.selected === action.id ? null : action.id }

    case 'ASSIGN': {
      if (!state.selected || state.slots[action.slot]) return state
      const pick = state.candidates?.find((c) => c.id === state.selected)
      if (!pick) return state
      return {
        ...state,
        slots: { ...state.slots, [action.slot]: pick },
        candidates: null, // 라운드 종료 → 다음 스핀 대기
        spinLabel: null,
        nearMiss: null,
        selected: null,
      }
    }

    case 'START_SIM': {
      if (SLOTS.some((s) => !state.slots[s.id])) return state
      const cabinet = state.slots as Cabinet
      return { ...state, screen: 'sim', result: simulate(state.seed, cabinet) }
    }

    case 'GOTO':
      return { ...state, screen: action.screen }

    case 'HOME':
      return { ...state, screen: 'title' }

    default:
      return state
  }
}

export const isCabinetFull = (s: GameState) => SLOTS.every((slot) => s.slots[slot.id])
export const filledCount = (s: GameState) => SLOTS.filter((slot) => s.slots[slot.id]).length
