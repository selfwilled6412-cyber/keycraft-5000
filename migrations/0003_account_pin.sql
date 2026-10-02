ALTER TABLE users ADD COLUMN account_ref TEXT;
ALTER TABLE users ADD COLUMN pin_salt TEXT;
ALTER TABLE users ADD COLUMN pin_hash TEXT;
ALTER TABLE users ADD COLUMN pin_iterations INTEGER;
ALTER TABLE users ADD COLUMN pin_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN pin_locked_until TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_account_ref
  ON users(account_ref)
  WHERE account_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_nickname
  ON users(nickname COLLATE NOCASE);
