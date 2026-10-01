import { describe, expect, it } from 'vitest';
import { saiCoinEventId, saiCoinFailureDisposition, saiCoinRequestBody } from '../worker/sai-coin';

describe('SAI COIN integration safety', () => {
  it('creates deterministic event IDs without exposing the KEY ID', async () => {
    const first = await saiCoinEventId('ABC234', 'm001');
    const second = await saiCoinEventId('ABC234', 'm001');
    const different = await saiCoinEventId('ABC234', 'm002');
    expect(first).toBe(second);
    expect(first).not.toBe(different);
    expect(first).not.toContain('ABC234');
    expect(first).toMatch(/^kc_[a-f0-9]{40}$/);
  });

  it('sends only user name, configured mission ID and anonymous event ID', () => {
    const body = saiCoinRequestBody('テスト利用者', 'mission_configured_by_sai_coin', 'kc_123');
    expect(body).toEqual({
      userName: 'テスト利用者',
      missionId: 'mission_configured_by_sai_coin',
      eventId: 'kc_123',
    });
    expect('amount' in body).toBe(false);
    expect('keyId' in body).toBe(false);
  });

  it('stops retrying a missing SAI COIN user but keeps transient failures retryable', () => {
    expect(saiCoinFailureDisposition(404, { error: 'user_not_found', message: '利用者が見つかりません。' })).toBe('terminal');
    expect(saiCoinFailureDisposition(503, { error: 'temporarily_unavailable' })).toBe('retry');
  });
});
