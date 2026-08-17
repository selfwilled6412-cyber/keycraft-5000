PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  key_id TEXT PRIMARY KEY CHECK(length(key_id) = 6),
  nickname TEXT CHECK(nickname IS NULL OR length(nickname) <= 24),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS preferences (
  key_id TEXT PRIMARY KEY,
  assist_mode TEXT NOT NULL DEFAULT 'beginner' CHECK(assist_mode IN ('beginner', 'normal', 'challenge')),
  genres_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_id) REFERENCES users(key_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
  key_id TEXT NOT NULL,
  phrase_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  accuracy REAL NOT NULL CHECK(accuracy >= 0 AND accuracy <= 100),
  keystrokes INTEGER NOT NULL CHECK(keystrokes >= 0),
  miss_keys_json TEXT NOT NULL DEFAULT '{}',
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (key_id, phrase_id),
  FOREIGN KEY (key_id) REFERENCES users(key_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progress_key_mission ON progress(key_id, mission_id);

CREATE TABLE IF NOT EXISTS mission_completions (
  key_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  reward_id TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (key_id, mission_id),
  FOREIGN KEY (key_id) REFERENCES users(key_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mission_completions_key ON mission_completions(key_id);
