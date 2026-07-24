// 모든 튜닝 상수의 단일 거처 (06_SIM_SPEC §9)
// 규칙: 게임 코드·시뮬 러너 어디에도 밸런스 숫자 하드코딩 금지 — 전부 여기서 import.
// 수치 근거: 06_SIM_SPEC v0.1 (승인 후 플레이테스트·봇 시뮬로 튜닝)

export const BALANCE = {
  // §5 판정 (로지스틱)
  K: 20, // 시그모이드 스케일 — 클수록 스탯 격차에 둔감
  D: { low: 50, mid: 61, high: 73 }, // 위기 난이도 — v0.6: 부축 비중↑로 하락한 성공률 복원(목표 하85·중60·상35)
  P_CLAMP: { min: 0.05, max: 0.95 },
  FAVORABLE_2RN_THRESHOLD: 0.75, // '유리' 라벨 판정은 2RN 굴림

  // §3 슬롯 기여도 — v0.6: 부축 비중↑(0.2→0.3), 주축↓(0.65→0.55) = 겸비형이 인접 슬롯에도
  // 실전 활용(동현 #3-B "한 인물이 여러 역할"). 순수 스페셜리스트는 여전히 1축이 압도적.
  W_MAIN: 0.55,
  W_SUB: 0.3,
  W_AVG: 0.15,
  FLEX_PENALTY: 0.9, // 무임소 장관
  PRES_MIN: 0.92, // 대통령 배수 하한
  PRES_RANGE: 0.16, // 배수 = PRES_MIN + PRES_RANGE × (통솔지수/99)

  // §6 점수 (집권 연수 = 성취 지표) — v0.4: 실패=못 버는 것(작은 dip), 성공=버는 것
  // 실패 대폭차감→1년 붕괴 문제 해결. 연수는 그라데이션(리더보드 경쟁), 지지율은 드라마 별도 축
  Y_BASE: 10, // 기본 임기 (아무것도 못해도 최소 임기)
  G_MAX: { low: 10, mid: 20, high: 38 }, // 성공 보상 상한 (극복 수·난이도가 연수를 가름)
  L_FAIL: { low: 0, mid: 1, high: 2 }, // 실패 = 연수를 '못 버는' 것 (붕괴 대신 정체)
  MARGIN_SOFTCAP_S: 15, // Δ = G_MAX × (1 − e^(−margin/s))
  HARD_CAP_YEARS: 100, // "한 세기 집권" 완주
  ALL_CLEAR_BONUS: 10, // 위기 3개 전부 성공 시 (04_FORMULA_STUDY §6 올클리어 보너스)
  GOLDEN_AGE_MAX: 50, // 황금기 상한 — 올클리어 시 (내각 평균/99)² × MAX 추가 연수 (v0.3 구조 추가: 상위 꼬리 + 비위기축 픽 가치)

  // §4 위기 구조 — v0.5: 3→5개 (2 히든), 난이도↑, 타임라인 확장
  CRISIS_COUNT: 5, // 판당 위기 수
  HIDDEN_COUNT: 2, // 그중 예고 없는 히든 (드래프트 비노출, 시뮬에서만 등장)
  CRISIS_DIFFS: ['high', 'mid', 'low', 'mid', 'high'] as const, // 5개 난이도 구성 (셔플됨) — high 2·mid 2·low 1
  CRISIS_BANDS: [[2, 4], [5, 8], [8, 12], [13, 17], [18, 23]] as const, // 발생 연차 밴드 (확장된 타임라인)

  // §6 소이벤트 (플레이버) — v0.5: 개수↑ + 내각 인물 활약/부작용 참조
  MINOR_MIN: 4,
  MINOR_MAX: 7,
  MINOR_YEAR_MAX: 23, // 소이벤트 발생 연차 상한 (확장 타임라인)
  MINOR_ACTIVE_STAT: 72, // 담당 인물 평균 이 이상 → '활약'(+) 이벤트
  MINOR_MISHAP_STAT: 42, // 이하 → '부작용'(−) 이벤트

  // 등급 컷 (집권연수) — gradeOf + 목표구배 near-miss 문구가 공유하는 단일 출처 (drift 방지)
  // v0.5: 위기 5개 기준 재튠 (봇 러너 확인 후 확정)
  GRADE_YEARS: { allClearS: 78, allClearA: 52, nearMissB: 34 },

  // 시그니처 특성 (희귀도): 전설/명신이 자기 최고 축 위기를 담당하면 S에 가산 (04_FORMULA "유능감")
  TRAIT_BONUS: 8, // 대략 난이도 반 칸 — 봇 러너로 튜닝 (분포 급변 방지)

  // §7 지지율 그래프 (연출 전용 — 점수 무관)
  SUPPORT_START: 55,
  SUPPORT_SUCCESS: { min: 10, max: 25 },
  SUPPORT_FAIL: { min: 20, max: 35 },
  SUPPORT_MINOR: 3,

  // §3 티어 예산 (스탯 총점)
  TIER_BUDGET: { legend: 430, great: 380, capable: 330, common: 280 },

  // §2 드래프트
  SLOTS: 8,
  RESPIN_ALL: 1, // v0.1 = 판 전체 기준 (A안). B안(라운드당)은 Phase 1 비교
  RESPIN_CIV: 1,
} as const
