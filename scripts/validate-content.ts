import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  DISTRICTS_PER_ZONE,
  MISSIONS_PER_DISTRICT,
  PHRASES_PER_MISSION,
  TOTAL_DISTRICTS,
  TOTAL_MISSIONS,
  TOTAL_PHRASES,
  TOTAL_ZONES,
} from "../src/content/limits";
import type { ContentCatalog } from "../src/content/types";

const catalog = JSON.parse(
  await readFile(resolve("src/content/generated/content.json"), "utf8"),
) as ContentCatalog;

const errors: string[] = [];
const assert = (condition: boolean, message: string): void => {
  if (!condition) errors.push(message);
};
const duplicateValues = (values: string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
};

assert(catalog.zones.length === TOTAL_ZONES, `ZONE数: ${catalog.zones.length} (期待値 ${TOTAL_ZONES})`);
assert(catalog.districts.length === TOTAL_DISTRICTS, `DISTRICT数: ${catalog.districts.length} (期待値 ${TOTAL_DISTRICTS})`);
assert(catalog.missions.length === TOTAL_MISSIONS, `MISSION数: ${catalog.missions.length} (期待値 ${TOTAL_MISSIONS})`);
assert(catalog.phrases.length === TOTAL_PHRASES, `フレーズ数: ${catalog.phrases.length} (期待値 ${TOTAL_PHRASES})`);

for (const zone of catalog.zones) {
  assert(catalog.districts.filter((district) => district.zoneId === zone.id).length === DISTRICTS_PER_ZONE, `${zone.id}のDISTRICT数が${DISTRICTS_PER_ZONE}ではありません`);
}
for (const district of catalog.districts) {
  assert(catalog.missions.filter((mission) => mission.districtId === district.id).length === MISSIONS_PER_DISTRICT, `${district.id}のMISSION数が${MISSIONS_PER_DISTRICT}ではありません`);
}
for (const mission of catalog.missions) {
  const ownedPhrases = catalog.phrases.filter((phrase) => phrase.missionId === mission.id);
  assert(ownedPhrases.length === PHRASES_PER_MISSION, `${mission.id}のフレーズ数: ${ownedPhrases.length}`);
  assert(mission.phraseIds.length === PHRASES_PER_MISSION, `${mission.id}のphraseIds数: ${mission.phraseIds.length}`);
  assert(mission.level >= 1 && mission.level <= TOTAL_ZONES, `${mission.id}の難易度が範囲外です`);
  assert(Boolean(mission.title.trim()), `${mission.id}の目的が空です`);
  assert(Boolean(mission.reward.name.trim()), `${mission.id}の報酬が空です`);
}

const duplicateTexts = duplicateValues(catalog.phrases.map((phrase) => phrase.text));
const duplicatePhraseIds = duplicateValues(catalog.phrases.map((phrase) => phrase.id));
const duplicateMissionIds = duplicateValues(catalog.missions.map((mission) => mission.id));
const duplicateRewards = duplicateValues(catalog.missions.map((mission) => mission.reward.name));
assert(duplicateTexts.length === 0, `重複フレーズ: ${duplicateTexts.slice(0, 5).join(" / ")}`);
assert(duplicatePhraseIds.length === 0, `重複phraseId: ${duplicatePhraseIds.join(", ")}`);
assert(duplicateMissionIds.length === 0, `重複missionId: ${duplicateMissionIds.join(", ")}`);
assert(duplicateRewards.length === 0, `重複報酬: ${duplicateRewards.slice(0, 5).join(" / ")}`);

const prohibitedWords = ["殺す", "暴力", "差別", "賭博", "ギャンブル", "性的", "麻薬", "爆弾"];
for (const phrase of catalog.phrases) {
  assert(Boolean(phrase.text.trim()), `${phrase.id}の本文が空です`);
  assert(Boolean(phrase.reading.trim()), `${phrase.id}の読みが空です`);
  assert(Boolean(phrase.romanization.trim()), `${phrase.id}のromanizationが空です`);
  assert(phrase.text.length <= 100, `${phrase.id}が長すぎます (${phrase.text.length}文字)`);
  assert(phrase.text.length >= 2, `${phrase.id}が短すぎます`);
  assert(/^[a-z0-9,./!'? -]+$/.test(phrase.romanization), `${phrase.id}のromanizationに不正文字があります`);
  assert(phrase.level >= 1 && phrase.level <= TOTAL_ZONES, `${phrase.id}の難易度が範囲外です`);
  for (const word of prohibitedWords) {
    assert(!phrase.text.includes(word), `${phrase.id}に禁止語「${word}」があります`);
  }
}

const levelOneRomans = catalog.phrases.filter((phrase) => phrase.level === 1).map((phrase) => phrase.romanization).join("");
const advancedRomans = catalog.phrases.filter((phrase) => phrase.level >= 4).map((phrase) => phrase.romanization).join("");
assert(!/[0-9]/.test(levelOneRomans), "LEVEL 1に数字キーが混ざっています");
assert(/[0-9]/.test(advancedRomans), "LEVEL 4以上に数字キーがありません");
assert(/[,.]/.test(advancedRomans), "LEVEL 4以上に句読点キーがありません");

if (errors.length > 0) {
  console.error(`コンテンツ検品で${errors.length}件の問題が見つかりました。`);
  for (const error of errors.slice(0, 50)) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Content validation passed.");
  console.log(`${TOTAL_ZONES} zones / ${TOTAL_DISTRICTS} districts / ${TOTAL_MISSIONS} missions / ${TOTAL_PHRASES.toLocaleString()} unique phrases / ${TOTAL_MISSIONS} unique rewards`);
}
