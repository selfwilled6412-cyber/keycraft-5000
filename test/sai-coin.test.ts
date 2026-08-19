import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { saiCoinEventId } from '../worker/sai-coin';

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

  it('never lets KEY CRAFT choose the SAI COIN amount', async () => {
    const source = await readFile(new URL('../worker/sai-coin.ts', import.meta.url), 'utf8');
    expect(source).toContain('/api/integrations/complete');
    expect(source).toContain('missionId: config.missionId');
    expect(source).toContain('eventId: row.event_id');
    expect(source).not.toMatch(/amount\s*:/);
    expect(source).not.toContain('keyId: keyId');
  });

  it('keeps a durable pending outbox for retry', async () => {
    const sql = await readFile(new URL('../migrations/0002_sai_coin_outbox.sql', import.meta.url), 'utf8');
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'pending'");
    expect(sql).toContain('event_id TEXT PRIMARY KEY');
    expect(sql).toContain('attempts INTEGER NOT NULL DEFAULT 0');
  });

  it('wraps the existing worker without changing its progress implementation', async () => {
    const wrapper = await readFile(new URL('../worker/integrated.ts', import.meta.url), 'utf8');
    expect(wrapper).toContain("import app from './index'");
    expect(wrapper).toContain('context.waitUntil');
    expect(wrapper).toContain("'/api/progress/phrase'");
  });
});
