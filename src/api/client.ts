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

export async function createPlayer(): Promise<{ keyId: string }> {
  return apiRequest("/api/users", { method: "POST", body: "{}" });
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

export type DeliverableKind = "current_settlement" | "mission_clear" | "district_complete" | "hero_unlock";

export interface DeliverableRecord {
  id: string;
  keyId: string;
  kind: DeliverableKind;
  eventKey: string;
  filename: string;
  contentType: string;
  byteSize: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function uploadDeliverable(input: {
  keyId: string;
  kind: DeliverableKind;
  eventKey: string;
  filename: string;
  metadata: Record<string, unknown>;
  blob: Blob;
}): Promise<{ saved: boolean; deliverable: DeliverableRecord }> {
  const form = new FormData();
  form.set("keyId", input.keyId);
  form.set("kind", input.kind);
  form.set("eventKey", input.eventKey);
  form.set("filename", input.filename);
  form.set("metadata", JSON.stringify(input.metadata));
  form.set("file", input.blob, input.filename);
  const response = await fetch("/api/deliverables", { method: "POST", body: form });
  const data = (await response.json()) as { saved?: boolean; deliverable?: DeliverableRecord; error?: string };
  if (!response.ok || !data.deliverable) throw new Error(data.error ?? "成果物を自動保存できませんでした");
  return { saved: Boolean(data.saved), deliverable: data.deliverable };
}

export async function fetchDeliverables(keyId: string): Promise<{ deliverables: DeliverableRecord[] }> {
  return apiRequest("/api/deliverables/list", { method: "POST", body: JSON.stringify({ keyId }) });
}

export function deliverableFileUrl(keyId: string, id: string, download = false): string {
  const query = new URLSearchParams({ keyId });
  if (download) query.set("download", "1");
  return `/api/deliverables/file/${encodeURIComponent(id)}?${query.toString()}`;
}
