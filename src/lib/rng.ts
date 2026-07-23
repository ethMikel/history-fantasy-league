// 시드 기반 결정론 난수 (06_SIM_SPEC §1)
// 규칙: 게임 로직에서 Math.random 호출 금지 — 반드시 이 모듈의 스트림 사용.
// 연출(파티클 등)만 Math.random 허용.

export type Rng = () => number

// mulberry32 — 32bit 시드 PRNG (Red Blob Games 검증 계열)
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 문자열 시드 → 32bit 해시 (cyrb 계열 축약판 — charCode 합산 금지 규칙 대응)
export function hashSeed(str: string): number {
  let h1 = 0xdeadbeef ^ str.length
  let h2 = 0x41c6ce57 ^ str.length
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h1 ^ h2) >>> 0
}

// 스트림 3개 분리 (06_SIM_SPEC §1): 스핀·후보 / 위기 / 판정
// 연출이 로직 난수를 소비하면 결과 전체가 뒤바뀜 (Deterministic Butterfly)
export interface GameRngStreams {
  pool: Rng
  crisis: Rng
  check: Rng
}

export function createStreams(masterSeed: number): GameRngStreams {
  return {
    pool: mulberry32(hashSeed(`pool:${masterSeed}`)),
    crisis: mulberry32(hashSeed(`crisis:${masterSeed}`)),
    check: mulberry32(hashSeed(`check:${masterSeed}`)),
  }
}

// 유틸: 정수 [0, n), 배열 셔플 (Fisher-Yates), 픽
export const randInt = (rng: Rng, n: number) => Math.floor(rng() * n)

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
