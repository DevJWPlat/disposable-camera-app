CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  couple_names TEXT NOT NULL,
  wedding_date TEXT NOT NULL,
  max_shots INTEGER NOT NULL DEFAULT 25,
  is_active INTEGER NOT NULL DEFAULT 1
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
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Existing databases: add column once (ignore error if already applied)
-- ALTER TABLE photos ADD COLUMN thumbnail_r2_key TEXT;

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

CREATE INDEX IF NOT EXISTS idx_sessions_event_device ON sessions(event_id, device_token);
CREATE INDEX IF NOT EXISTS idx_sessions_preview_photo ON sessions(preview_photo_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_uploaded ON photos(event_id, uploaded_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_event_email ON admin_users(event_id, email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
