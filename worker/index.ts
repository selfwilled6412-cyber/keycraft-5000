const KEY_ID_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;
const MISSION_ID_PATTERN = /^m(\d{3})$/;
const PHRASE_ID_PATTERN = /^p(\d{3})-(\d{2})$/;
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DELIVERABLE_EVENT_PATTERN = /^[a-z0-9:_-]{1,96}$/i;
const MAX_DELIVERABLE_BYTES = 8 * 1024 * 1024;
const ALLOWED_GENRES = new Set([
  "食べ物", "動物", "ゲーム", "スポーツ", "音楽", "旅行", "乗り物", "科学", "宇宙", "パソコン", "自然", "ものづくり",
]);
const DELIVERABLE_KINDS = new Set([
  "current_settlement",
  "mission_clear",
  "district_complete",
  "hero_unlock",
]);

type AppEnv = Env & { DELIVERABLES: R2Bucket };

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

interface UserRow {
  key_id: string;
  nickname: string | null;
  created_at: string;
}

interface PlayerSearchRow {
  key_id: string;
  nickname: string;
  completed_phrases: number;
  completed_missions: number;
}

interface PreferenceRow {
  assist_mode: "beginner" | "normal" | "challenge";
  genres_json: string;
}

interface ProgressRow {
  phrase_id: string;
  mission_id: string;
  accuracy: number;
  keystrokes: number;
  miss_keys_json: string;
  completed_at: string;
}

interface MissionCompletionRow {
  mission_id: string;
}

interface DeliverableRow {
  id: string;
  key_id: string;
  kind: string;
  event_key: string;
  filename: string;
  object_key: string;
  content_type: string;
  byte_size: number;
  metadata_json: string;
  created_at: string;
}

const json = (data: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "same-origin");
  return Response.json(data, { ...init, headers });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

async function readJsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new HttpError(415, "JSON形式で送信してください");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "リクエスト本文がありません");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_384) {
      await reader.cancel();
      throw new HttpError(413, "リクエストが大きすぎます");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new HttpError(400, "JSONを読み取れませんでした");
  }
}

function secureKeyId(): string {
  let result = "";
  const limit = 256 - (256 % KEY_ALPHABET.length);
  while (result.length < 6) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      result += KEY_ALPHABET[byte % KEY_ALPHABET.length];
      if (result.length === 6) break;
    }
  }
  return result;
}

function parseKeyId(value: unknown): string {
  const keyId = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!KEY_ID_PATTERN.test(keyId)) throw new HttpError(400, "KEY IDは6文字で入力してください");
  return keyId;
}

function parseNickname(value: unknown): string {
  const nickname = typeof value === "string" ? value.trim() : "";
  if (!nickname) throw new HttpError(400, "利用者名を入力してください");
  if (nickname.length > 24) throw new HttpError(400, "利用者名は24文字以内です");
  return nickname;
}

function validateContentIds(phraseId: unknown, missionId: unknown): { phraseId: string; missionId: string } {
  if (typeof phraseId !== "string" || typeof missionId !== "string") throw new HttpError(400, "進捗IDが不正です");
  const phraseMatch = PHRASE_ID_PATTERN.exec(phraseId);
  const missionMatch = MISSION_ID_PATTERN.exec(missionId);
  if (!phraseMatch || !missionMatch) throw new HttpError(400, "進捗IDが不正です");
  const phraseMission = Number(phraseMatch[1]);
  const phraseOrder = Number(phraseMatch[2]);
  const missionNumber = Number(missionMatch[1]);
  if (missionNumber < 1 || missionNumber > 250 || phraseMission !== missionNumber || phraseOrder < 1 || phraseOrder > 20) {
    throw new HttpError(400, "フレーズとMISSIONの組み合わせが不正です");
  }
  return { phraseId, missionId };
}

async function requireUser(env: AppEnv, keyId: string): Promise<void> {
  const user = await env.DB.prepare("SELECT 1 AS found FROM users WHERE key_id = ?").bind(keyId).first<{ found: number }>();
  if (!user) throw new HttpError(404, "KEY IDが見つかりません");
}

async function createUser(env: AppEnv): Promise<Response> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const keyId = secureKeyId();
    const results = await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO users (key_id) VALUES (?)").bind(keyId),
      env.DB.prepare("INSERT OR IGNORE INTO preferences (key_id) VALUES (?)").bind(keyId),
    ]);
    if ((results[0]?.meta.changes ?? 0) > 0) {
      return json({ keyId }, { status: 201 });
    }
  }
  throw new HttpError(503, "KEY IDを発行できませんでした。もう一度お試しください");
}

async function searchUsers(request: Request, env: AppEnv): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isRecord(body)) throw new HttpError(400, "入力内容が不正です");
  const nickname = parseNickname(body.nickname);
  const result = await env.DB.prepare(`
    SELECT
      u.key_id,
      u.nickname,
      (SELECT COUNT(*) FROM progress p WHERE p.key_id = u.key_id) AS completed_phrases,
      (SELECT COUNT(*) FROM mission_completions m WHERE m.key_id = u.key_id) AS completed_missions
    FROM users u
    WHERE u.nickname = ? COLLATE NOCASE
    ORDER BY u.last_seen_at DESC
    LIMIT 10
  `).bind(nickname).all<PlayerSearchRow>();
  const matches = (result.results ?? [])
    .filter((row): row is PlayerSearchRow => typeof row.key_id === "string" && typeof row.nickname === "string")
    .map((row) => ({
      keyId: row.key_id,
      nickname: row.nickname,
      completedPhrases: Number(row.completed_phrases) || 0,
      completedMissions: Number(row.completed_missions) || 0,
    }));
  return json({ matches });
}

async function getSession(request: Request, env: AppEnv): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isRecord(body)) throw new HttpError(400, "入力内容が不正です");
  const keyId = parseKeyId(body.keyId);
  const [userResult, preferenceResult, progressResult, missionResult] = await env.DB.batch([
    env.DB.prepare("SELECT key_id, nickname, created_at FROM users WHERE key_id = ?").bind(keyId),
    env.DB.prepare("SELECT assist_mode, genres_json FROM preferences WHERE key_id = ?").bind(keyId),
    env.DB.prepare("SELECT phrase_id, mission_id, accuracy, keystrokes, miss_keys_json, completed_at FROM progress WHERE key_id = ? ORDER BY completed_at").bind(keyId),
    env.DB.prepare("SELECT mission_id FROM mission_completions WHERE key_id = ? ORDER BY completed_at").bind(keyId),
  ]);
  const user = userResult?.results[0] as UserRow | undefined;
  if (!user) throw new HttpError(404, "KEY IDが見つかりません");
  const preferences = preferenceResult?.results[0] as PreferenceRow | undefined;
  const progress = (progressResult?.results ?? []).filter(isProgressRow);
  const completed = (missionResult?.results ?? []).filter(isMissionCompletionRow);
  await env.DB.prepare("UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE key_id = ?").bind(keyId).run();

  return json({
    keyId,
    createdAt: user.created_at,
    preferences: {
      assistMode: preferences?.assist_mode ?? "beginner",
      genres: safelyParseGenres(preferences?.genres_json),
      nickname: user.nickname,
    },
    progress: progress.map((row) => ({
      phraseId: row.phrase_id,
      missionId: row.mission_id,
      accuracy: row.accuracy,
      keystrokes: row.keystrokes,
      missKeys: safelyParseMissKeys(row.miss_keys_json),
      completedAt: row.completed_at,
    })),
    completedMissionIds: completed.map((row) => row.mission_id),
  });
}

const safelyParseGenres = (value: string | undefined): string[] => {
  try {
    const parsed = JSON.parse(value ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && ALLOWED_GENRES.has(item)).slice(0, 3) : [];
  } catch {
    return [];
  }
};

const isProgressRow = (value: unknown): value is ProgressRow =>
  isRecord(value)
  && typeof value.phrase_id === "string"
  && typeof value.mission_id === "string"
  && typeof value.accuracy === "number"
  && typeof value.keystrokes === "number"
  && typeof value.miss_keys_json === "string"
  && typeof value.completed_at === "string";

const isMissionCompletionRow = (value: unknown): value is MissionCompletionRow =>
  isRecord(value) && typeof value.mission_id === "string";

const safelyParseMissKeys = (value: string): Record<string, number> => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) return {};
    const result: Record<string, number> = {};
    for (const [key, count] of Object.entries(parsed)) {
      if (key.length === 1 && typeof count === "number" && Number.isInteger(count) && count > 0) result[key] = count;
    }
    return result;
  } catch {
    return {};
  }
};

async function updatePreferences(request: Request, env: AppEnv): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isRecord(body)) throw new HttpError(400, "入力内容が不正です");
  const keyId = parseKeyId(body.keyId);
  const assistMode = body.assistMode;
  if (assistMode !== "beginner" && assistMode !== "normal" && assistMode !== "challenge") {
    throw new HttpError(400, "ASSIST MODEが不正です");
  }
  if (!Array.isArray(body.genres) || body.genres.length > 3 || body.genres.some((genre) => typeof genre !== "string" || !ALLOWED_GENRES.has(genre))) {
    throw new HttpError(400, "ジャンルは3つまで選べます");
  }
  const nickname = body.nickname === null || body.nickname === undefined ? null : String(body.nickname).trim();
  if (nickname !== null && nickname.length > 24) throw new HttpError(400, "ニックネームは24文字以内です");

  const results = await env.DB.batch([
    env.DB.prepare("UPDATE users SET nickname = ?, last_seen_at = CURRENT_TIMESTAMP WHERE key_id = ?").bind(nickname || null, keyId),
    env.DB.prepare("UPDATE preferences SET assist_mode = ?, genres_json = ?, updated_at = CURRENT_TIMESTAMP WHERE key_id = ?").bind(assistMode, JSON.stringify(body.genres), keyId),
  ]);
  if ((results[0]?.meta.changes ?? 0) === 0) throw new HttpError(404, "KEY IDが見つかりません");
  return json({ saved: true });
}

async function savePhrase(request: Request, env: AppEnv): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isRecord(body)) throw new HttpError(400, "入力内容が不正です");
  const keyId = parseKeyId(body.keyId);
  const { phraseId, missionId } = validateContentIds(body.phraseId, body.missionId);
  const accuracy = Number(body.accuracy);
  const keystrokes = Number(body.keystrokes);
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) throw new HttpError(400, "正確さの値が不正です");
  if (!Number.isInteger(keystrokes) || keystrokes < 0 || keystrokes > 10_000) throw new HttpError(400, "入力数が不正です");
  const missKeys = safelyParseMissKeys(JSON.stringify(body.missKeys ?? {}));

  await requireUser(env, keyId);

  const results = await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO progress (key_id, phrase_id, mission_id, accuracy, keystrokes, miss_keys_json) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(keyId, phraseId, missionId, accuracy, keystrokes, JSON.stringify(missKeys)),
    env.DB.prepare("INSERT OR IGNORE INTO mission_completions (key_id, mission_id, reward_id) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM progress WHERE key_id = ? AND mission_id = ?) >= 20")
      .bind(keyId, missionId, `reward-${missionId}`, keyId, missionId),
    env.DB.prepare("UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE key_id = ?").bind(keyId),
  ]);

  const completedCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM progress WHERE key_id = ? AND mission_id = ?")
    .bind(keyId, missionId)
    .first<number>("count");
  return json({
    saved: true,
    duplicate: (results[0]?.meta.changes ?? 0) === 0,
    missionCompleted: (results[1]?.meta.changes ?? 0) > 0,
    completedCount: completedCount ?? 0,
  });
}

function parseDeliverableMetadata(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "{}";
  if (raw.length > 4096) throw new HttpError(413, "成果物メタデータが大きすぎます");
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) throw new Error("metadata must be an object");
    return JSON.stringify(parsed);
  } catch {
    throw new HttpError(400, "成果物メタデータが不正です");
  }
}

function parseDeliverableKind(value: FormDataEntryValue | null): string {
  const kind = typeof value === "string" ? value.trim() : "";
  if (!DELIVERABLE_KINDS.has(kind)) throw new HttpError(400, "成果物の種類が不正です");
  return kind;
}

function parseEventKey(value: FormDataEntryValue | null): string {
  const eventKey = typeof value === "string" ? value.trim() : "";
  if (!DELIVERABLE_EVENT_PATTERN.test(eventKey)) throw new HttpError(400, "成果物イベントIDが不正です");
  return eventKey;
}

function parseFilename(value: FormDataEntryValue | null): string {
  const filename = typeof value === "string" ? value.trim() : "";
  if (!filename || filename.length > 160 || /[\r\n\\/]/.test(filename)) throw new HttpError(400, "成果物ファイル名が不正です");
  return filename.endsWith(".png") ? filename : `${filename}.png`;
}

function safeObjectPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120) || "artifact";
}

async function saveDeliverable(request: Request, env: AppEnv): Promise<Response> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_DELIVERABLE_BYTES + 32_768) {
    throw new HttpError(413, "成果物PNGが大きすぎます");
  }
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    throw new HttpError(415, "成果物はmultipart/form-dataで送信してください");
  }

  const form = await request.formData();
  const keyId = parseKeyId(form.get("keyId"));
  const kind = parseDeliverableKind(form.get("kind"));
  const eventKey = parseEventKey(form.get("eventKey"));
  const filename = parseFilename(form.get("filename"));
  const metadataJson = parseDeliverableMetadata(form.get("metadata"));
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "成果物PNGがありません");
  if (file.type !== "image/png") throw new HttpError(415, "成果物はPNG形式で保存してください");
  if (file.size < 1024 || file.size > MAX_DELIVERABLE_BYTES) throw new HttpError(413, "成果物PNGのサイズが不正です");

  await requireUser(env, keyId);
  const objectKey = `${keyId}/${kind}/${safeObjectPart(eventKey)}.png`;
  await env.DELIVERABLES.put(objectKey, file.stream(), {
    httpMetadata: { contentType: "image/png" },
    customMetadata: { keyId, kind, eventKey },
  });

  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO deliverables (id, key_id, kind, event_key, filename, object_key, content_type, byte_size, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, 'image/png', ?, ?)
    ON CONFLICT(key_id, event_key) DO UPDATE SET
      kind = excluded.kind,
      filename = excluded.filename,
      object_key = excluded.object_key,
      content_type = excluded.content_type,
      byte_size = excluded.byte_size,
      metadata_json = excluded.metadata_json,
      created_at = CURRENT_TIMESTAMP
  `).bind(id, keyId, kind, eventKey, filename, objectKey, file.size, metadataJson).run();

  const row = await env.DB.prepare(`
    SELECT id, key_id, kind, event_key, filename, object_key, content_type, byte_size, metadata_json, created_at
    FROM deliverables WHERE key_id = ? AND event_key = ?
  `).bind(keyId, eventKey).first<DeliverableRow>();
  if (!row) throw new HttpError(500, "成果物台帳を保存できませんでした");
  return json({
    saved: true,
    deliverable: serializeDeliverable(row),
  }, { status: 201 });
}

function serializeDeliverable(row: DeliverableRow) {
  let metadata: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(row.metadata_json) as unknown;
    if (isRecord(parsed)) metadata = parsed;
  } catch {
    metadata = {};
  }
  return {
    id: row.id,
    keyId: row.key_id,
    kind: row.kind,
    eventKey: row.event_key,
    filename: row.filename,
    contentType: row.content_type,
    byteSize: Number(row.byte_size) || 0,
    metadata,
    createdAt: row.created_at,
  };
}

async function listDeliverables(request: Request, env: AppEnv): Promise<Response> {
  const body = await readJsonBody(request);
  if (!isRecord(body)) throw new HttpError(400, "入力内容が不正です");
  const keyId = parseKeyId(body.keyId);
  await requireUser(env, keyId);
  const result = await env.DB.prepare(`
    SELECT id, key_id, kind, event_key, filename, object_key, content_type, byte_size, metadata_json, created_at
    FROM deliverables
    WHERE key_id = ?
    ORDER BY created_at DESC, rowid DESC
    LIMIT 500
  `).bind(keyId).all<DeliverableRow>();
  return json({ deliverables: (result.results ?? []).map(serializeDeliverable) });
}

async function getDeliverableFile(request: Request, env: AppEnv, id: string): Promise<Response> {
  if (!id || id.length > 80) throw new HttpError(400, "成果物IDが不正です");
  const url = new URL(request.url);
  const keyId = parseKeyId(url.searchParams.get("keyId"));
  const row = await env.DB.prepare(`
    SELECT id, key_id, kind, event_key, filename, object_key, content_type, byte_size, metadata_json, created_at
    FROM deliverables WHERE id = ? AND key_id = ?
  `).bind(id, keyId).first<DeliverableRow>();
  if (!row) throw new HttpError(404, "成果物が見つかりません");
  const object = await env.DELIVERABLES.get(row.object_key);
  if (!object) throw new HttpError(404, "成果物PNGが見つかりません");
  const headers = new Headers();
  headers.set("Content-Type", row.content_type || "image/png");
  headers.set("Content-Length", String(object.size));
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";
  headers.set("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeURIComponent(row.filename)}`);
  return new Response(object.body, { headers });
}

async function handleApi(request: Request, env: AppEnv): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/health" && request.method === "GET") {
    return json({ ok: true, service: "keycraft-5000", contentVersion: 2, deliverables: true });
  }
  if (pathname === "/api/users" && request.method === "POST") return createUser(env);
  if (pathname === "/api/users/search" && request.method === "POST") return searchUsers(request, env);
  if (pathname === "/api/session" && request.method === "POST") return getSession(request, env);
  if (pathname === "/api/preferences" && request.method === "PUT") return updatePreferences(request, env);
  if (pathname === "/api/progress/phrase" && request.method === "POST") return savePhrase(request, env);
  if (pathname === "/api/deliverables" && request.method === "POST") return saveDeliverable(request, env);
  if (pathname === "/api/deliverables/list" && request.method === "POST") return listDeliverables(request, env);
  const fileMatch = /^\/api\/deliverables\/file\/([^/]+)$/.exec(pathname);
  if (fileMatch && request.method === "GET") return getDeliverableFile(request, env, decodeURIComponent(fileMatch[1] ?? ""));
  return json({ error: "APIが見つかりません" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: AppEnv, context: ExecutionContext): Promise<Response> {
    void context;
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env);
      return await env.ASSETS.fetch(request);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, { status: error.status });
      console.error(JSON.stringify({ message: "request failed", path: new URL(request.url).pathname, error: error instanceof Error ? error.message : String(error) }));
      return json({ error: "処理中に問題が発生しました" }, { status: 500 });
    }
  },
} satisfies ExportedHandler<AppEnv>;
