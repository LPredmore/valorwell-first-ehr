-- This migration fixes issues with recurrence_id handling in calendar_events table

-- First, ensure we have the proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_id ON calendar_events(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_event_id ON recurrence_rules(event_id);

-- Create a function to automatically update recurrence_id when a recurrence rule is created
CREATE OR REPLACE FUNCTION update_event_recurrence_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the calendar_events table with the recurrence_id
  UPDATE calendar_events
  SET recurrence_id = NEW.id
  WHERE id = NEW.event_id AND recurrence_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update recurrence_id
DROP TRIGGER IF EXISTS update_event_recurrence_id_trigger ON recurrence_rules;
CREATE TRIGGER update_event_recurrence_id_trigger
AFTER INSERT ON recurrence_rules
FOR EACH ROW
EXECUTE FUNCTION update_event_recurrence_id();

-- Add a comment explaining the function's purpose
COMMENT ON FUNCTION update_event_recurrence_id() IS 'Automatically updates the recurrence_id in calendar_events when a new recurrence rule is created';