import { describe, expect, it } from "vitest";
import { catalog } from "../src/content/catalog";
import { isMissionAvailable, nextMission } from "../src/game/progress";

describe("静的コンテンツ", () => {
  it("数量設計が5 × 5 × 10 × 20になっている", () => {
    expect(catalog.zones).toHaveLength(5);
    expect(catalog.districts).toHaveLength(25);
    expect(catalog.missions).toHaveLength(250);
    expect(catalog.phrases).toHaveLength(5000);
    for (const mission of catalog.missions) {
      expect(catalog.phrases.filter((phrase) => phrase.missionId === mission.id)).toHaveLength(20);
    }
  });

  it("フレーズ・ID・報酬に重複がない", () => {
    expect(new Set(catalog.phrases.map((phrase) => phrase.text)).size).toBe(5000);
    expect(new Set(catalog.phrases.map((phrase) => phrase.id)).size).toBe(5000);
    expect(new Set(catalog.missions.map((mission) => mission.id)).size).toBe(250);
    expect(new Set(catalog.missions.map((mission) => mission.reward.name)).size).toBe(250);
  });

  it("全フレーズに読みとローマ字がある", () => {
    expect(catalog.phrases.every((phrase) => phrase.text && phrase.reading && phrase.romanization)).toBe(true);
    expect(catalog.phrases.every((phrase) => phrase.level >= 1 && phrase.level <= 5)).toBe(true);
  });

  it("現在の難易度ZONEだけを開放する", () => {
    expect(isMissionAvailable(catalog.missions[49]!, [])).toBe(true);
    expect(isMissionAvailable(catalog.missions[50]!, [])).toBe(false);

    const zoneOneComplete = catalog.missions.slice(0, 50).map((mission) => mission.id);
    expect(isMissionAvailable(catalog.missions[50]!, zoneOneComplete)).toBe(true);
    expect(isMissionAvailable(catalog.missions[100]!, zoneOneComplete)).toBe(false);
  });

  it("好みのジャンルを現在のZONE内のおすすめへ反映する", () => {
    const recommended = nextMission(catalog, [], ["食べ物"]);
    expect(recommended.genre).toBe("食べ物");
    expect(recommended.zoneId).toBe("z1");
  });
});
