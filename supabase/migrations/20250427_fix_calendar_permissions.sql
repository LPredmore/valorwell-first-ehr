-- This migration fixes issues with calendar permissions and overlapping availability

-- First, ensure all clinician_id values are properly formatted as UUIDs
UPDATE calendar_events 
SET clinician_id = CAST(clinician_id AS UUID)
WHERE clinician_id IS NOT NULL AND clinician_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Fix the prevent_overlapping_availability function
CREATE OR REPLACE FUNCTION public.prevent_overlapping_availability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check for overlaps if this is an active availability event
  IF NEW.event_type = 'availability' AND NEW.is_active = TRUE THEN
    -- Check for overlapping events from the same clinician
    IF EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE
        clinician_id = NEW.clinician_id
        AND event_type = 'availability'
        AND is_active = TRUE
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid) -- Handle new records without IDs
        -- Only check against events with the same recurrence pattern
        -- If both are non-recurring (NULL), or both have the same recurrence_id
        AND (
          (NEW.recurrence_id IS NULL AND recurrence_id IS NULL) OR
          (NEW.recurrence_id IS NOT NULL AND recurrence_id = NEW.recurrence_id)
        )
        AND (
          -- Standard overlap check
          (NEW.start_time < end_time AND NEW.end_time > start_time)
        )
    ) THEN
      RAISE EXCEPTION 'Overlapping availability slot detected. Please choose a different time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create a function to check if a user has permission to manage a clinician's calendar
CREATE OR REPLACE FUNCTION public.can_manage_clinician_calendar(user_id uuid, target_clinician_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  is_self boolean;
BEGIN
  -- Check if user is managing their own calendar
  is_self := user_id = target_clinician_id;
  
  -- If it's their own calendar, they have permission
  IF is_self THEN
    RETURN true;
  END IF;
  
  -- Check if user is an admin
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Admins have permission to manage any calendar
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Otherwise, no permission
  RETURN false;
END;
$$;

-- Create a debug function to check permissions without actually modifying data
CREATE OR REPLACE FUNCTION public.debug_rls_check(
  schema_name text,
  table_name text,
  operation text,
  record_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  result boolean;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO current_user_id;
  
  -- For calendar_events table, use our special function
  IF table_name = 'calendar_events' AND operation IN ('INSERT', 'UPDATE', 'DELETE') THEN
    -- Convert record_id to UUID if it's a valid UUID
    IF record_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RETURN public.can_manage_clinician_calendar(current_user_id, record_id::uuid);
    ELSE
      -- If not a valid UUID, check if it's the user's own ID
      RETURN current_user_id::text = record_id;
    END IF;
  END IF;
  
  -- For other tables, just return true for now (this is just a debug function)
  RETURN true;
END;
$$;

-- Update the RLS policy for calendar_events
DROP POLICY IF EXISTS "Users can manage their own calendar events" ON calendar_events;
CREATE POLICY "Users can manage their own calendar events" 
ON calendar_events
USING (
  clinician_id = auth.uid() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  clinician_id = auth.uid() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.prevent_overlapping_availability() IS 'Prevents overlapping availability slots for the same clinician';
COMMENT ON FUNCTION public.can_manage_clinician_calendar(uuid, uuid) IS 'Checks if a user has permission to manage a clinician''s calendar';
COMMENT ON FUNCTION public.debug_rls_check(text, text, text, text) IS 'Debug function to check RLS permissions without modifying data';