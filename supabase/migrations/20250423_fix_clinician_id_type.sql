
-- Fix the clinician_id type in the calendar_events table
-- First ensure we can convert all existing values to make the migration safe
UPDATE calendar_events 
SET clinician_id = CAST(clinician_id AS UUID)
WHERE clinician_id IS NOT NULL;

-- Now alter the column type
ALTER TABLE calendar_events 
  ALTER COLUMN clinician_id TYPE uuid USING clinician_id::uuid;

-- Add a foreign key constraint to profiles table (commented out until confirmed)
-- ALTER TABLE calendar_events
--   ADD CONSTRAINT fk_calendar_events_clinician 
--   FOREIGN KEY (clinician_id) REFERENCES profiles(id);
