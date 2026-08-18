import { describe, expect, it } from "vitest";
import { catalog } from "../src/content/catalog";

const STAGES = [0, 10, 50, 100, 250] as const;

describe("CRAFT MAP growth model", () => {
  it("250 MISSIONが25地区と5ZONEに正しく分配される", () => {
    expect(catalog.zones).toHaveLength(5);
    expect(catalog.districts).toHaveLength(25);
    expect(catalog.missions).toHaveLength(250);

    for (const zone of catalog.zones) {
      const districts = catalog.districts.filter((district) => district.zoneId === zone.id);
      const missions = catalog.missions.filter((mission) => mission.zoneId === zone.id);
      expect(districts).toHaveLength(5);
      expect(missions).toHaveLength(50);
    }

    for (const district of catalog.districts) {
      expect(catalog.missions.filter((mission) => mission.districtId === district.id)).toHaveLength(10);
    }
  });

  it("MISSION完成数と表示されるCRAFT数が1対1で増える", () => {
    for (const stage of STAGES) {
      const visible = catalog.missions.filter((mission) => mission.number <= stage);
      expect(visible).toHaveLength(stage);
    }
  });

  it("250個の報酬はすべて固有で座標も描画可能範囲にある", () => {
    expect(new Set(catalog.missions.map((mission) => mission.reward.id)).size).toBe(250);
    for (const mission of catalog.missions) {
      expect(mission.coordinates.x).toBeGreaterThanOrEqual(0);
      expect(mission.coordinates.x).toBeLessThanOrEqual(100);
      expect(mission.coordinates.y).toBeGreaterThanOrEqual(0);
      expect(mission.coordinates.y).toBeLessThanOrEqual(100);
    }
  });

  it("50 MISSIONごとに1ZONEずつ完成する順序になっている", () => {
    for (let zoneIndex = 0; zoneIndex < catalog.zones.length; zoneIndex += 1) {
      const zone = catalog.zones[zoneIndex]!;
      const start = zoneIndex * 50 + 1;
      const end = start + 49;
      const missionNumbers = catalog.missions.filter((mission) => mission.zoneId === zone.id).map((mission) => mission.number);
      expect(Math.min(...missionNumbers)).toBe(start);
      expect(Math.max(...missionNumbers)).toBe(end);
    }
  });
});
