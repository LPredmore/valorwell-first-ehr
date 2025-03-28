
-- Add meeting_url column to appointments table
ALTER TABLE IF EXISTS public.appointments
ADD COLUMN IF NOT EXISTS meeting_url text;
