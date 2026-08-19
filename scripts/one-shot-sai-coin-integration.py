from pathlib import Path

# --- New D1 outbox migration ---
Path('migrations/0002_sai_coin_outbox.sql').write_text(r'''CREATE TABLE IF NOT EXISTS sai_coin_outbox (
  event_id TEXT PRIMARY KEY,
  key_id TEXT NOT NULL REFERENCES users(key_id),
  keycraft_mission_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'daily_already')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sai_coin_outbox_pending
ON sai_coin_outbox(key_id, status, created_at);
''', encoding='utf-8')

# --- Integration helper ---
Path('worker/sai-coin.ts').write_text(r'''type SaiCoinEnv = Env & {
  SAI_COIN_API_URL?: string;
  SAI_COIN_API_KEY?: string;
  SAI_COIN_MISSION_ID?: string;
};

interface OutboxRow {
  event_id: string;
  keycraft_mission_id: string;
  attempts: number;
}

interface SaiCoinResponse {
  ok?: boolean;
  duplicate?: boolean;
  error?: string;
  message?: string;
}

export interface SaiCoinDeliverySummary {
  configured: boolean;
  attempted: number;
  sent: number;
  dailyAlready: number;
  pending: number;
  lastError?: string;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function saiCoinEventId(keyId: string, missionId: string): Promise<string> {
  const digest = await sha256Hex(`keycraft-5000:${keyId}:${missionId}`);
  return `kc_${digest.slice(0, 40)}`;
}

function integrationConfig(env: Env): { apiUrl: string; apiKey: string; missionId: string } | null {
  const integrationEnv = env as SaiCoinEnv;
  const apiUrl = String(integrationEnv.SAI_COIN_API_URL ?? '').trim().replace(/\/$/, '');
  const apiKey = String(integrationEnv.SAI_COIN_API_KEY ?? '').trim();
  const missionId = String(integrationEnv.SAI_COIN_MISSION_ID ?? '').trim();
  if (!apiUrl || !apiKey || !missionId) return null;
  return { apiUrl, apiKey, missionId };
}

async function responseJson(response: Response): Promise<SaiCoinResponse> {
  try {
    const value = await response.json() as unknown;
    return typeof value === 'object' && value !== null ? value as SaiCoinResponse : {};
  } catch {
    return {};
  }
}

async function pendingCount(env: Env, keyId: string): Promise<number> {
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM sai_coin_outbox WHERE key_id = ? AND status = 'pending'")
    .bind(keyId)
    .first<number>('count');
  return Number(count ?? 0);
}

async function markTerminal(env: Env, eventId: string, status: 'sent' | 'daily_already'): Promise<void> {
  await env.DB.prepare("UPDATE sai_coin_outbox SET status = ?, attempts = attempts + 1, last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?")
    .bind(status, eventId)
    .run();
}

async function markFailure(env: Env, eventId: string, message: string): Promise<void> {
  await env.DB.prepare("UPDATE sai_coin_outbox SET attempts = attempts + 1, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?")
    .bind(message.slice(0, 240), eventId)
    .run();
}

export async function deliverPendingSaiCoin(env: Env, keyId: string, fetcher: typeof fetch = fetch): Promise<SaiCoinDeliverySummary> {
  const config = integrationConfig(env);
  if (!config) {
    return { configured: false, attempted: 0, sent: 0, dailyAlready: 0, pending: await pendingCount(env, keyId) };
  }

  const user = await env.DB.prepare('SELECT nickname FROM users WHERE key_id = ?').bind(keyId).first<{ nickname: string | null }>();
  const nickname = String(user?.nickname ?? '').trim();
  if (!nickname) {
    return { configured: true, attempted: 0, sent: 0, dailyAlready: 0, pending: await pendingCount(env, keyId), lastError: 'SAI COIN利用者名に使えるニックネームが未設定です' };
  }

  const rows = await env.DB.prepare("SELECT event_id, keycraft_mission_id, attempts FROM sai_coin_outbox WHERE key_id = ? AND status = 'pending' ORDER BY created_at LIMIT 3")
    .bind(keyId)
    .all<OutboxRow>();

  let attempted = 0;
  let sent = 0;
  let dailyAlready = 0;
  let lastError: string | undefined;

  for (const row of rows.results ?? []) {
    attempted += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetcher(`${config.apiUrl}/api/integrations/complete`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userName: nickname,
          missionId: config.missionId,
          eventId: row.event_id,
        }),
        signal: controller.signal,
      });
      const data = await responseJson(response);
      if (response.ok && data.ok !== false) {
        await markTerminal(env, row.event_id, 'sent');
        sent += 1;
        continue;
      }
      if (response.status === 409 && data.error === 'mission_already_completed') {
        await markTerminal(env, row.event_id, 'daily_already');
        dailyAlready += 1;
        continue;
      }
      lastError = data.message || data.error || `SAI COIN HTTP ${response.status}`;
      await markFailure(env, row.event_id, lastError);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await markFailure(env, row.event_id, lastError);
      break;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    configured: true,
    attempted,
    sent,
    dailyAlready,
    pending: await pendingCount(env, keyId),
    ...(lastError ? { lastError } : {}),
  };
}
''', encoding='utf-8')

# --- Patch worker ---
p = Path('worker/index.ts')
s = p.read_text(encoding='utf-8')
import_line = 'import { deliverPendingSaiCoin, saiCoinEventId } from "./sai-coin";\n\n'
if not s.startswith('import { deliverPendingSaiCoin'):
    s = import_line + s

old = '''  const results = await env.DB.batch([\n    env.DB.prepare("INSERT OR IGNORE INTO progress (key_id, phrase_id, mission_id, accuracy, keystrokes, miss_keys_json) VALUES (?, ?, ?, ?, ?, ?)")\n      .bind(keyId, phraseId, missionId, accuracy, keystrokes, JSON.stringify(missKeys)),\n    env.DB.prepare("INSERT OR IGNORE INTO mission_completions (key_id, mission_id, reward_id) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM progress WHERE key_id = ? AND mission_id = ?) >= 20")\n      .bind(keyId, missionId, `reward-${missionId}`, keyId, missionId),\n    env.DB.prepare("UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE key_id = ?").bind(keyId),\n  ]);\n\n  const completedCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM progress WHERE key_id = ? AND mission_id = ?")\n    .bind(keyId, missionId)\n    .first<number>("count");\n  return json({\n    saved: true,\n    duplicate: (results[0]?.meta.changes ?? 0) === 0,\n    missionCompleted: (results[1]?.meta.changes ?? 0) > 0,\n    completedCount: completedCount ?? 0,\n  });'''
new = '''  const saiEventId = await saiCoinEventId(keyId, missionId);\n  const results = await env.DB.batch([\n    env.DB.prepare("INSERT OR IGNORE INTO progress (key_id, phrase_id, mission_id, accuracy, keystrokes, miss_keys_json) VALUES (?, ?, ?, ?, ?, ?)")\n      .bind(keyId, phraseId, missionId, accuracy, keystrokes, JSON.stringify(missKeys)),\n    env.DB.prepare("INSERT OR IGNORE INTO mission_completions (key_id, mission_id, reward_id) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM progress WHERE key_id = ? AND mission_id = ?) >= 20")\n      .bind(keyId, missionId, `reward-${missionId}`, keyId, missionId),\n    env.DB.prepare("INSERT OR IGNORE INTO sai_coin_outbox (event_id, key_id, keycraft_mission_id) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM progress WHERE key_id = ? AND mission_id = ?) >= 20")\n      .bind(saiEventId, keyId, missionId, keyId, missionId),\n    env.DB.prepare("UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE key_id = ?").bind(keyId),\n  ]);\n\n  const completedCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM progress WHERE key_id = ? AND mission_id = ?")\n    .bind(keyId, missionId)\n    .first<number>("count");\n  const saiCoin = await deliverPendingSaiCoin(env, keyId);\n  return json({\n    saved: true,\n    duplicate: (results[0]?.meta.changes ?? 0) === 0,\n    missionCompleted: (results[1]?.meta.changes ?? 0) > 0,\n    completedCount: completedCount ?? 0,\n    saiCoin,\n  });'''
if old not in s:
    raise SystemExit('savePhrase patch point not found')
s = s.replace(old, new)
p.write_text(s, encoding='utf-8')

# --- Tests ---
Path('test/sai-coin.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';
import { saiCoinEventId } from '../worker/sai-coin';

 describe('SAI COIN integration safety', () => {
  it('creates deterministic event ids without exposing the KEY ID', async () => {
    const first = await saiCoinEventId('ABC234', 'm001');
    const second = await saiCoinEventId('ABC234', 'm001');
    const different = await saiCoinEventId('ABC234', 'm002');
    expect(first).toBe(second);
    expect(first).not.toBe(different);
    expect(first).not.toContain('ABC234');
    expect(first).toMatch(/^kc_[a-f0-9]{40}$/);
  });
});
''', encoding='utf-8')

Path('test/sai-coin-source.test.ts').write_text(r'''import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

 describe('SAI COIN integration source contract', () => {
  it('does not let KEY CRAFT choose a coin amount', async () => {
    const source = await readFile(new URL('../worker/sai-coin.ts', import.meta.url), 'utf8');
    expect(source).toContain('/api/integrations/complete');
    expect(source).toContain('missionId: config.missionId');
    expect(source).toContain('eventId: row.event_id');
    expect(source).not.toMatch(/amount\s*:/);
    expect(source).not.toContain('keyId,\n          missionId');
  });

  it('keeps a durable pending outbox', async () => {
    const sql = await readFile(new URL('../migrations/0002_sai_coin_outbox.sql', import.meta.url), 'utf8');
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'pending'");
    expect(sql).toContain('event_id TEXT PRIMARY KEY');
    expect(sql).toContain('attempts INTEGER NOT NULL DEFAULT 0');
  });
});
''', encoding='utf-8')

# --- Documentation ---
p = Path('README.md')
readme = p.read_text(encoding='utf-8')
anchor = '- `POST /api/progress/phrase` — 1問の完了を冪等保存\n'
addition = anchor + '\nMISSIONを20問クリアすると、設定済みの場合はSAI COINへ日次ミッション達成を通知します。連携キー・SAI COIN側MISSION ID・API URLはWorker Secretで保持し、KEY IDは外部へ送信しません。SAI COIN側の一時障害時はD1 outboxへ未送信イベントを残し、次回の進捗保存時に再送します。\n'
if anchor in readme and 'D1 outbox' not in readme:
    readme = readme.replace(anchor, addition)
p.write_text(readme, encoding='utf-8')

# Remove this patcher before feature commit.
Path('scripts/one-shot-sai-coin-integration.py').unlink()
