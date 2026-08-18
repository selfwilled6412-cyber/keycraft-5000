import type { AssistMode, PlayerSession } from "../content/types";

interface ApiErrorBody {
  error?: string;
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const data = (await response.json()) as T & ApiErrorBody;
  if (!response.ok) throw new Error(data.error ?? "通信中に問題が発生しました");
  return data;
}

export async function createPlayer(nickname?: string): Promise<{ keyId: string }> {
  return apiRequest("/api/users", { method: "POST", body: JSON.stringify({ nickname: nickname?.trim() || null }) });
}

export interface PlayerLookupMatch {
  keyId: string;
  nickname: string;
  completedPhrases: number;
  completedMissions: number;
}

export async function searchPlayersByName(nickname: string): Promise<{ matches: PlayerLookupMatch[] }> {
  return apiRequest("/api/users/search", { method: "POST", body: JSON.stringify({ nickname: nickname.trim() }) });
}

export async function fetchSession(keyId: string): Promise<PlayerSession> {
  return apiRequest("/api/session", { method: "POST", body: JSON.stringify({ keyId }) });
}

export async function putPreferences(input: {
  keyId: string;
  assistMode: AssistMode;
  genres: string[];
  nickname: string | null;
}): Promise<{ saved: boolean }> {
  return apiRequest("/api/preferences", { method: "PUT", body: JSON.stringify(input) });
}

export interface SavePhraseInput {
  keyId: string;
  phraseId: string;
  missionId: string;
  accuracy: number;
  keystrokes: number;
  missKeys: Record<string, number>;
}

export interface SavePhraseResult {
  saved: boolean;
  duplicate: boolean;
  missionCompleted: boolean;
  completedCount: number;
}

export async function postPhraseProgress(input: SavePhraseInput): Promise<SavePhraseResult> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await apiRequest("/api/progress/phrase", { method: "POST", body: JSON.stringify(input) });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("保存できませんでした");
      if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error("保存できませんでした。通信を確認してください");
}
