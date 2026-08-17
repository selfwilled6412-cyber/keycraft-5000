import contentData from "./generated/content.json";
import type { ContentCatalog } from "./types";

export const catalog = contentData as ContentCatalog;

export const missionById = new Map(catalog.missions.map((mission) => [mission.id, mission]));
export const districtById = new Map(catalog.districts.map((district) => [district.id, district]));
export const zoneById = new Map(catalog.zones.map((zone) => [zone.id, zone]));
export const phrasesByMission = new Map(
  catalog.missions.map((mission) => [
    mission.id,
    mission.phraseIds.map((phraseId) => catalog.phrases.find((phrase) => phrase.id === phraseId)!).filter(Boolean),
  ]),
);
