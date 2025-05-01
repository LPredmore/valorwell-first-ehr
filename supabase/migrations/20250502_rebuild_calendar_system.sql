-- Migration: 20250502_rebuild_calendar_system.sql
-- Description: Rebuild the calendar system with a new database schema
-- This migration implements the first phase of the calendar system rebuild
-- as specified in the architectural plan.

-- Drop dependent views first to avoid dependency issues
DROP VIEW IF EXISTS public.unified_calendar_view;

-- Drop existing triggers
DROP TRIGGER IF EXISTS check_availability_overlap ON public.calendar_events;
DROP TRIGGER IF EXISTS parse_rrule_trigger ON public.recurrence_rules;
DROP TRIGGER IF EXISTS check_overlapping_availability_trigger ON public.calendar_events;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.prevent_overlapping_availability();
DROP FUNCTION IF EXISTS public.parse_rrule();
DROP FUNCTION IF EXISTS public.is_date_in_recurrence(TIMESTAMP WITH TIME ZONE, UUID);
DROP FUNCTION IF EXISTS public.get_next_occurrence(UUID, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.expand_recurring_event(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.check_overlapping_availability();

-- Create new tables

-- Replace availability_settings with calendar_settings
CREATE TABLE public.calendar_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    default_slot_duration INTEGER NOT NULL DEFAULT 60,
    max_advance_days INTEGER NOT NULL DEFAULT 30,
    min_notice_days INTEGER NOT NULL DEFAULT 1,
    time_zone TEXT NOT NULL DEFAULT 'America/Chicago',
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (id)
);

-- Create recurrence_patterns table
CREATE TABLE public.recurrence_patterns (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    rrule TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Replace calendar_events with availability_blocks for availability only
CREATE TABLE public.availability_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    availability_type TEXT NOT NULL CHECK (availability_type IN ('recurring', 'single')),
    recurrence_pattern_id UUID REFERENCES recurrence_patterns(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    time_zone TEXT NOT NULL DEFAULT 'America/Chicago',
    PRIMARY KEY (id),
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    CONSTRAINT recurrence_required CHECK (
        CASE WHEN availability_type = 'recurring' 
             THEN recurrence_pattern_id IS NOT NULL
             ELSE true
        END
    )
);

-- Replace calendar_exceptions with availability_exceptions
CREATE TABLE public.availability_exceptions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    availability_block_id UUID NOT NULL REFERENCES availability_blocks(id) ON DELETE CASCADE,
    exception_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_cancelled BOOLEAN DEFAULT false,
    replacement_block_id UUID REFERENCES availability_blocks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Update appointments table
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    clinician_id UUID NOT NULL REFERENCES clinicians(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    recurrence_group_id UUID,
    time_zone TEXT NOT NULL DEFAULT 'America/Chicago',
    PRIMARY KEY (id),
    CONSTRAINT valid_appointment_time CHECK (start_time < end_time)
);

-- Update time_off table
CREATE TABLE public.time_off (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    clinician_id UUID NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    all_day BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    time_zone TEXT NOT NULL DEFAULT 'America/Chicago',
    PRIMARY KEY (id),
    CONSTRAINT valid_time_off_time CHECK (start_time < end_time)
);

-- Create indexes for better performance
CREATE INDEX idx_calendar_settings_clinician_id ON public.calendar_settings(clinician_id);
CREATE INDEX idx_availability_blocks_clinician_id ON public.availability_blocks(clinician_id);
CREATE INDEX idx_availability_blocks_start_time ON public.availability_blocks(start_time);
CREATE INDEX idx_availability_blocks_end_time ON public.availability_blocks(end_time);
CREATE INDEX idx_availability_blocks_recurrence_pattern_id ON public.availability_blocks(recurrence_pattern_id);
CREATE INDEX idx_availability_exceptions_availability_block_id ON public.availability_exceptions(availability_block_id);
CREATE INDEX idx_appointments_clinician_id ON public.appointments(clinician_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_end_time ON public.appointments(end_time);
CREATE INDEX idx_appointments_recurrence_group_id ON public.appointments(recurrence_group_id);
CREATE INDEX idx_time_off_clinician_id ON public.time_off(clinician_id);
CREATE INDEX idx_time_off_start_time ON public.time_off(start_time);
CREATE INDEX idx_time_off_end_time ON public.time_off(end_time);

-- Create a function to prevent overlapping availability
CREATE OR REPLACE FUNCTION public.prevent_overlapping_availability()
RETURNS trigger AS $$
BEGIN
  -- Check for overlapping events
  IF EXISTS (
    SELECT 1 FROM public.availability_blocks
    WHERE 
      clinician_id = NEW.clinician_id
      AND is_active = TRUE
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid) -- Handle new records without IDs
      AND (
        -- Standard overlap check
        (NEW.start_time < end_time AND NEW.end_time > start_time)
      )
  ) THEN
    RAISE EXCEPTION 'Overlapping availability slot detected. Please choose a different time.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for the overlap prevention function
CREATE TRIGGER check_availability_overlap
  BEFORE INSERT OR UPDATE ON public.availability_blocks
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_overlapping_availability();

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_calendar_settings_timestamp
  BEFORE UPDATE ON public.calendar_settings
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_availability_blocks_timestamp
  BEFORE UPDATE ON public.availability_blocks
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_availability_exceptions_timestamp
  BEFORE UPDATE ON public.availability_exceptions
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_appointments_timestamp
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_time_off_timestamp
  BEFORE UPDATE ON public.time_off
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_timestamp();

CREATE TRIGGER update_recurrence_patterns_timestamp
  BEFORE UPDATE ON public.recurrence_patterns
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_timestamp();

-- Create unified calendar view
CREATE OR REPLACE VIEW public.unified_calendar_view AS
  -- Availability blocks
  SELECT
    id,
    clinician_id,
    'availability' as event_type,
    'Availability' as title,
    start_time,
    end_time,
    is_active,
    recurrence_pattern_id as recurrence_id,
    false as all_day,
    'availability_blocks' as source_table
  FROM 
    public.availability_blocks
  
  UNION ALL
  
  -- Appointments
  SELECT
    id,
    clinician_id,
    'appointment' as event_type,
    COALESCE(type, 'Appointment') as title,
    start_time,
    end_time,
    (status = 'scheduled') as is_active,
    recurrence_group_id as recurrence_id,
    false as all_day,
    'appointments' as source_table
  FROM 
    public.appointments
  
  UNION ALL
  
  -- Time off
  SELECT
    id,
    clinician_id,
    'time_off' as event_type,
    COALESCE(reason, 'Time Off') as title,
    start_time,
    end_time,
    true as is_active,
    NULL as recurrence_id,
    all_day,
    'time_off' as source_table
  FROM 
    public.time_off;

-- Add Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_patterns ENABLE ROW LEVEL SECURITY;

-- Calendar settings policies
CREATE POLICY calendar_settings_select_policy ON public.calendar_settings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY calendar_settings_insert_policy ON public.calendar_settings
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY calendar_settings_update_policy ON public.calendar_settings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY calendar_settings_delete_policy ON public.calendar_settings
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

-- Availability blocks policies
CREATE POLICY availability_blocks_select_policy ON public.availability_blocks
  FOR SELECT USING (true); -- Everyone can view availability

CREATE POLICY availability_blocks_insert_policy ON public.availability_blocks
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY availability_blocks_update_policy ON public.availability_blocks
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY availability_blocks_delete_policy ON public.availability_blocks
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

-- Availability exceptions policies
CREATE POLICY availability_exceptions_select_policy ON public.availability_exceptions
  FOR SELECT USING (true); -- Everyone can view exceptions

CREATE POLICY availability_exceptions_insert_policy ON public.availability_exceptions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.availability_blocks
      WHERE id = availability_block_id
      AND clinician_id IN (
        SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY availability_exceptions_update_policy ON public.availability_exceptions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.availability_blocks
      WHERE id = availability_block_id
      AND clinician_id IN (
        SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY availability_exceptions_delete_policy ON public.availability_exceptions
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.availability_blocks
      WHERE id = availability_block_id
      AND clinician_id IN (
        SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
      )
    )
  );

-- Appointments policies
CREATE POLICY appointments_select_policy ON public.appointments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    ) OR
    client_id IN (
      SELECT id FROM public.clients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY appointments_insert_policy ON public.appointments
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY appointments_update_policy ON public.appointments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY appointments_delete_policy ON public.appointments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

-- Time off policies
CREATE POLICY time_off_select_policy ON public.time_off
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY time_off_insert_policy ON public.time_off
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY time_off_update_policy ON public.time_off
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY time_off_delete_policy ON public.time_off
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    clinician_id IN (
      SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

-- Recurrence patterns policies
CREATE POLICY recurrence_patterns_select_policy ON public.recurrence_patterns
  FOR SELECT USING (true); -- Everyone can view recurrence patterns

CREATE POLICY recurrence_patterns_insert_policy ON public.recurrence_patterns
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.clinicians WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY recurrence_patterns_update_policy ON public.recurrence_patterns
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.availability_blocks
      WHERE recurrence_pattern_id = id
      AND clinician_id IN (
        SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY recurrence_patterns_delete_policy ON public.recurrence_patterns
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.availability_blocks
      WHERE recurrence_pattern_id = id
      AND clinician_id IN (
        SELECT id FROM public.clinicians WHERE profile_id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.calendar_settings IS 'Stores calendar configuration settings for clinicians';
COMMENT ON TABLE public.availability_blocks IS 'Stores availability blocks for clinicians';
COMMENT ON TABLE public.availability_exceptions IS 'Stores exceptions to recurring availability blocks';
COMMENT ON TABLE public.appointments IS 'Stores appointment information';
COMMENT ON TABLE public.time_off IS 'Stores time off periods for clinicians';
COMMENT ON TABLE public.recurrence_patterns IS 'Stores recurrence patterns for recurring events';
COMMENT ON VIEW public.unified_calendar_view IS 'A unified view of all calendar-related events including appointments, availability, and time off';