// 모든 튜닝 상수의 단일 거처 (06_SIM_SPEC §9)
// 규칙: 게임 코드·시뮬 러너 어디에도 밸런스 숫자 하드코딩 금지 — 전부 여기서 import.
// 수치 근거: 06_SIM_SPEC v0.1 (승인 후 플레이테스트·봇 시뮬로 튜닝)

export const BALANCE = {
  // §5 판정 (로지스틱)
  K: 20, // 시그모이드 스케일 — 클수록 스탯 격차에 둔감
  D: { low: 56, mid: 71, high: 85 }, // 위기 난이도 — v0.3: greedy 중앙값 회복 방향 소폭 하향
  P_CLAMP: { min: 0.05, max: 0.95 },
  FAVORABLE_2RN_THRESHOLD: 0.75, // '유리' 라벨 판정은 2RN 굴림

  // §3 슬롯 기여도
  W_MAIN: 0.65,
  W_SUB: 0.2,
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
