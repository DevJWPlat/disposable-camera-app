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
CREATE INDEX IF NOT EXISTS idx_photos_event_uploaded ON photos(event_id, uploaded_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_event_email ON admin_users(event_id, email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
