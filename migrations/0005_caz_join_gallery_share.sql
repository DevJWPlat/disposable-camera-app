-- Caz & Dan: optional public guest-gallery sharing.
CREATE TABLE IF NOT EXISTS gallery_shares (
  event_id INTEGER PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX IF NOT EXISTS idx_gallery_shares_token ON gallery_shares(token);
