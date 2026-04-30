import type { CoordinatesPanel } from "./types";

/**
 * The user's natal chart coordinates — shared across the whole report.
 * Lives at the top of the report once; chapters reference it implicitly.
 *
 * Hard-coded for Lee Wonjun (1994.06.10 21:20 KST, 강원도 강릉) for now.
 * Later this becomes the result of /api/chart for the active user.
 */

export const userIdentity = {
  name: "이원준",
  birth: "1994. 06. 10  21:20 KST",
  place: "강원도 강릉",
  coordsLabel: "37.75°N · 128.88°E",
};

export const userCoordinatesPanel: CoordinatesPanel = {
  bigThree: [
    {
      kind: "rising",
      enLabel: "RISING",
      koLabel: "상승궁",
      sign: "염소자리",
      degree: "12° 22'",
      role: "첫인상의 가면",
      note: "흔들림 없는 외면, 책임감 있는 자세",
    },
    {
      kind: "sun",
      enLabel: "SUN",
      koLabel: "태양",
      sign: "쌍둥이자리",
      degree: "19° 23'",
      role: "의식하는 자아",
      note: "다재다능, 빠른 사고",
    },
    {
      kind: "moon",
      enLabel: "MOON",
      koLabel: "달",
      sign: "게자리",
      degree: "2° 33'",
      role: "감정의 본능",
      note: "정 깊고 사람을 끌어안는",
    },
  ],
  planets: [
    {
      symbol: "☿",
      name: "MERCURY",
      ko: "수성",
      position: "게자리 8° 13'",
      meaning: "사고·소통",
    },
    {
      symbol: "♀",
      name: "VENUS",
      ko: "금성",
      position: "게자리 24° 21'",
      meaning: "사랑의 결",
    },
    {
      symbol: "♂",
      name: "MARS",
      ko: "화성",
      position: "황소자리 13° 03'",
      meaning: "행동·욕망",
    },
    {
      symbol: "♃",
      name: "JUPITER",
      ko: "목성",
      position: "전갈자리 5° 27'",
      meaning: "확장·운",
    },
    {
      symbol: "♄",
      name: "SATURN",
      ko: "토성",
      position: "물고기자리 12° 16'",
      meaning: "책임·시련",
    },
  ],
  keySignature: {
    title: "게자리 7궁 스텔리움 (달·수성·금성)",
    body: "감정을 담당하는 달, 사고를 담당하는 수성, 사랑을 담당하는 금성 — 세 행성이 같은 자리에 한꺼번에 모이는 일은 흔하지 않습니다. 사람과의 관계 안에서 자기 감정과 사고가 가장 또렷해지는 배치이며, 인간관계가 인생의 가장 큰 자산이 되는 사람의 차트입니다.",
  },
};
