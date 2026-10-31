-- LOCAL DEVELOPMENT ONLY. Loaded with: npm run db:local:setup
-- Never run this with --remote.
-- Test organiser logins (password localtest123):
--   Caz & Dan: carrie        Sophie: sophie@local.test

INSERT OR IGNORE INTO events (slug, title, event_date, max_shots, is_active, theme, settings_json, gallery_unlock_at, created_at, updated_at) VALUES
  ('caz-and-dan', 'Caz & Dan', '2026-10-10', 25, 1, 'caz-and-dan', '{}', '2026-10-11T08:00:00.000Z', datetime('now'), datetime('now')),
  ('sophies-last-rodeo', 'Sophie’s Last Rodeo', '2026-09-19', 50, 1, 'sophies-last-rodeo', '{}', '2026-09-21T08:00:00.000Z', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO admin_users (id, event_id, email, password_hash, password_salt, password_iterations, status, created_at, activated_at)
SELECT 'local-caz-admin', id, 'carrie', 'd25730440b6e0ee1981293889a7aab8b9f2d736f9bde203362877aa2f6b3f31b', '5eed5eed5eed5eed5eed5eed5eed5eed', 100000, 'active', datetime('now'), datetime('now') FROM events WHERE slug = 'caz-and-dan';

INSERT OR IGNORE INTO admin_users (id, event_id, email, password_hash, password_salt, password_iterations, status, created_at, activated_at)
SELECT 'local-sophie-admin', id, 'sophie@local.test', 'd25730440b6e0ee1981293889a7aab8b9f2d736f9bde203362877aa2f6b3f31b', '5eed5eed5eed5eed5eed5eed5eed5eed', 100000, 'active', datetime('now'), datetime('now') FROM events WHERE slug = 'sophies-last-rodeo';
