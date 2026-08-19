interface SaiCoinService {
  fetch(request: Request): Promise<Response>;
}

type SaiCoinEnv = Env & {
  SAI_COIN?: SaiCoinService;
  SAI_COIN_API_URL?: string;
  SAI_COIN_API_KEY?: string;
  SAI_COIN_MISSION_ID?: string;
};

interface OutboxRow {
  event_id: string;
  attempts: number;
}

interface SaiCoinResponse {
  ok?: boolean;
  duplicate?: boolean;
  error?: string;
  message?: string;
}

interface IntegrationConfig {
  apiUrl: string;
  apiKey: string;
  missionId: string;
  service?: SaiCoinService;
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

export function saiCoinRequestBody(userName: string, missionId: string, eventId: string) {
  return { userName, missionId, eventId };
}

function integrationConfig(env: Env): IntegrationConfig | null {
  const integrationEnv = env as SaiCoinEnv;
  const apiUrl = String(integrationEnv.SAI_COIN_API_URL ?? '').trim().replace(/\/$/, '');
  const apiKey = String(integrationEnv.SAI_COIN_API_KEY ?? '').trim();
  const missionId = String(integrationEnv.SAI_COIN_MISSION_ID ?? '').trim();
  const service = integrationEnv.SAI_COIN;
  if (!apiKey || !missionId || (!service && !apiUrl)) return null;
  return { apiUrl, apiKey, missionId, ...(service ? { service } : {}) };
}

async function responsePayload(response: Response): Promise<{ data: SaiCoinResponse; raw: string }> {
  let raw = '';
  try {
    raw = await response.text();
  } catch {
    return { data: {}, raw: '' };
  }
  try {
    const value = JSON.parse(raw) as unknown;
    return {
      data: typeof value === 'object' && value !== null ? value as SaiCoinResponse : {},
      raw,
    };
  } catch {
    return { data: {}, raw };
  }
}

async function sendToSaiCoin(
  config: IntegrationConfig,
  body: ReturnType<typeof saiCoinRequestBody>,
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<Response> {
  const init: RequestInit = {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  };

  if (config.service) {
    return config.service.fetch(new Request('https://sai-coin.internal/api/integrations/complete', init));
  }
  return fetcher(`${config.apiUrl}/api/integrations/complete`, init);
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

export async function queueSaiCoinMission(env: Env, keyId: string, keycraftMissionId: string): Promise<string> {
  const eventId = await saiCoinEventId(keyId, keycraftMissionId);
  await env.DB.prepare("INSERT OR IGNORE INTO sai_coin_outbox (event_id, key_id, keycraft_mission_id) VALUES (?, ?, ?)")
    .bind(eventId, keyId, keycraftMissionId)
    .run();
  return eventId;
}

export async function deliverPendingSaiCoin(env: Env, keyId: string, fetcher: typeof fetch = fetch): Promise<SaiCoinDeliverySummary> {
  const config = integrationConfig(env);
  if (!config) {
    return { configured: false, attempted: 0, sent: 0, dailyAlready: 0, pending: await pendingCount(env, keyId) };
  }

  const user = await env.DB.prepare('SELECT nickname FROM users WHERE key_id = ?').bind(keyId).first<{ nickname: string | null }>();
  const nickname = String(user?.nickname ?? '').trim();
  if (!nickname) {
    return {
      configured: true,
      attempted: 0,
      sent: 0,
      dailyAlready: 0,
      pending: await pendingCount(env, keyId),
      lastError: 'SAI COIN利用者名に使えるニックネームが未設定です',
    };
  }

  const rows = await env.DB.prepare("SELECT event_id, attempts FROM sai_coin_outbox WHERE key_id = ? AND status = 'pending' ORDER BY created_at LIMIT 3")
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
      const response = await sendToSaiCoin(
        config,
        saiCoinRequestBody(nickname, config.missionId, row.event_id),
        controller.signal,
        fetcher,
      );
      const { data, raw } = await responsePayload(response);
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
      const compactRaw = raw.replace(/\s+/g, ' ').trim().slice(0, 120);
      lastError = data.message || data.error || `SAI COIN HTTP ${response.status}${compactRaw ? `: ${compactRaw}` : ''}`;
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
