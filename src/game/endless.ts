import type { Phrase } from "../content/types";

const DAILY_STEP = 7919;
const RUN_STEP = 997;

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectEndlessPhrases(phrases: readonly Phrase[], day: string, run: number, count = 20): Phrase[] {
  if (phrases.length === 0 || count <= 0) return [];
  const start = (hashSeed(day) + run * RUN_STEP) % phrases.length;
  const selected: Phrase[] = [];
  const used = new Set<number>();

  for (let offset = 0; selected.length < Math.min(count, phrases.length) && offset < phrases.length; offset += 1) {
    const index = (start + offset * DAILY_STEP) % phrases.length;
    if (used.has(index)) continue;
    used.add(index);
    const phrase = phrases[index];
    if (phrase) selected.push(phrase);
  }
  for (let index = 0; selected.length < Math.min(count, phrases.length); index += 1) {
    if (used.has(index)) continue;
    used.add(index);
    const phrase = phrases[index];
    if (phrase) selected.push(phrase);
  }
  return selected;
}
