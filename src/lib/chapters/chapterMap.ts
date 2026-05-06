/**
 * Per-chapter chart-data emphasis map (가이드 §3).
 *
 * Tells the prompt builder which planets / houses to slice from the
 * full chart for each chapter. We still send the *whole* chart as
 * reference, but spotlight the relevant pieces so the model focuses
 * on the right body of evidence.
 */

export type ChapterSpec = {
  no: number;
  romanNo: string;
  title: string;
  /** Sub-items (matched 1:1 with body paragraphs). */
  subItems: string[];
  /** Planets that should drive the interpretation. */
  emphasizePlanets: string[];
  /** Houses that matter most. 1-12. */
  emphasizeHouses: number[];
  /** Axes referenced (ASC / MC / nodes). */
  emphasizeAxes?: string[];
  /** Special chapters get extra blocks. */
  special?: "synergy" | "prescription";
};

export const CHAPTER_SPECS: ChapterSpec[] = [
  {
    no: 1,
    romanNo: "I",
    title: "핵심 좌표",
    subItems: [
      "당신은 어떤 사람인가",
      "처음 마주한 사람들이 당신에게서 가장 먼저 읽어내는 것",
      "당신이 의식적으로 향해 있는 방향",
      "당신이 무의식적으로 끌려가는 자리",
      "당신의 강점이 약점으로 돌아오는 순간",
    ],
    emphasizePlanets: ["태양", "달"],
    emphasizeHouses: [1, 6, 7],
    emphasizeAxes: ["ASC"],
    special: "synergy",
  },
  {
    no: 2,
    romanNo: "II",
    title: "세 가지 자아",
    subItems: [
      "사회적 자리에서 자동으로 켜지는 가면",
      "당신 자신이라고 믿는 모습",
      "누구에게도 보여주지 않는 안쪽",
      "사람들이 가장 자주 오해하는 당신의 한 면",
    ],
    emphasizePlanets: ["태양", "달"],
    emphasizeHouses: [1, 4, 7, 10],
    emphasizeAxes: ["ASC"],
  },
  {
    no: 3,
    romanNo: "III",
    title: "감정 작동 방식",
    subItems: [
      "스트레스가 들어왔을 때 당신이 가장 먼저 보이는 반응",
      "당신이 안전하다고 느끼는 단 하나의 통로",
      "무너지기 직전에 나타나는 신호",
      "흔들리는 시기를 빠르게 통과하는 법",
    ],
    emphasizePlanets: ["달"],
    emphasizeHouses: [4, 8, 12],
  },
  {
    no: 4,
    romanNo: "IV",
    title: "사랑할 때",
    subItems: [
      "당신이 끌리는 사람의 유형",
      "당신이 다가가는 방식",
      "관계에서 매번 같은 자리에서 멈추는 이유",
      "당신을 가장 행복하게 만드는 사랑의 형태",
    ],
    emphasizePlanets: ["금성", "화성"],
    emphasizeHouses: [5, 7, 8],
  },
  {
    no: 5,
    romanNo: "V",
    title: "소통 방식",
    subItems: [
      "말하기 전에 머릿속에서 굴리는 단어들",
      "가까운 사람일수록 표현이 줄어드는 이유",
      "갈등 상황에서 자동으로 꺼내는 카드",
      "당신이 의도와 다르게 오해받는 지점",
    ],
    emphasizePlanets: ["수성"],
    emphasizeHouses: [3, 9],
  },
  {
    no: 6,
    romanNo: "VI",
    title: "일할 때",
    subItems: [
      "당신이 평균 이상으로 작동하는 환경",
      "당신을 시들게 하는 환경의 결정적 한 가지",
      "동료들이 당신에게 매기는 평가",
      "당신의 운이 본격적으로 확장되는 시점",
    ],
    emphasizePlanets: ["태양", "화성", "토성"],
    emphasizeHouses: [6, 10],
    emphasizeAxes: ["MC"],
  },
  {
    no: 7,
    romanNo: "VII",
    title: "돈과의 관계",
    subItems: [
      "돈에 대한 당신의 무의식적 첫 반응",
      "통제가 잘 안 되는 단 하나의 소비",
      "돈이 쌓이는 시기와 새는 시기",
      "당신이 자산을 만드는 방식",
    ],
    emphasizePlanets: ["금성", "목성"],
    emphasizeHouses: [2, 8, 11],
  },
  {
    no: 8,
    romanNo: "VIII",
    title: "그림자",
    subItems: [
      "당신이 평생 외면해 온 한 가지",
      "반복되는 자기 파괴 패턴의 정체",
      "가까운 사람만 본 적 있는 어두운 면",
      "그것을 인정한 후에야 풀리는 매듭",
    ],
    emphasizePlanets: ["토성"],
    emphasizeHouses: [8, 12],
  },
  {
    no: 9,
    romanNo: "IX",
    title: "재능과 사명",
    subItems: [
      "너무 잘해서 당신이 못 알아채는 능력",
      "남들보다 훨씬 빠르게 끝내는 일",
      "이번 생에서 풀어야 할 과제",
      "당신이 가장 빛나는 자리",
    ],
    emphasizePlanets: ["태양", "목성"],
    emphasizeHouses: [9, 10],
    emphasizeAxes: ["MC"],
  },
  {
    no: 10,
    romanNo: "X",
    title: "지금 이 시기",
    subItems: [
      "최근 1-2년 사이 끝나가는 흐름",
      "이미 시작된 새로운 자리의 신호",
      "지금 흔들림이 당신 탓이 아닌 이유",
      "이 시기에 절대 결정해서는 안 되는 일",
    ],
    emphasizePlanets: ["토성", "목성"],
    emphasizeHouses: [],
  },
  {
    no: 11,
    romanNo: "XI",
    title: "앞으로 6개월",
    subItems: [
      "다음 30일의 흐름",
      "60일째 등장할 한 가지 선택",
      "90일째 닫히는 한 자리",
      "6개월의 마지막에 도달하는 자리",
    ],
    emphasizePlanets: ["태양", "달", "금성", "화성", "목성", "토성"],
    emphasizeHouses: [],
  },
  {
    no: 12,
    romanNo: "XII",
    title: "당신을 위한 처방",
    subItems: [
      "매일 한 번 해야 할 한 가지",
      "매주 한 번 챙겨야 할 한 사람",
      "매년 다시 점검할 한 자리",
      "평생 통과해야 할 한 문장",
    ],
    emphasizePlanets: [
      "태양", "달", "수성", "금성", "화성", "목성", "토성",
    ],
    emphasizeHouses: [],
    special: "prescription",
  },
];

export function getChapterSpec(no: number): ChapterSpec {
  const spec = CHAPTER_SPECS.find((s) => s.no === no);
  if (!spec) throw new Error(`unknown chapter no: ${no}`);
  return spec;
}
