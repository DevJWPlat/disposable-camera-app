-- Sophie’s Last Rodeo: one permanent secret preview per guest session.
ALTER TABLE sessions ADD COLUMN preview_photo_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sessions_preview_photo ON sessions(preview_photo_id);
