PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS deliverables (
  id TEXT PRIMARY KEY,
  key_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('current_settlement', 'mission_clear', 'district_complete', 'hero_unlock')),
  event_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL DEFAULT 'image/png',
  byte_size INTEGER NOT NULL CHECK(byte_size >= 0),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_id) REFERENCES users(key_id) ON DELETE CASCADE,
  UNIQUE (key_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_deliverables_key_created
  ON deliverables(key_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deliverables_key_kind
  ON deliverables(key_id, kind, created_at DESC);
