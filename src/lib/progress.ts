// 목표구배 진행바(Kivetz) 표시 로직 — 순수 함수 (UI 컴포넌트 + 검증 스크립트 공유, drift 방지).
// outcomes[i]: null=대기 / true=저지 / false=실패 (crises와 같은 연차순 정렬).
export function crisisProgress(total: number, outcomes: (boolean | null)[]): { headline: string; hot: boolean } {
  const resolved = outcomes.filter((o) => o !== null).length
  const cleared = outcomes.filter((o) => o === true).length
  const pending = total - resolved
  const perfectSoFar = cleared === resolved // 아직 실패 없음 = 완전집권 가능성 살아있음
  const hot = perfectSoFar && pending > 0 && cleared === total - 1 // 마지막 하나 = 목표구배 정점
  const headline =
    pending === 0
      ? cleared === total
        ? '🏆 완전 집권 달성!'
        : `위기 ${cleared}/${total} 저지`
      : hot
        ? `🔥 ${cleared}/${total} 저지! 마지막 하나`
        : perfectSoFar
          ? `${cleared}/${total} 저지 — 완전 집권까지 ${pending}개`
          : `완전 집권 무산 — ${cleared}/${total} 저지`
  return { headline, hot }
}
