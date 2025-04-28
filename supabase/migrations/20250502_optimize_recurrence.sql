-- Migration: 20250502_optimize_recurrence.sql
-- Description: Optimize the database schema for recurrence handling
-- This migration improves the structure of the recurrence_rules table,
-- adds indexes for better performance, and implements database functions
-- for common recurrence operations.

-- First, ensure we have the proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_rrule ON recurrence_rules USING gin (to_tsvector('english', rrule));
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_id ON calendar_events(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_clinician_id_event_type ON calendar_events(clinician_id, event_type);

-- Add additional columns to the recurrence_rules table for better querying
ALTER TABLE recurrence_rules 
ADD COLUMN IF NOT EXISTS frequency TEXT,
ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS by_day TEXT[],
ADD COLUMN IF NOT EXISTS by_month_day INTEGER[],
ADD COLUMN IF NOT EXISTS by_month INTEGER[],
ADD COLUMN IF NOT EXISTS count INTEGER,
ADD COLUMN IF NOT EXISTS until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Create a function to parse RRule and populate the new columns
CREATE OR REPLACE FUNCTION parse_rrule()
RETURNS TRIGGER AS $$
DECLARE
    freq_match TEXT;
    interval_match TEXT;
    byday_match TEXT;
    bymonthday_match TEXT;
    bymonth_match TEXT;
    count_match TEXT;
    until_match TEXT;
BEGIN
    -- Extract frequency
    SELECT substring(NEW.rrule FROM 'FREQ=([^;]+)') INTO freq_match;
    IF freq_match IS NOT NULL THEN
        NEW.frequency := freq_match;
    END IF;
    
    -- Extract interval
    SELECT substring(NEW.rrule FROM 'INTERVAL=([0-9]+)') INTO interval_match;
    IF interval_match IS NOT NULL THEN
        NEW.interval := interval_match::INTEGER;
    ELSE
        NEW.interval := 1;
    END IF;
    
    -- Extract BYDAY
    SELECT substring(NEW.rrule FROM 'BYDAY=([^;]+)') INTO byday_match;
    IF byday_match IS NOT NULL THEN
        NEW.by_day := string_to_array(byday_match, ',');
    END IF;
    
    -- Extract BYMONTHDAY
    SELECT substring(NEW.rrule FROM 'BYMONTHDAY=([^;]+)') INTO bymonthday_match;
    IF bymonthday_match IS NOT NULL THEN
        NEW.by_month_day := string_to_array(bymonthday_match, ',')::INTEGER[];
    END IF;
    
    -- Extract BYMONTH
    SELECT substring(NEW.rrule FROM 'BYMONTH=([^;]+)') INTO bymonth_match;
    IF bymonth_match IS NOT NULL THEN
        NEW.by_month := string_to_array(bymonth_match, ',')::INTEGER[];
    END IF;
    
    -- Extract COUNT
    SELECT substring(NEW.rrule FROM 'COUNT=([0-9]+)') INTO count_match;
    IF count_match IS NOT NULL THEN
        NEW.count := count_match::INTEGER;
    END IF;
    
    -- Extract UNTIL
    SELECT substring(NEW.rrule FROM 'UNTIL=([^;]+)') INTO until_match;
    IF until_match IS NOT NULL THEN
        -- Parse the UNTIL date format (typically YYYYMMDDTHHMMSSZ)
        BEGIN
            NEW.until := to_timestamp(until_match, 'YYYYMMDD"T"HH24MISS"Z"')::TIMESTAMP WITH TIME ZONE;
        EXCEPTION WHEN OTHERS THEN
            -- If parsing fails, try without the time component
            BEGIN
                NEW.until := to_timestamp(until_match, 'YYYYMMDD')::TIMESTAMP WITH TIME ZONE;
            EXCEPTION WHEN OTHERS THEN
                -- If all parsing fails, set to NULL
                NEW.until := NULL;
            END;
        END;
    END IF;
    
    -- Get timezone from the associated calendar event
    SELECT time_zone INTO NEW.timezone
    FROM calendar_events
    WHERE id = NEW.event_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically parse RRule on insert or update
DROP TRIGGER IF EXISTS parse_rrule_trigger ON recurrence_rules;
CREATE TRIGGER parse_rrule_trigger
BEFORE INSERT OR UPDATE ON recurrence_rules
FOR EACH ROW
EXECUTE FUNCTION parse_rrule();

-- Update existing recurrence rules to populate the new columns
UPDATE recurrence_rules SET rrule = rrule WHERE TRUE;

-- Create a function to check if a date falls within a recurrence pattern
CREATE OR REPLACE FUNCTION is_date_in_recurrence(
    p_date TIMESTAMP WITH TIME ZONE,
    p_recurrence_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_frequency TEXT;
    v_interval INTEGER;
    v_by_day TEXT[];
    v_by_month_day INTEGER[];
    v_by_month INTEGER[];
    v_count INTEGER;
    v_until TIMESTAMP WITH TIME ZONE;
    v_event_id UUID;
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_weekday INTEGER;
    v_day INTEGER;
    v_month INTEGER;
    v_matches BOOLEAN := FALSE;
BEGIN
    -- Get recurrence rule details
    SELECT 
        frequency, interval, by_day, by_month_day, by_month, count, until, event_id
    INTO 
        v_frequency, v_interval, v_by_day, v_by_month_day, v_by_month, v_count, v_until, v_event_id
    FROM 
        recurrence_rules
    WHERE 
        id = p_recurrence_id;
    
    IF v_frequency IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get the start time of the original event
    SELECT start_time INTO v_start_time
    FROM calendar_events
    WHERE id = v_event_id;
    
    -- Check if the date is after the until date
    IF v_until IS NOT NULL AND p_date > v_until THEN
        RETURN FALSE;
    END IF;
    
    -- Extract date components
    v_weekday := EXTRACT(DOW FROM p_date);
    v_day := EXTRACT(DAY FROM p_date);
    v_month := EXTRACT(MONTH FROM p_date);
    
    -- Check frequency-specific conditions
    CASE v_frequency
        WHEN 'DAILY' THEN
            -- For daily recurrence, check if the days between are divisible by the interval
            v_matches := (EXTRACT(EPOCH FROM (p_date - v_start_time)) / 86400) % v_interval = 0;
            
        WHEN 'WEEKLY' THEN
            -- For weekly recurrence, check if the weekday matches and the weeks between are divisible by the interval
            IF v_by_day IS NOT NULL THEN
                -- Convert weekday number to day code
                DECLARE
                    day_codes TEXT[] := ARRAY['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
                    day_code TEXT := day_codes[v_weekday + 1];
                BEGIN
                    v_matches := day_code = ANY(v_by_day) AND 
                                (EXTRACT(EPOCH FROM (p_date - v_start_time)) / 604800) % v_interval = 0;
                END;
            ELSE
                -- If no specific days are specified, check if it's the same weekday and the weeks between are divisible by the interval
                v_matches := EXTRACT(DOW FROM p_date) = EXTRACT(DOW FROM v_start_time) AND
                            (EXTRACT(EPOCH FROM (p_date - v_start_time)) / 604800) % v_interval = 0;
            END IF;
            
        WHEN 'MONTHLY' THEN
            -- For monthly recurrence, check if the day of month matches and the months between are divisible by the interval
            IF v_by_month_day IS NOT NULL THEN
                v_matches := v_day = ANY(v_by_month_day) AND
                            (EXTRACT(YEAR FROM p_date) * 12 + EXTRACT(MONTH FROM p_date) - 
                             EXTRACT(YEAR FROM v_start_time) * 12 - EXTRACT(MONTH FROM v_start_time)) % v_interval = 0;
            ELSE
                -- If no specific days are specified, check if it's the same day of month and the months between are divisible by the interval
                v_matches := EXTRACT(DAY FROM p_date) = EXTRACT(DAY FROM v_start_time) AND
                            (EXTRACT(YEAR FROM p_date) * 12 + EXTRACT(MONTH FROM p_date) - 
                             EXTRACT(YEAR FROM v_start_time) * 12 - EXTRACT(MONTH FROM v_start_time)) % v_interval = 0;
            END IF;
            
        WHEN 'YEARLY' THEN
            -- For yearly recurrence, check if the month and day match and the years between are divisible by the interval
            IF v_by_month IS NOT NULL THEN
                IF v_by_month_day IS NOT NULL THEN
                    v_matches := v_month = ANY(v_by_month) AND v_day = ANY(v_by_month_day) AND
                                (EXTRACT(YEAR FROM p_date) - EXTRACT(YEAR FROM v_start_time)) % v_interval = 0;
                ELSE
                    v_matches := v_month = ANY(v_by_month) AND EXTRACT(DAY FROM p_date) = EXTRACT(DAY FROM v_start_time) AND
                                (EXTRACT(YEAR FROM p_date) - EXTRACT(YEAR FROM v_start_time)) % v_interval = 0;
                END IF;
            ELSE
                -- If no specific months are specified, check if it's the same month and day and the years between are divisible by the interval
                v_matches := EXTRACT(MONTH FROM p_date) = EXTRACT(MONTH FROM v_start_time) AND
                            EXTRACT(DAY FROM p_date) = EXTRACT(DAY FROM v_start_time) AND
                            (EXTRACT(YEAR FROM p_date) - EXTRACT(YEAR FROM v_start_time)) % v_interval = 0;
            END IF;
    END CASE;
    
    RETURN v_matches;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get the next occurrence of a recurring event
CREATE OR REPLACE FUNCTION get_next_occurrence(
    p_recurrence_id UUID,
    p_after TIMESTAMP WITH TIME ZONE
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    v_frequency TEXT;
    v_interval INTEGER;
    v_by_day TEXT[];
    v_by_month_day INTEGER[];
    v_by_month INTEGER[];
    v_until TIMESTAMP WITH TIME ZONE;
    v_event_id UUID;
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_next_date TIMESTAMP WITH TIME ZONE;
    v_current_date TIMESTAMP WITH TIME ZONE;
    v_max_iterations INTEGER := 100; -- Prevent infinite loops
    v_iterations INTEGER := 0;
BEGIN
    -- Get recurrence rule details
    SELECT 
        frequency, interval, by_day, by_month_day, by_month, until, event_id
    INTO 
        v_frequency, v_interval, v_by_day, v_by_month_day, v_by_month, v_until, v_event_id
    FROM 
        recurrence_rules
    WHERE 
        id = p_recurrence_id;
    
    IF v_frequency IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get the start time of the original event
    SELECT start_time INTO v_start_time
    FROM calendar_events
    WHERE id = v_event_id;
    
    -- Start from the 'after' date
    v_current_date := p_after;
    
    -- Increment the date until we find the next occurrence
    WHILE v_iterations < v_max_iterations LOOP
        v_iterations := v_iterations + 1;
        
        -- Increment based on frequency
        CASE v_frequency
            WHEN 'DAILY' THEN
                v_current_date := v_current_date + (v_interval || ' days')::INTERVAL;
            WHEN 'WEEKLY' THEN
                v_current_date := v_current_date + (v_interval || ' weeks')::INTERVAL;
            WHEN 'MONTHLY' THEN
                v_current_date := v_current_date + (v_interval || ' months')::INTERVAL;
            WHEN 'YEARLY' THEN
                v_current_date := v_current_date + (v_interval || ' years')::INTERVAL;
        END CASE;
        
        -- Check if the current date is within the recurrence pattern
        IF is_date_in_recurrence(v_current_date, p_recurrence_id) THEN
            -- Check if we've passed the until date
            IF v_until IS NOT NULL AND v_current_date > v_until THEN
                RETURN NULL;
            END IF;
            
            RETURN v_current_date;
        END IF;
    END LOOP;
    
    -- If we've reached the maximum iterations without finding a match, return NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to expand a recurring event into individual instances
CREATE OR REPLACE FUNCTION expand_recurring_event(
    p_event_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
    id UUID,
    title TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    description TEXT,
    event_type TEXT,
    availability_type TEXT,
    is_active BOOLEAN,
    clinician_id UUID,
    time_zone TEXT,
    all_day BOOLEAN,
    recurrence_id UUID,
    is_recurring_instance BOOLEAN
) AS $$
DECLARE
    v_base_event RECORD;
    v_recurrence_id UUID;
    v_rrule TEXT;
    v_frequency TEXT;
    v_interval INTEGER;
    v_by_day TEXT[];
    v_by_month_day INTEGER[];
    v_by_month INTEGER[];
    v_count INTEGER;
    v_until TIMESTAMP WITH TIME ZONE;
    v_current_date TIMESTAMP WITH TIME ZONE;
    v_event_duration INTERVAL;
    v_instance_count INTEGER := 0;
    v_max_instances INTEGER := 100; -- Prevent too many instances
BEGIN
    -- Get the base event
    SELECT * INTO v_base_event
    FROM calendar_events
    WHERE id = p_event_id;
    
    IF v_base_event IS NULL THEN
        RETURN;
    END IF;
    
    -- Get the recurrence rule
    SELECT id, rrule, frequency, interval, by_day, by_month_day, by_month, count, until
    INTO v_recurrence_id, v_rrule, v_frequency, v_interval, v_by_day, v_by_month_day, v_by_month, v_count, v_until
    FROM recurrence_rules
    WHERE event_id = p_event_id;
    
    IF v_recurrence_id IS NULL THEN
        -- Not a recurring event, return the base event if it falls within the date range
        IF v_base_event.start_time >= p_start_date AND v_base_event.start_time <= p_end_date THEN
            RETURN QUERY SELECT
                v_base_event.id,
                v_base_event.title,
                v_base_event.start_time,
                v_base_event.end_time,
                v_base_event.description,
                v_base_event.event_type,
                v_base_event.availability_type,
                v_base_event.is_active,
                v_base_event.clinician_id,
                v_base_event.time_zone,
                v_base_event.all_day,
                v_base_event.recurrence_id,
                FALSE::BOOLEAN;
        END IF;
        RETURN;
    END IF;
    
    -- Calculate the event duration
    v_event_duration := v_base_event.end_time - v_base_event.start_time;
    
    -- Start from the base event's start time
    v_current_date := v_base_event.start_time;
    
    -- If the start date is after the base event's start time, start from there
    IF p_start_date > v_current_date THEN
        v_current_date := p_start_date;
    END IF;
    
    -- Generate instances until we reach the end date or the until date
    WHILE v_current_date <= p_end_date AND v_instance_count < v_max_instances LOOP
        -- Check if the current date is within the recurrence pattern
        IF is_date_in_recurrence(v_current_date, v_recurrence_id) THEN
            -- Check if we've passed the until date
            IF v_until IS NOT NULL AND v_current_date > v_until THEN
                EXIT;
            END IF;
            
            -- Return this instance
            RETURN QUERY SELECT
                v_base_event.id || '_' || v_instance_count::TEXT::UUID,
                v_base_event.title,
                v_current_date,
                v_current_date + v_event_duration,
                v_base_event.description,
                v_base_event.event_type,
                v_base_event.availability_type,
                v_base_event.is_active,
                v_base_event.clinician_id,
                v_base_event.time_zone,
                v_base_event.all_day,
                v_base_event.recurrence_id,
                TRUE::BOOLEAN;
                
            v_instance_count := v_instance_count + 1;
        END IF;
        
        -- Move to the next day
        v_current_date := v_current_date + '1 day'::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check for overlapping availability
CREATE OR REPLACE FUNCTION check_overlapping_availability() 
RETURNS TRIGGER AS $$
DECLARE
    v_overlapping_count INTEGER;
    v_recurrence_id UUID;
    v_recurrence_rule TEXT;
BEGIN
    -- Only check for availability events
    IF NEW.event_type != 'availability' THEN
        RETURN NEW;
    END IF;
    
    -- Check for direct overlaps with existing events
    SELECT COUNT(*) INTO v_overlapping_count
    FROM calendar_events
    WHERE 
        clinician_id = NEW.clinician_id AND
        event_type = 'availability' AND
        id != NEW.id AND
        is_active = TRUE AND
        (
            (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
        );
        
    IF v_overlapping_count > 0 THEN
        RAISE EXCEPTION 'This availability slot overlaps with existing availability slots';
    END IF;
    
    -- If this is a recurring event, check for overlaps with other recurring events
    IF NEW.recurrence_id IS NOT NULL THEN
        -- Get the recurrence rule
        SELECT rrule INTO v_recurrence_rule
        FROM recurrence_rules
        WHERE id = NEW.recurrence_id;
        
        -- Check for overlaps with other recurring events
        -- This is a simplified check that looks for events on the same day of week
        -- A more comprehensive check would require expanding the recurrence patterns
        IF v_recurrence_rule LIKE '%FREQ=WEEKLY%' THEN
            -- Extract the day of week from the recurrence rule
            DECLARE
                v_day_of_week TEXT;
                v_day_code TEXT;
            BEGIN
                v_day_of_week := EXTRACT(DOW FROM NEW.start_time);
                
                -- Convert to day code (0=SU, 1=MO, etc.)
                CASE v_day_of_week::INTEGER
                    WHEN 0 THEN v_day_code := 'SU';
                    WHEN 1 THEN v_day_code := 'MO';
                    WHEN 2 THEN v_day_code := 'TU';
                    WHEN 3 THEN v_day_code := 'WE';
                    WHEN 4 THEN v_day_code := 'TH';
                    WHEN 5 THEN v_day_code := 'FR';
                    WHEN 6 THEN v_day_code := 'SA';
                END CASE;
                
                -- Check for other weekly recurring events on the same day
                SELECT COUNT(*) INTO v_overlapping_count
                FROM calendar_events e
                JOIN recurrence_rules r ON e.recurrence_id = r.id
                WHERE 
                    e.clinician_id = NEW.clinician_id AND
                    e.event_type = 'availability' AND
                    e.id != NEW.id AND
                    e.is_active = TRUE AND
                    r.rrule LIKE '%FREQ=WEEKLY%' AND
                    r.rrule LIKE '%BYDAY=' || v_day_code || '%' AND
                    (
                        (e.start_time::time, e.end_time::time) OVERLAPS (NEW.start_time::time, NEW.end_time::time)
                    );
                    
                IF v_overlapping_count > 0 THEN
                    RAISE EXCEPTION 'This recurring availability slot overlaps with existing recurring availability slots';
                END IF;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for the overlapping availability check
DROP TRIGGER IF EXISTS check_overlapping_availability_trigger ON calendar_events;
CREATE TRIGGER check_overlapping_availability_trigger
BEFORE INSERT OR UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION check_overlapping_availability();

-- Add a comment explaining the migration
COMMENT ON FUNCTION parse_rrule() IS 'Parses an RRule string and populates the structured columns in the recurrence_rules table';
COMMENT ON FUNCTION is_date_in_recurrence() IS 'Checks if a date falls within a recurrence pattern';
COMMENT ON FUNCTION get_next_occurrence() IS 'Gets the next occurrence of a recurring event after a specified date';
COMMENT ON FUNCTION expand_recurring_event() IS 'Expands a recurring event into individual instances within a date range';
COMMENT ON FUNCTION check_overlapping_availability() IS 'Checks for overlapping availability slots, including recurring slots';