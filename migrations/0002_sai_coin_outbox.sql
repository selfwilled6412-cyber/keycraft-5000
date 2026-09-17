CREATE TABLE IF NOT EXISTS sai_coin_outbox (
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
