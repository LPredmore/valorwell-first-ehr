# UTC-Only Schema Migration Guide

This guide provides instructions for implementing the database schema changes to align with the UTC-only appointment model.

## Background

We've refactored our application code to use `start_at` and `end_at` (UTC ISO strings) as the sole source of truth for appointment timing. However, the database schema still has legacy columns (`date`, `start_time`, `end_time`) with NOT NULL constraints, causing constraint violations when creating new appointments.

## Implementation Steps

### 1. Apply the Database Migration

The migration script `20250506_drop_legacy_appointment_columns.sql` will:
1. Drop the NOT NULL constraints from legacy columns
2. Drop the legacy columns entirely
3. Ensure `start_at` and `end_at` have NOT NULL constraints

To apply the migration:

```bash
# Navigate to your project directory
cd valorwell-first-ehr

# Apply the migration using Supabase CLI
supabase migration up
```

If you're using a different method to apply migrations:

```bash
# Connect to your Supabase database and run the SQL directly
psql -h your-supabase-db-host -U postgres -d postgres -f supabase/migrations/20250506_drop_legacy_appointment_columns.sql
```

### 2. Verify the Changes

After applying the migration, you can verify that the schema changes were successful:

```sql
-- Connect to your Supabase database and run:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments';
```

You should see that:
- The `date`, `start_time`, and `end_time` columns no longer exist
- The `start_at` and `end_at` columns have `is_nullable = 'NO'`

### 3. Test Appointment Creation

Run the test script to verify that appointment creation works correctly:

```bash
# Install dependencies if needed
npm install dotenv @supabase/supabase-js uuid

# Run the test script
node test-appointment-creation.js
```

The test script will:
1. Create a test appointment using only UTC timestamps
2. Verify that no constraint violations occur
3. Clean up by deleting the test appointment

### 4. Manual Testing

After applying the schema changes, manually test the application:

1. Create a new appointment through the calendar interface
2. Create a recurring appointment
3. Book an appointment as a patient
4. Verify that all appointments display correctly in the calendar

## Troubleshooting

If you encounter issues:

1. **Error: "relation 'appointments' does not exist"**
   - Ensure you're connected to the correct database

2. **Error: "column 'date' does not exist"**
   - This is expected if the migration was successful, as the column has been dropped

3. **Error: "null value in column 'start_at' violates not-null constraint"**
   - Ensure your application is correctly setting the `start_at` and `end_at` values

## Rollback Plan

If you need to rollback the changes:

```sql
-- Recreate the legacy columns
ALTER TABLE appointments
ADD COLUMN date date,
ADD COLUMN start_time time without time zone,
ADD COLUMN end_time time without time zone;

-- Populate the legacy columns from the UTC timestamps
-- This is a simplified example and may need adjustment
UPDATE appointments
SET 
  date = (start_at AT TIME ZONE 'UTC')::date,
  start_time = (start_at AT TIME ZONE 'UTC')::time,
  end_time = (end_at AT TIME ZONE 'UTC')::time;

-- Add back the NOT NULL constraints
ALTER TABLE appointments
ALTER COLUMN date SET NOT NULL,
ALTER COLUMN start_time SET NOT NULL,
ALTER COLUMN end_time SET NOT NULL;
```

## Support

If you encounter any issues with this migration, please contact the development team.