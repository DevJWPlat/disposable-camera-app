-- Step 4: scheduled deletion when an event's storage ends.
ALTER TABLE events ADD COLUMN storage_reminder_sent_at TEXT;
ALTER TABLE events ADD COLUMN purged_at TEXT;
