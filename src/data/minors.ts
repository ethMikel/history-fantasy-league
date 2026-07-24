// 소이벤트(플레이버) 문구 — 위기 사이 "관전의 서사"를 채우는 내각 인물 활약/부작용.
// {who}=인물 이름, {slot}=부처 이름. 06_SIM_SPEC §6 소이벤트 확장(v0.5). 톤: 키치.
// active = 스탯 높은 인물이 한가한 해에도 일을 냄(+), mishap = 스탯 낮은 인물의 잔실수(−), neutral = 무탈.
export const MINOR_TEXT: Record<'active' | 'mishap' | 'neutral', string[]> = {
  active: [
    '{slot} {who}, 조용한 해에도 일을 벌였다 — 정책 하나가 대박.',
    '{who}(이)가 순시 중 민심을 휘어잡았다. "저 사람 누구야?"',
    '한가한 틈에 {who}(이)가 낡은 제도를 손봤다. 다들 왜 진작 안 했나 싶다.',
    '{who}의 명성만으로 골칫거리 하나가 알아서 풀렸다.',
    '{who}(이)가 이웃나라 사절을 압도했다. 소문이 국경을 넘는다.',
    '{who}(이)가 후학을 길렀다. 씨앗은 다음 세대에 열매 맺는다.',
  ],
  mishap: [
    '{slot} {who}(이)가 사고를 쳤다. 큰일은 아닌데 뒷수습이 귀찮다.',
    '{who}(이)가 회의에서 헛소리를 했고, 하필 기록에 남았다.',
    '{who}의 실책으로 곳간이 조금 샜다. 재정관이 한숨.',
    '{who}(이)가 외빈 앞에서 실수. 외교가 아니라 코미디였다.',
    '{who}(이)가 엉뚱한 데 힘을 썼다. 성과는… 미묘.',
  ],
  neutral: [
    '평범한 한 해. 특별한 일은 없었다.',
    '조정은 조용했다. 폭풍 전야일까.',
    '소소한 행정이 이어졌다. 백성은 무탈.',
    '작은 정사 몇 건. 역사에는 안 남을 하루하루.',
  ],
}

export function minorText(kind: 'active' | 'mishap' | 'neutral', idx: number, who: string, slot: string): string {
  const pool = MINOR_TEXT[kind]
  return pool[idx % pool.length].replaceAll('{who}', who).replaceAll('{slot}', slot)
}
