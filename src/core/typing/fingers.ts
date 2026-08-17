export type Hand = "左手" | "右手" | "両手";
export type FingerName = "小指" | "薬指" | "中指" | "人差し指" | "親指";

export interface FingerGuide {
  hand: Hand;
  finger: FingerName;
  label: string;
}

const leftLittle = new Set(["`", "1", "q", "a", "z"]);
const leftRing = new Set(["2", "w", "s", "x"]);
const leftMiddle = new Set(["3", "e", "d", "c"]);
const leftIndex = new Set(["4", "5", "r", "t", "f", "g", "v", "b"]);
const rightIndex = new Set(["6", "7", "y", "u", "h", "j", "n", "m"]);
const rightMiddle = new Set(["8", "i", "k", ","]);
const rightRing = new Set(["9", "o", "l", "."]);

export function getFingerGuide(rawKey: string): FingerGuide {
  const key = rawKey.toLowerCase();
  if (key === " ") return { hand: "両手", finger: "親指", label: "どちらかの親指" };
  if (leftLittle.has(key)) return { hand: "左手", finger: "小指", label: "左手の小指" };
  if (leftRing.has(key)) return { hand: "左手", finger: "薬指", label: "左手の薬指" };
  if (leftMiddle.has(key)) return { hand: "左手", finger: "中指", label: "左手の中指" };
  if (leftIndex.has(key)) return { hand: "左手", finger: "人差し指", label: "左手の人差し指" };
  if (rightIndex.has(key)) return { hand: "右手", finger: "人差し指", label: "右手の人差し指" };
  if (rightMiddle.has(key)) return { hand: "右手", finger: "中指", label: "右手の中指" };
  if (rightRing.has(key)) return { hand: "右手", finger: "薬指", label: "右手の薬指" };
  return { hand: "右手", finger: "小指", label: "右手の小指" };
}

export const keyboardRows = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
] as const;
