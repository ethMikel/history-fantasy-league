# 히스토리 판타지 리그 — 개발 규율

세계사 인물로 근대 내각을 드래프트해 "정권 집권 연수"를 겨루는 캐주얼 웹게임.
스펙 문서: `../06_SIM_SPEC.md` (수치 계약서) · `../05_GDD.md` (디자인 필러) · 상세 근거 `../02_GAMEDEV_STUDY.md`, `../04_FORMULA_STUDY.md`, `../08_REFERENCE_STUDY.md`

## 디자인 필러 (기능 제안 시 이 3개에 비추어 수용/컷)
1. 키치한 랜덤 (스핀의 맛) 2. 예고를 해석하는 실력 3. 관전의 서사 (지지율 그래프 juice = 코어 기능)

## 불가침 규칙
1. **게임 로직에서 `Math.random` 금지** — `src/lib/rng.ts` 스트림(pool/crisis/check)만 사용. 연출만 Math.random 허용
2. **밸런스 숫자 하드코딩 금지** — 전부 `src/lib/balance.ts`에서 import
3. 시뮬 코어는 순수 함수 `simulate(seed, picks) → {years, timeline}` — DOM/React 의존 금지 (클라·러너 공유)
4. 애니메이션은 `transform`/`opacity`만, 이징 필수 (linear 금지)
5. 색상 리터럴은 `src/styles/tokens.css`에만. radius 0 + 하드섀도 유지
6. 폰트 크기는 tokens.css의 --fs-* 만 (Galmuri 정수 배율)
7. 라우터 금지 — 화면 전환은 상태 머신 (title → draft → sim → result)
8. 에셋 추가 시 같은 커밋에서 `CREDITS.md` 갱신 (TASL). CC0 우선, **CC-BY·CC-BY-SA 허용(출처 표기 필수)**, CC-BY-NC·ND 금지 (2026-07-24 완화: SA는 표기만 하면 게임·상업·변형 OK, ShareAlike는 변형 이미지에만 적용)
9. 프롬프트 1개 = 검증 가능한 변경 1개. 작동 확인 후 커밋. fix 3연속 실패 → revert 후 재설계
10. 항상 플레이 가능 상태 유지 — 어느 커밋에서도 한 판이 끝까지 돌아야 함

## 스택
Vite + React + TypeScript + Motion(패키지명 `motion`, import는 `motion/react`). 게임엔진(Phaser 등) 도입 금지.
배포: GitHub Pages (base `/history-fantasy-league/`), `.github/workflows/deploy.yml` 자동 배포. 모바일: 100dvh, touch-action manipulation.

## 검증
- `npm run build` 통과 + 브라우저(데스크톱/모바일)에서 한 판 완주가 단계 통과 조건 ("코드 작성됨" ≠ 완료)
- 밸런스 변경 시 봇 러너(예정: `npm run sim`)로 분포 확인
