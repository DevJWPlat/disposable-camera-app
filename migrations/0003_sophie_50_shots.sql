-- Sophie’s Last Rodeo: increase the allowance from 25 to 50 photographs.
UPDATE events
SET max_shots = 50
WHERE slug = 'sophies-last-rodeo';

-- Keep any existing Sophie sessions consistent with the new allowance.
UPDATE sessions
SET
  shots_remaining = CASE
    WHEN shots_taken >= 50 THEN 0
    ELSE 50 - shots_taken
  END,
  status = CASE
    WHEN shots_taken >= 50 THEN 'complete'
    ELSE 'active'
  END,
  updated_at = datetime('now')
WHERE event_id = (
  SELECT id FROM events WHERE slug = 'sophies-last-rodeo' LIMIT 1
);
