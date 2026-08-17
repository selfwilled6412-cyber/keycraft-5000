import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContentCatalog } from "../src/content/types";

const catalog = JSON.parse(await readFile(resolve("src/content/generated/content.json"), "utf8")) as ContentCatalog;

for (let level = 1; level <= 5; level += 1) {
  const phrases = catalog.phrases.filter((phrase) => phrase.level === level);
  const romans = phrases.map((phrase) => phrase.romanization).join("");
  const counts = new Map<string, number>();
  for (const key of romans) counts.set(key, (counts.get(key) ?? 0) + 1);
  const topKeys = [...counts.entries()]
    .filter(([key]) => /[a-z0-9]/.test(key))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => `${key}:${count}`)
    .join(" ");
  const lengths = phrases.map((phrase) => phrase.text.length);
  const average = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  console.log(`LEVEL ${level}: ${phrases.length}件 / 平均${average.toFixed(1)}文字 / 最大${Math.max(...lengths)}文字 / ${topKeys}`);
}
