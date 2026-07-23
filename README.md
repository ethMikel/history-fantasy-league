# 히스토리 판타지 리그 (History Fantasy League)

> 세계사 위인들로 드림 내각을 뽑아라 — 당신의 정권은 몇 년 집권할 수 있는가?

NAN 2026 (NHN Game × AI Hackathon) 사전과제 출품작. 비개발자 1인이 AI(Claude Code)를 디렉팅해 개발.

**Play**: https://ethmikel.github.io/history-fantasy-league/ (배포 준비 중)

## 게임 방법
1. 이번 정권에 닥칠 **위기 예고 3개**를 읽는다
2. **스핀** → 랜덤한 (문명 × 시대)의 실존 인물들이 후보로 등장
3. 한 명을 골라 내각 슬롯(국방부 장관, 외교부 장관…)에 임명 — 8석을 채울 때까지 반복 (respin 찬스)
4. 집권 시뮬 관전: 위기를 내각이 막아내는지 **국정 지지율 그래프**로 지켜본다
5. **"집권 N년"** — 리더보드에 도전

## 실행
```bash
npm install
npm run dev
```

## 기술
Vite + React + TypeScript + Motion. 시드 기반 결정론 시뮬(순수 함수). Supabase 리더보드(예정).
에셋 라이선스: [CREDITS.md](CREDITS.md) 참조.
