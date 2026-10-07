ALTER TABLE preferences
  ADD COLUMN character_motion_enabled INTEGER NOT NULL DEFAULT 1
  CHECK (character_motion_enabled IN (0, 1));
