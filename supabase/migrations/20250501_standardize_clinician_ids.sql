-- Migration to standardize clinician IDs across all relevant tables
-- This migration addresses the root cause of calendar permission issues
-- by ensuring consistent ID formats and adding proper constraints

-- Step 1: Create a function to standardize UUID format
CREATE OR REPLACE FUNCTION standardize_uuid(input_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  clean_id TEXT;
  formatted_uuid TEXT;
BEGIN
  -- Return NULL if input is NULL
  IF input_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- If already a valid UUID, return it
  IF input_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN input_id::UUID;
  END IF;
  
  -- Remove all non-alphanumeric characters
  clean_id := regexp_replace(lower(input_id), '[^a-f0-9]', '', 'g');
  
  -- Check if we have exactly 32 hex characters
  IF length(clean_id) = 32 THEN
    -- Insert hyphens in the correct positions
    formatted_uuid := 
      substring(clean_id from 1 for 8) || '-' || 
      substring(clean_id from 9 for 4) || '-' || 
      substring(clean_id from 13 for 4) || '-' || 
      substring(clean_id from 17 for 4) || '-' || 
      substring(clean_id from 21 for 12);
    
    -- Verify the formatted string is a valid UUID
    IF formatted_uuid ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RETURN formatted_uuid::UUID;
    END IF;
  END IF;
  
  -- If we couldn't format it as a UUID, raise an exception
  RAISE EXCEPTION 'Invalid UUID format: %', input_id;
END;
$$;

-- Step 2: Standardize clinician_id in calendar_events table
UPDATE calendar_events
SET clinician_id = standardize_uuid(clinician_id::text)
WHERE clinician_id IS NOT NULL;

-- Step 3: Standardize clinician_id in availability table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'availability') THEN
    EXECUTE '
      UPDATE availability
      SET clinician_id = standardize_uuid(clinician_id::text)
      WHERE clinician_id IS NOT NULL;
    ';
  END IF;
END $$;

-- Step 4: Standardize clinician_id in appointments table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
    EXECUTE '
      UPDATE appointments
      SET clinician_id = standardize_uuid(clinician_id::text)
      WHERE clinician_id IS NOT NULL;
    ';
  END IF;
END $$;

-- Step 5: Standardize id in clinicians table
UPDATE clinicians
SET id = standardize_uuid(id::text)
WHERE id IS NOT NULL;

-- Step 6: Add foreign key constraints to ensure clinician_id values reference valid entries in the profiles table
-- First, make sure all clinician IDs exist in the profiles table
INSERT INTO profiles (id, created_at, role)
SELECT DISTINCT c.id, NOW(), 'clinician'
FROM clinicians c
LEFT JOIN profiles p ON c.id = p.id
WHERE p.id IS NULL;

-- Add foreign key constraint to calendar_events
ALTER TABLE calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_clinician_id_fkey;

ALTER TABLE calendar_events
ADD CONSTRAINT calendar_events_clinician_id_fkey
FOREIGN KEY (clinician_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add foreign key constraint to appointments if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
    EXECUTE '
      ALTER TABLE appointments
      DROP CONSTRAINT IF EXISTS appointments_clinician_id_fkey;
      
      ALTER TABLE appointments
      ADD CONSTRAINT appointments_clinician_id_fkey
      FOREIGN KEY (clinician_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
    ';
  END IF;
END $$;

-- Step 7: Create a trigger to validate clinician_id format before insert/update
CREATE OR REPLACE FUNCTION validate_clinician_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure clinician_id is a valid UUID
  IF NEW.clinician_id IS NOT NULL THEN
    -- This will raise an exception if the ID is invalid
    NEW.clinician_id := standardize_uuid(NEW.clinician_id::text);
    
    -- Check if the clinician exists in the profiles table
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.clinician_id) THEN
      RAISE EXCEPTION 'Clinician ID % does not exist in the profiles table', NEW.clinician_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for calendar_events
DROP TRIGGER IF EXISTS validate_clinician_id_trigger ON calendar_events;
CREATE TRIGGER validate_clinician_id_trigger
BEFORE INSERT OR UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION validate_clinician_id();

-- Create the trigger for appointments if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
    EXECUTE '
      DROP TRIGGER IF EXISTS validate_clinician_id_trigger ON appointments;
      CREATE TRIGGER validate_clinician_id_trigger
      BEFORE INSERT OR UPDATE ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION validate_clinician_id();
    ';
  END IF;
END $$;

-- Step 8: Update the can_manage_clinician_calendar function to handle ID format issues
CREATE OR REPLACE FUNCTION public.can_manage_clinician_calendar(user_id text, target_clinician_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  is_self boolean;
  valid_user_id uuid;
  valid_clinician_id uuid;
BEGIN
  -- Standardize the IDs
  BEGIN
    valid_user_id := standardize_uuid(user_id);
    valid_clinician_id := standardize_uuid(target_clinician_id);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error and return false if IDs cannot be standardized
    RAISE WARNING 'Invalid ID format in can_manage_clinician_calendar: user_id=%, clinician_id=%', user_id, target_clinician_id;
    RETURN false;
  END;
  
  -- Check if user is managing their own calendar
  is_self := valid_user_id = valid_clinician_id;
  
  -- If it's their own calendar, they have permission
  IF is_self THEN
    RETURN true;
  END IF;
  
  -- Check if user is an admin
  SELECT role INTO user_role FROM profiles WHERE id = valid_user_id;
  
  -- Admins have permission to manage any calendar
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Otherwise, no permission
  RETURN false;
END;
$$;

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.standardize_uuid(text) IS 'Standardizes a string into a valid UUID format';
COMMENT ON FUNCTION public.validate_clinician_id() IS 'Validates that clinician_id is a valid UUID and exists in the profiles table';