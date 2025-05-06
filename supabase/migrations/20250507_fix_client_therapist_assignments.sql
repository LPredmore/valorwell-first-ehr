-- This migration fixes client-therapist assignments by ensuring consistent ID format

-- First, create a temporary table to store the mapping between clinician emails and IDs
CREATE TEMP TABLE clinician_email_to_id AS
SELECT id, clinician_email
FROM clinicians
WHERE clinician_email IS NOT NULL;

-- Update clients where client_assigned_therapist matches a clinician email
UPDATE clients
SET client_assigned_therapist = c.id::TEXT
FROM clinician_email_to_id c
WHERE clients.client_assigned_therapist = c.clinician_email;

-- Log the update for verification
INSERT INTO public.migration_logs (migration_name, description, details)
VALUES (
  '20250507_fix_client_therapist_assignments',
  'Fixed client-therapist assignments',
  jsonb_build_object(
    'updated_count', (SELECT count(*) FROM clients WHERE client_assigned_therapist IS NOT NULL)
  )
);

-- Create a function to ensure consistent clinician ID format for future assignments
CREATE OR REPLACE FUNCTION ensure_clinician_id_format()
RETURNS TRIGGER AS $$
DECLARE
  v_clinician_id TEXT;
BEGIN
  -- If the assigned therapist looks like an email, try to find the corresponding clinician ID
  IF NEW.client_assigned_therapist LIKE '%@%' THEN
    SELECT id::TEXT INTO v_clinician_id
    FROM clinicians
    WHERE clinician_email = NEW.client_assigned_therapist;
    
    IF v_clinician_id IS NOT NULL THEN
      NEW.client_assigned_therapist := v_clinician_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to ensure consistent clinician ID format
DROP TRIGGER IF EXISTS ensure_clinician_id_format_trigger ON clients;
CREATE TRIGGER ensure_clinician_id_format_trigger
BEFORE INSERT OR UPDATE OF client_assigned_therapist ON clients
FOR EACH ROW
EXECUTE FUNCTION ensure_clinician_id_format();

-- Create a migration_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_logs (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);