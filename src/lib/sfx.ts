// 절차적 효과음 — Web Audio 오실레이터+게인 (오디오 파일 없음, 외부 라이브러리 없음).
// ZzFX 대신 자작: 헤드리스에서 음색 검증 불가 → 정확히 작성·검증 가능한 최소 신스 선택.
// 뮤트 = localStorage. 클릭 등 사용자 제스처 후 재생되므로 autoplay 정책 안전(첫 재생 시 resume).
export type SfxName = 'spin' | 'select' | 'assign' | 'success' | 'fail' | 'win' | 'lose' | 'click'

type Ctor = typeof AudioContext
let ctx: AudioContext | null = null
let muted = false
try { muted = localStorage.getItem('hfl.muted') === '1' } catch { /* SSR/차단 */ }

function ac(): AudioContext | null {
  const W = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor }
  const C = W.AudioContext || W.webkitAudioContext
  if (!C) return null
  if (!ctx) ctx = new C()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

interface Tone { f: number; to?: number; type: OscillatorType; dur: number; vol?: number }
// 8종: 주파수(진행 f→to)·파형·길이·볼륨. 성공/우승은 상행 화음(팡파레), 실패/멸망은 하강.
const SFX: Record<SfxName, Tone[]> = {
  click: [{ f: 420, type: 'square', dur: 0.04, vol: 0.12 }],
  spin: [{ f: 180, to: 640, type: 'sawtooth', dur: 0.28, vol: 0.16 }],
  select: [{ f: 660, type: 'triangle', dur: 0.06, vol: 0.18 }],
  assign: [{ f: 520, to: 784, type: 'square', dur: 0.1, vol: 0.18 }],
  success: [{ f: 523, type: 'triangle', dur: 0.09, vol: 0.2 }, { f: 784, type: 'triangle', dur: 0.14, vol: 0.2 }],
  fail: [{ f: 300, to: 120, type: 'sawtooth', dur: 0.24, vol: 0.18 }],
  win: [{ f: 523, type: 'square', dur: 0.1, vol: 0.2 }, { f: 659, type: 'square', dur: 0.1, vol: 0.2 }, { f: 1047, type: 'square', dur: 0.24, vol: 0.2 }],
  lose: [{ f: 392, to: 130, type: 'sawtooth', dur: 0.5, vol: 0.18 }],
}

function blip(c: AudioContext, t: Tone, at: number) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = t.type
  osc.frequency.setValueAtTime(t.f, at)
  if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, at + t.dur)
  const v = t.vol ?? 0.18
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(v, at + 0.008) // 빠른 어택
  g.gain.exponentialRampToValueAtTime(0.0001, at + t.dur) // 릴리즈
  osc.connect(g)
  g.connect(c.destination)
  osc.start(at)
  osc.stop(at + t.dur + 0.02)
}

export function play(name: SfxName): void {
  if (muted) return
  const c = ac()
  if (!c) return
  try {
    let at = c.currentTime
    for (const t of SFX[name]) { blip(c, t, at); at += t.dur * 0.9 }
  } catch { /* 오디오 실패는 무해하게 무시 */ }
}

export function toggleMute(): boolean {
  muted = !muted
  try { localStorage.setItem('hfl.muted', muted ? '1' : '0') } catch { /* 무시 */ }
  return muted
}
export function isMuted(): boolean { return muted }
