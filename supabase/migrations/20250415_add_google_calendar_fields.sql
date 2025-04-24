
-- Add Google Calendar fields to profiles table
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS google_calendar_linked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_last_sync TIMESTAMP WITH TIME ZONE;

-- Add Google Calendar fields to calendar_events table
ALTER TABLE IF EXISTS public.calendar_events
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id
ON public.calendar_events(google_event_id);
