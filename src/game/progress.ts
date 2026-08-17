import type { ContentCatalog, Mission, PhraseProgress } from "../content/types";

export function isMissionAvailable(mission: Mission, completedMissionIds: string[]): boolean {
  if (completedMissionIds.includes(mission.id)) return true;

  // A whole zone opens at once so genre preferences can influence recommendations
  // without letting players skip into a later difficulty level.
  const zoneNumber = Number(mission.zoneId.slice(1));
  const firstMissionInZone = (zoneNumber - 1) * 50 + 1;
  for (let number = 1; number < firstMissionInZone; number += 1) {
    const prerequisite = `m${String(number).padStart(3, "0")}`;
    if (!completedMissionIds.includes(prerequisite)) return false;
  }
  return true;
}

export function missionPhraseCount(missionId: string, progress: PhraseProgress[]): number {
  return progress.filter((item) => item.missionId === missionId).length;
}

export function nextMission(catalog: ContentCatalog, completedMissionIds: string[], genres: string[]): Mission {
  const available = catalog.missions.filter((mission) => !completedMissionIds.includes(mission.id) && isMissionAvailable(mission, completedMissionIds));
  return available.find((mission) => genres.includes(mission.genre)) ?? available[0] ?? catalog.missions[0]!;
}

export function completedDistrictCount(catalog: ContentCatalog, completedMissionIds: string[]): number {
  return catalog.districts.filter((district) =>
    catalog.missions.filter((mission) => mission.districtId === district.id).every((mission) => completedMissionIds.includes(mission.id)),
  ).length;
}

export function aggregateMissKeys(progress: PhraseProgress[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of progress) {
    for (const [key, count] of Object.entries(item.missKeys)) counts.set(key, (counts.get(key) ?? 0) + count);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
