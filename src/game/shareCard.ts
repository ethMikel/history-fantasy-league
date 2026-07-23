// 결과 공유 카드 — 심리 리서치 #1 훅 (IKEA 효과·자랑·바이럴 재유입, 13_ADDICTION_PSYCH)
// canvas로 등급+집권연수+내각 초상 라인업+🏆배지를 1장 PNG로. 다운로드/Web Share.
import { SLOTS, type SlotId, type Character, type SimResult } from '../lib/types'
import { portraitUrl } from '../ui/shared'
import { fitScore } from '../ui/shared'

const W = 600, H = 800
// tokens.css 값과 동기화 (canvas는 CSS 변수 못 읽음 — 하드코딩 최소화 위해 여기 집약)
const C = {
  bg: '#14121f', panel: '#262336', ink: '#4a4562', paper: '#efe9d9', dim: '#cfc6ae',
  gold: '#e8b53a', red: '#d9484a', green: '#55a868',
}
const GRADE_C: Record<string, string> = { S: C.gold, A: '#4a7fd9', B: C.green, C: C.dim, D: C.paper }

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = () => res(null)
    img.src = src
  })
}

export async function renderShareCard(
  result: SimResult, slots: Record<SlotId, Character>,
): Promise<Blob | null> {
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const g = cv.getContext('2d')!
  g.imageSmoothingEnabled = false

  // 배경
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H)
  g.fillStyle = C.panel; g.fillRect(24, 24, W - 48, H - 48)

  // 헤더
  g.textAlign = 'center'
  g.fillStyle = C.gold; g.font = 'bold 34px sans-serif'
  g.fillText('히스토리 판타지 리그', W / 2, 84)

  // 우승/등급
  const win = result.allClear
  g.fillStyle = win ? C.gold : C.dim
  g.font = 'bold 44px sans-serif'
  g.fillText(win ? '🏆 완전 집권' : `위기 ${result.cleared}/3 극복`, W / 2, 148)

  // 등급 대문짝 + 집권연수
  g.fillStyle = GRADE_C[result.grade]
  g.font = 'bold 120px sans-serif'
  g.fillText(result.grade, W / 2 - 90, 280)
  g.fillStyle = C.paper; g.font = 'bold 56px sans-serif'
  g.fillText(`${result.years}년`, W / 2 + 70, 260)
  g.fillStyle = C.dim; g.font = '22px sans-serif'
  g.fillText('집권', W / 2 + 70, 292)

  // 내각 라인업 (초상 4×2 그리드)
  g.fillStyle = C.dim; g.font = '20px sans-serif'; g.textAlign = 'left'
  g.fillText('나의 드림 내각', 56, 360)
  const cell = 128, cols = 4, ox = 56, oy = 380, sz = 84
  for (let i = 0; i < SLOTS.length; i++) {
    const slot = SLOTS[i], c = slots[slot.id]
    const x = ox + (i % cols) * cell, y = oy + Math.floor(i / cols) * 190
    const img = c.portrait ? await loadImg(portraitUrl(c.portrait)) : null
    g.fillStyle = C.ink; g.fillRect(x, y, sz, sz)
    if (img) g.drawImage(img, x, y, sz, sz)
    else { g.fillStyle = C.dim; g.font = '40px sans-serif'; g.textAlign = 'center'; g.fillText(c.name[0], x + sz / 2, y + sz / 2 + 14) }
    // 이름 + 적성
    g.textAlign = 'center'
    g.fillStyle = C.paper; g.font = '14px sans-serif'
    g.fillText(trim(c.name, 7), x + sz / 2, y + sz + 22)
    g.fillStyle = C.gold; g.font = 'bold 15px sans-serif'
    g.fillText(`${slot.name.replace(' 장관', '')} ${fitScore(slot, c)}`, x + sz / 2, y + sz + 42)
  }

  // 푸터
  g.textAlign = 'center'; g.fillStyle = C.dim; g.font = '18px sans-serif'
  g.fillText('당신의 내각은 몇 년 집권할까?  ethmikel.github.io/history-fantasy-league', W / 2, H - 44)

  return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'))
}

function trim(s: string, n: number) { return s.length > n ? s.slice(0, n) + '…' : s }

// 공유: Web Share API(모바일) → 실패 시 다운로드 폴백
export async function shareResult(result: SimResult, slots: Record<SlotId, Character>): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await renderShareCard(result, slots)
  if (!blob) return 'failed'
  const file = new File([blob], 'history-fantasy-league.png', { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: '히스토리 판타지 리그', text: `내 정권 ${result.years}년 집권 (${result.grade}등급)!` })
      return 'shared'
    } catch { /* 취소 시 폴백 */ }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'history-fantasy-league.png'; a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
