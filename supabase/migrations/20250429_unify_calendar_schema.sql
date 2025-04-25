
-- Standardize the appointments table to be consistent with calendar_events
-- Convert clinician_id to UUID type and add datetime fields for appointments
-- Add indexes for performance and foreign key relationships

-- First ensure clinician_id is properly formatted as UUID
UPDATE appointments 
SET clinician_id = CAST(clinician_id AS UUID)
WHERE clinician_id IS NOT NULL;

-- Apply the change to UUID type
ALTER TABLE appointments 
  ALTER COLUMN clinician_id TYPE uuid USING clinician_id::uuid;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_clinician_id ON appointments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Add index for calendar events table
CREATE INDEX IF NOT EXISTS idx_calendar_events_clinician_id ON calendar_events(clinician_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);

-- Add foreign key constraints
ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_clinician
  FOREIGN KEY (clinician_id) 
  REFERENCES profiles(id);

ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_client
  FOREIGN KEY (client_id) 
  REFERENCES clients(id);

-- Add foreign key to calendar_events
ALTER TABLE calendar_events
  ADD CONSTRAINT fk_calendar_events_clinician
  FOREIGN KEY (clinician_id) 
  REFERENCES profiles(id);

-- Create a function to prevent overlapping availability in calendar_events
CREATE OR REPLACE FUNCTION public.prevent_overlapping_availability()
RETURNS trigger AS $$
BEGIN
  -- Only check for overlaps if this is an active availability event
  IF NEW.event_type = 'availability' AND NEW.is_active = TRUE THEN
    -- Check for overlapping events
    IF EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE 
        clinician_id = NEW.clinician_id
        AND event_type = 'availability'
        AND is_active = TRUE
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid) -- Handle new records without IDs
        AND recurrence_id IS NOT DISTINCT FROM NEW.recurrence_id -- Only check against events with same recurrence ID or both NULL
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
$$ LANGUAGE plpgsql;

-- Create a trigger for the overlap prevention function
DROP TRIGGER IF EXISTS check_availability_overlap ON public.calendar_events;
CREATE TRIGGER check_availability_overlap
  BEFORE INSERT OR UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_overlapping_availability();

-- Create a view to show all calendar events (appointments, availability, time off)
CREATE OR REPLACE VIEW public.unified_calendar_view AS
  -- Calendar events (availability, etc.)
  SELECT
    id,
    clinician_id,
    event_type,
    title,
    start_time,
    end_time,
    is_active,
    recurrence_id,
    all_day,
    'calendar_event' as source_table
  FROM 
    public.calendar_events
  
  UNION ALL
  
  -- Appointments
  SELECT
    id,
    clinician_id,
    'appointment' as event_type,
    COALESCE(type, 'Appointment') as title,
    COALESCE(appointment_datetime, (date || ' ' || start_time)::timestamp) as start_time,
    COALESCE(appointment_end_datetime, (date || ' ' || end_time)::timestamp) as end_time,
    (status = 'scheduled') as is_active,
    recurring_group_id as recurrence_id,
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
    (date || ' ' || start_time)::timestamp as start_time,
    (date || ' ' || end_time)::timestamp as end_time,
    true as is_active,
    NULL as recurrence_id,
    all_day,
    'time_off' as source_table
  FROM 
    public.time_off;

-- Add comments for documentation
COMMENT ON VIEW public.unified_calendar_view IS 'A unified view of all calendar-related events including appointments, availability, and time off';
