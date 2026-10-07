import { beforeEach, describe, expect, it } from "vitest";
import { createExecutionContext, env } from "cloudflare:test";
import worker from "../worker/index-kv";

const request = async (path: string, method = "GET", body?: unknown): Promise<Response> => {
  const ctx = createExecutionContext();
  return worker.fetch(new Request(`https://keycraft.test${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env, ctx);
};

const createKeyId = async (nickname = "テスト利用者"): Promise<string> => {
  const response = await request("/api/users", "POST", { nickname });
  expect(response.status).toBe(201);
  const body = await response.json<{ keyId: string }>();
  return body.keyId;
};

const setNickname = async (keyId: string, nickname: string): Promise<void> => {
  const response = await request("/api/preferences", "PUT", { keyId, assistMode: "beginner", genres: [], nickname });
  expect(response.status).toBe(200);
};

const characterRequest = async (keyId: string, file: File, displayName = "コハク"): Promise<Response> => {
  const form = new FormData();
  form.set("keyId", keyId);
  form.set("displayName", displayName);
  form.set("file", file, file.name);
  return worker.fetch(new Request("https://keycraft.test/api/characters", { method: "POST", body: form }), env, createExecutionContext());
};

const tinyPng = () => new File([
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
], "character.png", { type: "image/png" });

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM player_characters").run();
  await env.DB.prepare("DELETE FROM mission_completions").run();
  await env.DB.prepare("DELETE FROM progress").run();
  await env.DB.prepare("DELETE FROM preferences").run();
  await env.DB.prepare("DELETE FROM users").run();
});

describe("Worker API + D1", () => {
  it("health endpointが応答する", async () => {
    const response = await request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, service: "keycraft-5000", contentVersion: 4, totalMissions: 500, totalPhrases: 10_000, accountPin: false });
  });

  it("新規KEY IDを発行して同じIDで復元する", async () => {
    const keyId = await createKeyId();
    expect(keyId).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    const response = await request("/api/session", "POST", { keyId });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ keyId, preferences: { characterMotionEnabled: true }, progress: [], completedMissionIds: [] });
  });

  it("利用者名がない新規作成を拒否し、PINなしで作成できる", async () => {
    expect((await request("/api/users", "POST", {})).status).toBe(400);
    expect((await request("/api/users", "POST", { nickname: "利用者" })).status).toBe(201);
  });

  it("登録した利用者名を完全一致で検索する", async () => {
    const keyId = await createKeyId();
    await setNickname(keyId, "ゆうき");
    const response = await request("/api/users/search", "POST", { nickname: "ゆうき" });
    expect(response.status).toBe(200);
    const found = await response.json<{ matches: Array<Record<string, unknown>> }>();
    expect(found.matches).toHaveLength(1);
    expect(found.matches[0]).toMatchObject({ nickname: "ゆうき", keySuffix: keyId.slice(-2), completedPhrases: 0, completedMissions: 0 });
    expect(found.matches[0]).not.toHaveProperty("keyId");
    expect(found.matches[0]?.accountRef).toMatch(/^[a-f0-9-]{36}$/i);
    const missing = await request("/api/users/search", "POST", { nickname: "ゆう" });
    expect(await missing.json()).toEqual({ matches: [] });
  });

  it("同じ利用者名は進捗付きの候補として両方返す", async () => {
    const firstKey = await createKeyId();
    const secondKey = await createKeyId();
    await setNickname(firstKey, "さくら");
    await setNickname(secondKey, "さくら");
    await request("/api/progress/phrase", "POST", { keyId: firstKey, missionId: "m001", phraseId: "p001-01", accuracy: 100, keystrokes: 10, missKeys: {} });
    const result = await (await request("/api/users/search", "POST", { nickname: "さくら" })).json<{ matches: Array<{ keySuffix: string; completedPhrases: number; keyId?: string }> }>();
    expect(result.matches).toHaveLength(2);
    expect(result.matches.map((item) => item.completedPhrases).sort()).toEqual([0, 1]);
    expect(result.matches.every((item) => item.keyId === undefined)).toBe(true);
    expect(firstKey).not.toBe(secondKey);
  });

  it("名前検索ではKEY IDを隠し、PINなしでログインする", async () => {
    const keyId = await createKeyId("PINなし利用者");
    const search = await (await request("/api/users/search", "POST", { nickname: "PINなし利用者" })).json<{ matches: Array<{ accountRef: string }> }>();
    const accountRef = search.matches[0]!.accountRef;
    const login = await request("/api/users/login", "POST", { accountRef });
    expect(login.status).toBe(200);
    expect(await login.json()).toEqual({ keyId });
  });

  it("既存のPIN情報を削除せず、PINなしログインへ移行する", async () => {
    const keyId = await createKeyId("旧PIN利用者");
    await env.DB.prepare("UPDATE users SET pin_hash = 'legacy-hash' WHERE key_id = ?").bind(keyId).run();
    const search = await (await request("/api/users/search", "POST", { nickname: "旧PIN利用者" })).json<{ matches: Array<{ accountRef: string }> }>();
    const login = await (await request("/api/users/login", "POST", { accountRef: search.matches[0]!.accountRef })).json<{ keyId: string }>();
    expect(login).toEqual({ keyId });
    expect(await env.DB.prepare("SELECT pin_hash FROM users WHERE key_id = ?").bind(keyId).first<string>("pin_hash")).toBe("legacy-hash");
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

  it("MISSION 500まで受け付け、501以降は拒否する", async () => {
    const keyId = await createKeyId();
    expect((await request("/api/progress/phrase", "POST", { keyId, missionId: "m500", phraseId: "p500-20", accuracy: 100, keystrokes: 18, missKeys: {} })).status).toBe(200);
    expect((await request("/api/progress/phrase", "POST", { keyId, missionId: "m501", phraseId: "p501-01", accuracy: 100, keystrokes: 18, missKeys: {} })).status).toBe(400);
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
    const response = await request("/api/preferences", "PUT", { keyId, assistMode: "normal", genres: ["宇宙", "科学", "パソコン"], nickname: "クラフター", characterMotionEnabled: false });
    expect(response.status).toBe(200);
    const session = await (await request("/api/session", "POST", { keyId })).json<{ preferences: unknown }>();
    expect(session.preferences).toEqual({ assistMode: "normal", genres: ["宇宙", "科学", "パソコン"], nickname: "クラフター", characterMotionEnabled: false });
  });

  it("PINなしで利用者別キャラクターをKVへ保存してセッションと画像から復元する", async () => {
    const keyId = await createKeyId("キャラクター利用者");
    const saved = await characterRequest(keyId, tinyPng());
    expect(saved.status).toBe(201);
    expect(await saved.json()).toMatchObject({ saved: true, character: { displayName: "コハク", contentType: "image/png", byteSize: 9 } });

    const session = await (await request("/api/session", "POST", { keyId })).json<{ character: { displayName: string; imageUrl: string } | null }>();
    expect(session.character?.displayName).toBe("コハク");
    expect(session.character?.imageUrl).toContain(`/api/characters/image/${keyId}?v=`);
    const image = await request(session.character!.imageUrl);
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]));
  });

  it("キャラクター登録は偽装画像を拒否する", async () => {
    const keyId = await createKeyId("画像確認利用者");
    const fake = new File([new TextEncoder().encode("not really a png")], "fake.png", { type: "image/png" });
    expect((await characterRequest(keyId, fake)).status).toBe(415);
    expect(await env.DB.prepare("SELECT COUNT(*) AS count FROM player_characters WHERE key_id = ?").bind(keyId).first<number>("count")).toBe(0);
  });

  it("キャラクター登録だけをPINなしで解除し進捗は維持する", async () => {
    const keyId = await createKeyId("解除利用者");
    expect((await characterRequest(keyId, tinyPng())).status).toBe(201);
    await request("/api/progress/phrase", "POST", { keyId, missionId: "m001", phraseId: "p001-01", accuracy: 100, keystrokes: 10, missKeys: {} });
    expect((await request("/api/characters", "DELETE", { keyId })).status).toBe(200);
    const restored = await (await request("/api/session", "POST", { keyId })).json<{ character: unknown; progress: unknown[] }>();
    expect(restored.character).toBeNull();
    expect(restored.progress).toHaveLength(1);
  });
});
