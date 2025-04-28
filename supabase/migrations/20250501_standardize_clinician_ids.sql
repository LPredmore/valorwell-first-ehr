-- Migration: 20250501_standardize_clinician_ids.sql
-- Description: Standardize clinician IDs across all tables to ensure they are valid UUIDs
-- Author: System Administrator
-- Date: 2025-05-01

-- Step 1: Ensure all clinician_id values are properly formatted as UUIDs in all tables

-- Fix calendar_events table
UPDATE calendar_events
SET clinician_id = CAST(clinician_id AS UUID)
WHERE clinician_id IS NOT NULL AND clinician_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Fix appointments table
UPDATE appointments
SET clinician_id = CAST(clinician_id AS UUID)
WHERE clinician_id IS NOT NULL AND clinician_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Fix time_off table
UPDATE time_off
SET clinician_id = CAST(clinician_id AS UUID)
WHERE clinician_id IS NOT NULL AND clinician_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Fix availability_settings table
UPDATE availability_settings
SET clinician_id = CAST(clinician_id AS UUID)
WHERE clinician_id IS NOT NULL AND clinician_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 2: Add NOT NULL constraints where appropriate

-- Add NOT NULL constraint to calendar_events.clinician_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' 
    AND column_name = 'clinician_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE calendar_events ALTER COLUMN clinician_id SET NOT NULL;
  END IF;
END $$;

-- Add NOT NULL constraint to appointments.clinician_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'clinician_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE appointments ALTER COLUMN clinician_id SET NOT NULL;
  END IF;
END $$;

-- Step 3: Add foreign key constraints if not already present

-- Add foreign key constraint to calendar_events if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_calendar_events_clinician' 
    AND table_name = 'calendar_events'
  ) THEN
    ALTER TABLE calendar_events
      ADD CONSTRAINT fk_calendar_events_clinician
      FOREIGN KEY (clinician_id) 
      REFERENCES profiles(id);
  END IF;
END $$;

-- Add foreign key constraint to appointments if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_appointments_clinician' 
    AND table_name = 'appointments'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT fk_appointments_clinician
      FOREIGN KEY (clinician_id) 
      REFERENCES profiles(id);
  END IF;
END $$;

-- Add foreign key constraint to time_off if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_time_off_clinician' 
    AND table_name = 'time_off'
  ) THEN
    ALTER TABLE time_off
      ADD CONSTRAINT fk_time_off_clinician
      FOREIGN KEY (clinician_id) 
      REFERENCES profiles(id);
  END IF;
END $$;

-- Add foreign key constraint to availability_settings if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_availability_settings_clinician' 
    AND table_name = 'availability_settings'
  ) THEN
    ALTER TABLE availability_settings
      ADD CONSTRAINT fk_availability_settings_clinician
      FOREIGN KEY (clinician_id) 
      REFERENCES profiles(id);
  END IF;
END $$;

-- Step 4: Create a trigger function to validate clinician_id format on insert/update

CREATE OR REPLACE FUNCTION public.validate_clinician_id()
RETURNS trigger AS $$
BEGIN
  -- Check if clinician_id is a valid UUID format
  IF NEW.clinician_id IS NULL OR NEW.clinician_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid clinician_id format. Must be a valid UUID.';
  END IF;
  
  -- Check if clinician_id exists in profiles table
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.clinician_id) THEN
    RAISE EXCEPTION 'Clinician ID does not exist in profiles table.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Apply the validation trigger to all relevant tables

-- Add trigger to calendar_events
DROP TRIGGER IF EXISTS validate_clinician_id_calendar_events ON public.calendar_events;
CREATE TRIGGER validate_clinician_id_calendar_events
  BEFORE INSERT OR UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE PROCEDURE public.validate_clinician_id();

-- Add trigger to appointments
DROP TRIGGER IF EXISTS validate_clinician_id_appointments ON public.appointments;
CREATE TRIGGER validate_clinician_id_appointments
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE PROCEDURE public.validate_clinician_id();

-- Add trigger to time_off
DROP TRIGGER IF EXISTS validate_clinician_id_time_off ON public.time_off;
CREATE TRIGGER validate_clinician_id_time_off
  BEFORE INSERT OR UPDATE ON public.time_off
  FOR EACH ROW
  EXECUTE PROCEDURE public.validate_clinician_id();

-- Add trigger to availability_settings
DROP TRIGGER IF EXISTS validate_clinician_id_availability_settings ON public.availability_settings;
CREATE TRIGGER validate_clinician_id_availability_settings
  BEFORE INSERT OR UPDATE ON public.availability_settings
  FOR EACH ROW
  EXECUTE PROCEDURE public.validate_clinician_id();

-- Step 6: Add indexes for better performance if not already present

-- Add index to calendar_events.clinician_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'calendar_events' 
    AND indexname = 'idx_calendar_events_clinician_id'
  ) THEN
    CREATE INDEX idx_calendar_events_clinician_id ON calendar_events(clinician_id);
  END IF;
END $$;

-- Add index to appointments.clinician_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'appointments' 
    AND indexname = 'idx_appointments_clinician_id'
  ) THEN
    CREATE INDEX idx_appointments_clinician_id ON appointments(clinician_id);
  END IF;
END $$;

-- Add index to time_off.clinician_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'time_off' 
    AND indexname = 'idx_time_off_clinician_id'
  ) THEN
    CREATE INDEX idx_time_off_clinician_id ON time_off(clinician_id);
  END IF;
END $$;

-- Add index to availability_settings.clinician_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'availability_settings' 
    AND indexname = 'idx_availability_settings_clinician_id'
  ) THEN
    CREATE INDEX idx_availability_settings_clinician_id ON availability_settings(clinician_id);
  END IF;
END $$;

-- Add documentation comments
COMMENT ON FUNCTION public.validate_clinician_id() IS 'Validates that clinician_id is a valid UUID and exists in the profiles table';
COMMENT ON TRIGGER validate_clinician_id_calendar_events ON public.calendar_events IS 'Ensures clinician_id is valid in calendar_events table';
COMMENT ON TRIGGER validate_clinician_id_appointments ON public.appointments IS 'Ensures clinician_id is valid in appointments table';
COMMENT ON TRIGGER validate_clinician_id_time_off ON public.time_off IS 'Ensures clinician_id is valid in time_off table';
COMMENT ON TRIGGER validate_clinician_id_availability_settings ON public.availability_settings IS 'Ensures clinician_id is valid in availability_settings table';