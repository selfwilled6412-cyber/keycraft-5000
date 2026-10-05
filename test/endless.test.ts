import { describe, expect, it } from "vitest";
import { catalog } from "../src/content/catalog";
import { selectEndlessPhrases } from "../src/game/endless";

describe("DAILY / ENDLESS", () => {
  it("同じ日とSETでは同じ20問を重複なく返す", () => {
    const first = selectEndlessPhrases(catalog.phrases, "2026-10-06", 0);
    const again = selectEndlessPhrases(catalog.phrases, "2026-10-06", 0);
    expect(first).toHaveLength(20);
    expect(first.map((phrase) => phrase.id)).toEqual(again.map((phrase) => phrase.id));
    expect(new Set(first.map((phrase) => phrase.id)).size).toBe(20);
  });

  it("次のSETでは別の20問を返す", () => {
    const first = selectEndlessPhrases(catalog.phrases, "2026-10-06", 0).map((phrase) => phrase.id);
    const next = selectEndlessPhrases(catalog.phrases, "2026-10-06", 1).map((phrase) => phrase.id);
    expect(next).not.toEqual(first);
  });
});
