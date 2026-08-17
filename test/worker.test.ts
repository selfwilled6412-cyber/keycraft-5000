import { beforeEach, describe, expect, it } from "vitest";
import { createExecutionContext, env } from "cloudflare:test";
import worker from "../worker";

const request = async (path: string, method = "GET", body?: unknown): Promise<Response> => {
  const ctx = createExecutionContext();
  return worker.fetch(new Request(`https://keycraft.test${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env, ctx);
};

const createKeyId = async (): Promise<string> => {
  const response = await request("/api/users", "POST", {});
  expect(response.status).toBe(201);
  const body = await response.json<{ keyId: string }>();
  return body.keyId;
};

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM mission_completions").run();
  await env.DB.prepare("DELETE FROM progress").run();
  await env.DB.prepare("DELETE FROM preferences").run();
  await env.DB.prepare("DELETE FROM users").run();
});

describe("Worker API + D1", () => {
  it("health endpointが応答する", async () => {
    const response = await request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, service: "keycraft-5000" });
  });

  it("新規KEY IDを発行して同じIDで復元する", async () => {
    const keyId = await createKeyId();
    expect(keyId).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    const response = await request("/api/session", "POST", { keyId });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ keyId, progress: [], completedMissionIds: [] });
  });

  it("1フレーズ保存を冪等に処理する", async () => {
    const keyId = await createKeyId();
    const payload = { keyId, missionId: "m001", phraseId: "p001-01", accuracy: 98.5, keystrokes: 18, missKeys: { r: 1 } };
    const first = await (await request("/api/progress/phrase", "POST", payload)).json<{ duplicate: boolean; completedCount: number }>();
    const second = await (await request("/api/progress/phrase", "POST", payload)).json<{ duplicate: boolean; completedCount: number }>();
    expect(first).toMatchObject({ duplicate: false, completedCount: 1 });
    expect(second).toMatchObject({ duplicate: true, completedCount: 1 });
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM progress WHERE key_id = ?").bind(keyId).first<number>("count")).toBe(1);
  });

  it("20フレーズでMISSIONを一度だけ完成させ報酬を解放する", async () => {
    const keyId = await createKeyId();
    for (let index = 1; index <= 20; index += 1) {
      const result = await request("/api/progress/phrase", "POST", {
        keyId,
        missionId: "m001",
        phraseId: `p001-${String(index).padStart(2, "0")}`,
        accuracy: 100,
        keystrokes: 10,
        missKeys: {},
      });
      expect(result.status).toBe(200);
    }
    const duplicate = await (await request("/api/progress/phrase", "POST", { keyId, missionId: "m001", phraseId: "p001-20", accuracy: 100, keystrokes: 10, missKeys: {} })).json<{ missionCompleted: boolean }>();
    expect(duplicate.missionCompleted).toBe(false);
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM mission_completions WHERE key_id = ? AND mission_id = ?").bind(keyId, "m001").first<number>("count")).toBe(1);
    const restored = await (await request("/api/session", "POST", { keyId })).json<{ completedMissionIds: string[]; progress: unknown[] }>();
    expect(restored.completedMissionIds).toEqual(["m001"]);
    expect(restored.progress).toHaveLength(20);
  });

  it("別ユーザーの進捗を混線させない", async () => {
    const firstKey = await createKeyId();
    const secondKey = await createKeyId();
    await request("/api/progress/phrase", "POST", { keyId: firstKey, missionId: "m001", phraseId: "p001-01", accuracy: 100, keystrokes: 10, missKeys: {} });
    const secondSession = await (await request("/api/session", "POST", { keyId: secondKey })).json<{ progress: unknown[] }>();
    expect(secondSession.progress).toHaveLength(0);
  });

  it("設定をD1へ保存して復元する", async () => {
    const keyId = await createKeyId();
    const response = await request("/api/preferences", "PUT", { keyId, assistMode: "normal", genres: ["宇宙", "科学", "パソコン"], nickname: "クラフター" });
    expect(response.status).toBe(200);
    const session = await (await request("/api/session", "POST", { keyId })).json<{ preferences: unknown }>();
    expect(session.preferences).toEqual({ assistMode: "normal", genres: ["宇宙", "科学", "パソコン"], nickname: "クラフター" });
  });
});
