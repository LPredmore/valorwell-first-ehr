
-- Convert clinician_id to UUID type to match the rest of the schema
ALTER TABLE calendar_events 
  ALTER COLUMN clinician_id TYPE uuid USING clinician_id::uuid;
