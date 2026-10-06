PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS player_characters (
  key_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 40),
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/png', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0 AND byte_size <= 5242880),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_id) REFERENCES users(key_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_player_characters_updated_at
  ON player_characters(updated_at DESC);
