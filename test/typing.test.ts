import { describe, expect, it } from "vitest";
import { RomanizationMatcher, calculateAccuracy, getFingerGuide, toCanonicalRoman } from "../src/core/typing";

const type = (reading: string, keys: string): RomanizationMatcher => {
  const matcher = new RomanizationMatcher(reading);
  for (const key of keys) matcher.press(key);
  return matcher;
};

describe("RomanizationMatcher", () => {
  it.each([
    ["し", "shi"], ["し", "si"], ["ち", "chi"], ["ち", "ti"], ["つ", "tsu"], ["つ", "tu"],
    ["ふ", "fu"], ["ふ", "hu"], ["じ", "ji"], ["じ", "zi"], ["しゃ", "sha"], ["しゃ", "sya"],
  ])("%s は %s で入力できる", (reading, keys) => {
    expect(type(reading, keys).snapshot().completed).toBe(true);
  });

  it("小さいっを子音重ね・xtu・ltuで入力できる", () => {
    expect(type("きって", "kitte").snapshot().completed).toBe(true);
    expect(type("きって", "kixtute").snapshot().completed).toBe(true);
    expect(type("きって", "kil tute".replace(" ", "")).snapshot().completed).toBe(true);
  });

  it("小さいっの案内は子音重ねをxtu・ltuより優先する", () => {
    const matcher = new RomanizationMatcher("ぽけっと");
    for (const key of "poke") matcher.press(key);
    expect(matcher.snapshot().nextKeys).toEqual(["t", "x", "l"]);
    expect(matcher.snapshot().nextKeys[0]).toBe("t");
    matcher.press("t");
    expect(matcher.snapshot().nextKeys[0]).toBe("t");
  });

  it("母音前のんは曖昧な単独nを許さない", () => {
    expect(type("んあ", "na").snapshot().completed).toBe(false);
    expect(type("んあ", "nna").snapshot().completed).toBe(true);
  });

  it("誤入力で進まずミスだけが増える", () => {
    const matcher = new RomanizationMatcher("かさ");
    const before = matcher.snapshot();
    const result = matcher.press("x");
    expect(result.accepted).toBe(false);
    expect(result.tokenProgress).toBe(before.tokenProgress);
    expect(result.misses).toBe(1);
    expect(result.missKeys).toEqual({ x: 1 });
  });

  it("長音と句読点を処理する", () => {
    expect(type("げーむ、すたーと。", "ge-mu,suta-to.").snapshot().completed).toBe(true);
  });

  it("上級フレーズの数字をそのまま入力できる", () => {
    expect(type("10じにいく", "10jiniiku").snapshot().completed).toBe(true);
  });

  it("正確さは速度と無関係に計算する", () => {
    expect(calculateAccuracy(100, 4)).toBe(96);
    expect(calculateAccuracy(0, 0)).toBe(100);
  });

  it("次キーに対応する手と指を返す", () => {
    expect(getFingerGuide("f").label).toBe("左手の人差し指");
    expect(getFingerGuide("j").label).toBe("右手の人差し指");
    expect(getFingerGuide(" ").finger).toBe("親指");
  });

  it("代表的な読みを正規ローマ字へ変換する", () => {
    expect(toCanonicalRoman("きょうは、いいてんき。")).toBe("kyouha,iitenki.");
  });
});
