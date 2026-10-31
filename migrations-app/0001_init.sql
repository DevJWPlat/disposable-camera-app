-- One database for every event (step 1 of the single-app plan).
-- Applied with: wrangler d1 migrations apply odc-events-db --remote

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  max_shots INTEGER NOT NULL DEFAULT 25,
  is_active INTEGER NOT NULL DEFAULT 1,
  -- Which set of views to load, e.g. 'caz-and-dan', 'sophies-last-rodeo', 'classic-editorial'.
  theme TEXT NOT NULL,
  -- Per-event copy, palette and other theme settings (used from step 2).
  settings_json TEXT NOT NULL DEFAULT '{}',
  -- When the organiser gallery opens (ISO timestamp, used from step 3).
  gallery_unlock_at TEXT,
  -- When photos are due for deletion (used by the step 4 cron).
  storage_until TEXT,
  -- Where this event's data came from, e.g. 'caz-and-dan-db'.
  legacy_source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Every hostname that serves an event: subdomains, custom domains like
-- sophies-last-rodeo.party, and any older addresses.
CREATE TABLE IF NOT EXISTS event_domains (
  hostname TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL,
  device_token TEXT,
  guest_name TEXT,
  shots_taken INTEGER NOT NULL DEFAULT 0,
  shots_remaining INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'active',
  preview_photo_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  thumbnail_r2_key TEXT,
  -- Original keys in the old per-event bucket, kept until the copy is verified.
  legacy_r2_key TEXT,
  legacy_thumbnail_r2_key TEXT,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  password_salt TEXT,
  password_iterations INTEGER,
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TEXT NOT NULL,
  activated_at TEXT,
  last_login_at TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id),
  UNIQUE(event_id, email)
);

CREATE TABLE IF NOT EXISTS admin_invites (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL,
  admin_user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS gallery_shares (
  event_id INTEGER PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS export_jobs (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL,
  requested_by TEXT NOT NULL,
  export_type TEXT NOT NULL,
  filter_json TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  total_photos INTEGER NOT NULL DEFAULT 0,
  processed_photos INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  expires_at TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (requested_by) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_event_domains_event ON event_domains(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_event_device ON sessions(event_id, device_token);
CREATE INDEX IF NOT EXISTS idx_sessions_preview_photo ON sessions(preview_photo_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_uploaded ON photos(event_id, uploaded_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_event_email ON admin_users(event_id, email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_gallery_shares_token ON gallery_shares(token);
