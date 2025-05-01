-- Calendar System Database Schema
-- Based on analysis of existing migrations and requirements

-- Clinicians Table (must be preserved)
-- This will be the primary source of truth for clinician information
CREATE TABLE IF NOT EXISTS public.clinicians (
    id UUID PRIMARY KEY,
    clinician_professional_name TEXT NOT NULL,
    clinician_first_name TEXT,
    clinician_last_name TEXT,
    clinician_email TEXT,
    clinician_phone TEXT,
    clinician_status TEXT DEFAULT 'active',
    clinician_time_zone TEXT DEFAULT 'America/Chicago',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calendar Events Table (consolidated)
-- This will store all types of calendar events: availability, appointments, time off
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('availability', 'appointment', 'time_off')),
    title TEXT,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_pattern TEXT, -- iCalendar RRULE format
    recurrence_id UUID, -- Links recurring events
    client_id UUID, -- Only for appointments
    all_day BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure end time is after start time
    CONSTRAINT calendar_events_end_after_start CHECK (end_time > start_time)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_clinician_id ON public.calendar_events(clinician_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client_id ON public.calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_id ON public.calendar_events(recurrence_id);

-- Calendar Exceptions Table
-- For handling exceptions to recurring events (e.g., cancellations, modifications)
CREATE TABLE IF NOT EXISTS public.calendar_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    exception_date TIMESTAMPTZ NOT NULL,
    is_cancelled BOOLEAN NOT NULL DEFAULT false,
    modified_start_time TIMESTAMPTZ,
    modified_end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_exceptions_event_id ON public.calendar_exceptions(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_exceptions_date ON public.calendar_exceptions(exception_date);

-- Availability Settings Table
-- For storing clinician availability preferences
CREATE TABLE IF NOT EXISTS public.availability_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES public.clinicians(id) ON DELETE CASCADE,
    default_slot_duration INTEGER NOT NULL DEFAULT 60, -- in minutes
    buffer_time INTEGER NOT NULL DEFAULT 0, -- in minutes
    time_zone TEXT NOT NULL DEFAULT 'America/Chicago',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_clinician_settings UNIQUE (clinician_id)
);

-- Function to prevent overlapping availability
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
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        -- Only check against events with the same recurrence pattern
        AND (
          (NEW.is_recurring = FALSE AND is_recurring = FALSE) OR
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

-- Create a trigger for the overlap prevention function
DROP TRIGGER IF EXISTS check_availability_overlap ON public.calendar_events;
CREATE TRIGGER check_availability_overlap
  BEFORE INSERT OR UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_overlapping_availability();

-- Function to check if a user has permission to manage a clinician's calendar
CREATE OR REPLACE FUNCTION public.can_manage_clinician_calendar(user_id uuid, target_clinician_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_self boolean;
  is_admin boolean;
BEGIN
  -- Check if user is managing their own calendar
  is_self := user_id = target_clinician_id;
  
  -- If it's their own calendar, they have permission
  IF is_self THEN
    RETURN true;
  END IF;
  
  -- Check if user is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.clinicians
    WHERE id = user_id AND clinician_status = 'admin'
  ) INTO is_admin;
  
  -- Admins have permission to manage any calendar
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Otherwise, no permission
  RETURN false;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can view their own calendar events" 
ON public.calendar_events
FOR SELECT
USING (
  clinician_id = auth.uid() OR 
  can_manage_clinician_calendar(auth.uid(), clinician_id) OR
  (event_type = 'appointment' AND client_id = auth.uid())
);

CREATE POLICY "Users can manage their own calendar events" 
ON public.calendar_events
FOR ALL
USING (
  clinician_id = auth.uid() OR 
  can_manage_clinician_calendar(auth.uid(), clinician_id)
)
WITH CHECK (
  clinician_id = auth.uid() OR 
  can_manage_clinician_calendar(auth.uid(), clinician_id)
);

-- RLS Policies for calendar_exceptions
CREATE POLICY "Users can view their own calendar exceptions" 
ON public.calendar_exceptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.calendar_events
    WHERE id = calendar_event_id AND (
      clinician_id = auth.uid() OR 
      can_manage_clinician_calendar(auth.uid(), clinician_id) OR
      (event_type = 'appointment' AND client_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can manage their own calendar exceptions" 
ON public.calendar_exceptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.calendar_events
    WHERE id = calendar_event_id AND (
      clinician_id = auth.uid() OR 
      can_manage_clinician_calendar(auth.uid(), clinician_id)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.calendar_events
    WHERE id = calendar_event_id AND (
      clinician_id = auth.uid() OR 
      can_manage_clinician_calendar(auth.uid(), clinician_id)
    )
  )
);

-- RLS Policies for availability_settings
CREATE POLICY "Users can view their own availability settings" 
ON public.availability_settings
FOR SELECT
USING (
  clinician_id = auth.uid() OR 
  can_manage_clinician_calendar(auth.uid(), clinician_id)
);

CREATE POLICY "Users can manage their own availability settings" 
ON public.availability_settings
FOR ALL
USING (
  clinician_id = auth.uid() OR 
  can_manage_clinician_calendar(auth.uid(), clinician_id)
)
WITH CHECK (
  clinician_id = auth.uid() OR 
  can_manage_clinician_calendar(auth.uid(), clinician_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.calendar_events IS 'Consolidated table for all calendar events including availability, appointments, and time off';
COMMENT ON TABLE public.calendar_exceptions IS 'Exceptions to recurring calendar events';
COMMENT ON TABLE public.availability_settings IS 'Settings for clinician availability';
COMMENT ON FUNCTION public.prevent_overlapping_availability() IS 'Prevents overlapping availability slots for the same clinician';
COMMENT ON FUNCTION public.can_manage_clinician_calendar(uuid, uuid) IS 'Checks if a user has permission to manage a clinician''s calendar';