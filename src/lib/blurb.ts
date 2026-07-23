// 인물 카드 한 줄 코멘트 — evidence(채점 근거)에서 심사 문법을 벗겨 플레이어용 '인식 훅'으로.
// 실제 출처 기반 evidence를 재활용한다(새 창작·AI 생성 아님 — 동현 실데이터 원칙, 순수 문자열 변환).
import { FLAVOR } from '../data/flavor'
import type { Character } from './types'

const AXIS_TAG = /(무력|군사|지략|내정|외교|과학|문화)\s*\d+\s*:\s*/g

export function blurb(evidence?: string): string {
  if (!evidence) return ''
  return evidence
    .replace(AXIS_TAG, '')                 // "과학 99:" 등 채점 접두 (다축 " / 외교 70:"도) 제거
    .replace(/\s*\([^)]*앵커[^)]*\)/g, '') // "(앵커 …)"·"(고정 앵커)"·"(앵커)" 괄호 제거
    .replace(/\s*앵커\d*/g, '')            // 잔여 "앵커"·"앵커88" 제거
    .replace(/^[\s/·,]+/, '')              // 접두 제거 후 남은 선행 구분자
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// 카드 표시용: 키치 한 줄(FLAVOR)이 있으면 우선, 없으면(플래그 15명 등) evidence 사실 톤 폴백.
export function cardBlurb(c: Character): string {
  return FLAVOR[c.id] || blurb(c.evidence)
}
