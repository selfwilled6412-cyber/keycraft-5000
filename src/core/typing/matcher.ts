import { tokenizeReading, type RomanToken } from "./romanization";

interface PathState {
  tokenIndex: number;
  optionIndex: number;
  charIndex: number;
}

export interface TypingSnapshot {
  completed: boolean;
  nextKeys: string[];
  tokenProgress: number;
  typed: string;
  misses: number;
  keystrokes: number;
  missKeys: Record<string, number>;
}

export interface KeyResult extends TypingSnapshot {
  accepted: boolean;
}

const dedupePaths = (paths: PathState[]): PathState[] => {
  const seen = new Set<string>();
  return paths.filter((path) => {
    const key = `${path.tokenIndex}:${path.optionIndex}:${path.charIndex}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const initialPaths = (tokens: RomanToken[], tokenIndex = 0): PathState[] => {
  const token = tokens[tokenIndex];
  if (!token) return [{ tokenIndex: tokens.length, optionIndex: 0, charIndex: 0 }];
  return token.options.map((_option, optionIndex) => ({ tokenIndex, optionIndex, charIndex: 0 }));
};

export class RomanizationMatcher {
  readonly tokens: RomanToken[];
  private paths: PathState[];
  private typedValue = "";
  private missCount = 0;
  private strokeCount = 0;
  private missKeyCounts: Record<string, number> = {};

  constructor(reading: string) {
    this.tokens = tokenizeReading(reading);
    this.paths = initialPaths(this.tokens);
  }

  press(rawKey: string): KeyResult {
    const key = rawKey.toLowerCase();
    if (key.length !== 1 || this.isComplete()) {
      return { ...this.snapshot(), accepted: false };
    }

    this.strokeCount += 1;
    const advanced: PathState[] = [];

    for (const path of this.paths) {
      if (path.tokenIndex >= this.tokens.length) continue;
      const option = this.tokens[path.tokenIndex]?.options[path.optionIndex];
      if (!option || option[path.charIndex] !== key) continue;

      const nextCharIndex = path.charIndex + 1;
      if (nextCharIndex < option.length) {
        advanced.push({ ...path, charIndex: nextCharIndex });
      } else {
        advanced.push(...initialPaths(this.tokens, path.tokenIndex + 1));
      }
    }

    if (advanced.length === 0) {
      this.missCount += 1;
      this.missKeyCounts[key] = (this.missKeyCounts[key] ?? 0) + 1;
      return { ...this.snapshot(), accepted: false };
    }

    this.paths = dedupePaths(advanced);
    this.typedValue += key;
    return { ...this.snapshot(), accepted: true };
  }

  snapshot(): TypingSnapshot {
    const nextKeys = unique(
      this.paths.flatMap((path) => {
        if (path.tokenIndex >= this.tokens.length) return [];
        const option = this.tokens[path.tokenIndex]?.options[path.optionIndex];
        const nextKey = option?.[path.charIndex];
        return nextKey ? [nextKey] : [];
      }),
    );
    const tokenProgress = Math.max(0, ...this.paths.map((path) => path.tokenIndex));

    return {
      completed: this.isComplete(),
      nextKeys,
      tokenProgress,
      typed: this.typedValue,
      misses: this.missCount,
      keystrokes: this.strokeCount,
      missKeys: { ...this.missKeyCounts },
    };
  }

  private isComplete(): boolean {
    return this.paths.some((path) => path.tokenIndex >= this.tokens.length);
  }
}

const unique = (values: string[]): string[] => [...new Set(values)].sort();

export function calculateAccuracy(keystrokes: number, misses: number): number {
  if (keystrokes === 0) return 100;
  return Math.max(0, Math.round(((keystrokes - misses) / keystrokes) * 1000) / 10);
}
