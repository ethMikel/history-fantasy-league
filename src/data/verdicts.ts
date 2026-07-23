// 판정 코멘트 카피 — 11_CRISIS_NARRATIVE: 유머는 결과(판정)에, 인과는 명확히.
// 성공/실패 × 6축. {who}=담당자, {crisis}=위기명. 밈+키치 톤 (예고문은 진지, 여기서 폭발)
import type { Axis } from '../lib/types'

interface VerdictSet { ok: string[]; fail: string[] }

// {who} = 담당 장관 이름, {crisis} = 위기 이벤트명
export const VERDICTS: Record<Axis, VerdictSet> = {
  mil: {
    ok: [
      '{who} 장군, 적을 국경 밖으로 쓸어버렸다. 백성들이 밤에 발 뻗고 잔다.',
      '{who}(이)가 전선에 나타나자 적이 먼저 후퇴했다. 이름값이 전투력이다.',
      '{crisis}? {who} 앞에서는 그냥 훈련이었다.',
    ],
    fail: [
      '{who}(이)가 병법을 논하는 사이 성문이 열렸다. 창은 멋있었는데 못 썼다.',
      '{crisis} — {who}(은)는 용감했으나, 용감함만으로는 안 됐다.',
      '{who}에게 군사를 맡긴 게 실수였다. 지도만 잘 봤어도…',
    ],
  },
  str: {
    ok: [
      '{who}(이)가 적의 수를 세 수 앞서 읽었다. 음모는 시작도 전에 끝났다.',
      '{crisis}의 배후를 {who}(이)가 하룻밤에 밝혀냈다. 소름.',
      '{who} 앞에서 잔머리는 통하지 않는다.',
    ],
    fail: [
      '{who}(이)가 한 수 앞을 못 봤다. 상대가 두 수 앞을 봤을 뿐.',
      '{crisis} — {who}(은)는 끝까지 누가 배후인지 몰랐다.',
      '{who}의 계략이 오히려 역이용당했다. 판을 짜다 판에 먹혔다.',
    ],
  },
  dom: {
    ok: [
      '{who}(이)가 곳간을 채우고 민심을 다독였다. 태평성대 소리가 절로 난다.',
      '{crisis}? {who}의 행정 앞에 위기가 서류 한 장으로 정리됐다.',
      '{who} 덕에 세금은 걷히고 백성은 웃는다. 이게 정치다.',
    ],
    fail: [
      '{who}(이)가 곳간을 열자 이미 텅 비어 있었다. 숫자가 안 맞았다.',
      '{crisis} — {who}의 정책은 훌륭했다. 종이 위에서만.',
      '{who}(이)가 손 쓰기도 전에 창고 열쇠가 녹슬어 있었다.',
    ],
  },
  dip: {
    ok: [
      '{who}(이)가 말 몇 마디로 전쟁을 막았다. 혀가 칼보다 셌다.',
      '{crisis}? {who}(이)가 상대를 저녁 식사에 초대해 해결했다.',
      '{who}의 협상 테이블에서 적이 친구가 되어 돌아갔다.',
    ],
    fail: [
      '{who}(이)가 협상장에서 말문이 막혔다. 통역 탓은 아니었다.',
      '{crisis} — {who}(은)는 최선을 다했지만, 상대가 더 노련했다.',
      '{who}(이)가 던진 농담에 사신이 국서를 찢고 나갔다.',
    ],
  },
  sci: {
    ok: [
      '{who}(이)가 원인을 밝혀냈다. 하늘의 저주가 아니라 물길 문제였다.',
      '{crisis}? {who}의 지식 앞에 미신은 힘을 잃었다.',
      '{who}(이)가 며칠 만에 해법을 도면으로 그려냈다. 시대를 앞섰다.',
    ],
    fail: [
      '{who}(이)가 원리는 알았으나, 시대가 아직 그를 따라오지 못했다.',
      '{crisis} — {who}의 연구는 반년 늦게 완성됐다.',
      '{who}(이)가 실험하는 사이 문제가 먼저 번졌다.',
    ],
  },
  cul: {
    ok: [
      '{who}(이)가 붓 한 자루로 갈라진 민심을 하나로 묶었다.',
      '{crisis}? {who}의 이름 석 자에 온 나라가 자부심을 되찾았다.',
      '{who} 덕에 거리마다 노래가 돌아왔다. 문화의 힘이다.',
    ],
    fail: [
      '{who}(이)가 명작을 남겼으나, 지금 필요한 건 명작이 아니었다.',
      '{crisis} — {who}(은)는 아름다웠지만, 그걸로는 부족했다.',
      '{who}(이)가 예술을 논하는 사이 광장의 불이 더 커졌다.',
    ],
  },
}

// 무임소 구원등판 성공 시 앞에 붙는 수식
export const FLEX_HERO = '뜻밖에도 '
// MVP(최고 마진 성공)·역적(최악 실패) 라벨
export const MVP_LABEL = '👑 구국공신'
export const GOAT_LABEL = '💀 역적'

// 결정론적 판정 코멘트 선택 (seed+연차로 고정 — 리플레이 일관성)
export function pickVerdict(
  axis: Axis, success: boolean, who: string, crisis: string, salt: number,
): string {
  const set = VERDICTS[axis][success ? 'ok' : 'fail']
  const line = set[salt % set.length]
  return line.replace(/\{who\}/g, who).replace(/\{crisis\}/g, crisis)
}
