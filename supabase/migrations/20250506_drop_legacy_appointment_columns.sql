-- Migration: Drop legacy appointment columns
-- Description: Aligns database schema with UTC-only model by removing legacy date columns

-- First, drop the NOT NULL constraints (as a safety measure)
ALTER TABLE appointments
ALTER COLUMN date DROP NOT NULL,
ALTER COLUMN start_time DROP NOT NULL,
ALTER COLUMN end_time DROP NOT NULL;

-- Then, drop the legacy columns entirely
ALTER TABLE appointments
DROP COLUMN IF EXISTS date,
DROP COLUMN IF EXISTS start_time,
DROP COLUMN IF EXISTS end_time;

-- Verify that start_at and end_at are NOT NULL
-- If they aren't already, make them NOT NULL
DO $$
BEGIN
    -- Check if start_at is nullable
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND column_name = 'start_at'
        AND is_nullable = 'YES'
    ) THEN
        -- Make start_at NOT NULL
        ALTER TABLE appointments
        ALTER COLUMN start_at SET NOT NULL;
    END IF;

    -- Check if end_at is nullable
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND column_name = 'end_at'
        AND is_nullable = 'YES'
    ) THEN
        -- Make end_at NOT NULL
        ALTER TABLE appointments
        ALTER COLUMN end_at SET NOT NULL;
    END IF;
END $$;