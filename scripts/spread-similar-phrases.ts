import type { ContentCatalog, Phrase } from "../src/content/types";

const normalized = (text: string) => text
  .normalize("NFKC")
  .replace(/[\s、。,.!?！？「」『』（）()・ー]/g, "")
  .toLowerCase();

const bigrams = (text: string): Set<string> => {
  const value = normalized(text);
  const result = new Set<string>();
  if (value.length < 2) {
    if (value) result.add(value);
    return result;
  }
  for (let index = 0; index < value.length - 1; index += 1) {
    result.add(value.slice(index, index + 2));
  }
  return result;
};

const similarity = (left: Phrase, right: Phrase): number => {
  const a = bigrams(left.text);
  const b = bigrams(right.text);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union ? intersection / union : 0;
};

const spread = (phrases: Phrase[]): Phrase[] => {
  if (phrases.length <= 2) return phrases;

  const remaining = [...phrases];
  const first = remaining.shift()!;
  const ordered = [first];

  while (remaining.length) {
    const previous = ordered[ordered.length - 1]!;
    let bestIndex = 0;
    let bestSimilarity = Number.POSITIVE_INFINITY;

    for (let index = 0; index < remaining.length; index += 1) {
      const score = similarity(previous, remaining[index]!);
      if (score < bestSimilarity) {
        bestSimilarity = score;
        bestIndex = index;
      }
    }

    ordered.push(remaining.splice(bestIndex, 1)[0]!);
  }

  return ordered;
};

export function spreadSimilarPhrases(catalog: ContentCatalog): ContentCatalog {
  const phraseById = new Map(catalog.phrases.map((phrase) => [phrase.id, phrase]));
  const orderById = new Map<string, number>();

  const missions = catalog.missions.map((mission) => {
    const owned = mission.phraseIds.map((id) => phraseById.get(id)).filter((phrase): phrase is Phrase => Boolean(phrase));
    const reordered = spread(owned);
    reordered.forEach((phrase, index) => orderById.set(phrase.id, index + 1));
    return { ...mission, phraseIds: reordered.map((phrase) => phrase.id) };
  });

  const phrases = catalog.phrases.map((phrase) => ({
    ...phrase,
    order: orderById.get(phrase.id) ?? phrase.order,
  }));

  return { ...catalog, missions, phrases };
}
