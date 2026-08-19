import app from './index';
import { deliverPendingSaiCoin, queueSaiCoinMission } from './sai-coin';

interface ProgressInput {
  keyId?: unknown;
  missionId?: unknown;
}

interface ProgressOutput {
  completedCount?: unknown;
}

async function syncSaiCoin(request: Request, response: Response, env: Env): Promise<void> {
  if (!response.ok) return;
  let input: ProgressInput;
  let output: ProgressOutput;
  try {
    input = await request.json() as ProgressInput;
    output = await response.clone().json() as ProgressOutput;
  } catch {
    return;
  }

  const keyId = typeof input.keyId === 'string' ? input.keyId.trim().toUpperCase() : '';
  const missionId = typeof input.missionId === 'string' ? input.missionId.trim() : '';
  const completedCount = Number(output.completedCount);
  if (!keyId || !missionId) return;

  try {
    if (completedCount >= 20) {
      await queueSaiCoinMission(env, keyId, missionId);
    }
    await deliverPendingSaiCoin(env, keyId);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'SAI COIN sync failed without affecting KEY CRAFT progress',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const shouldSync = url.pathname === '/api/progress/phrase' && request.method === 'POST';
    const integrationRequest = shouldSync ? request.clone() : null;
    const response = await app.fetch(request, env, context);
    if (integrationRequest) {
      context.waitUntil(syncSaiCoin(integrationRequest, response, env));
    }
    return response;
  },
} satisfies ExportedHandler<Env>;
