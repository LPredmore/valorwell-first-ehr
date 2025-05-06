# Database Schema Alignment with UTC-Only Model

## Problem Statement

We're experiencing a runtime error: "null value in column "date" of relation "appointments" violates not-null constraint" despite having updated our application code to use a UTC-only data model.

## Root Cause Analysis

After examining the codebase, I've identified the root cause:

1. **Database Schema**:
   - The appointments table has both legacy columns (`date`, `start_time`, `end_time`) with NOT NULL constraints
   - The table also has the new UTC-based columns (`start_at`, `end_at`)

2. **Application Code**:
   - The application has been successfully refactored to use only `start_at` and `end_at` as the source of truth for appointment timing
   - This is evident in:
     - The Appointment interface in `src/types/appointment.ts`
     - The appointment creation logic in `src/components/calendar/AppointmentDialog.tsx`
     - The appointment booking logic in `src/components/patient/AppointmentBookingDialog.tsx`
     - The appointment fetching logic in `src/hooks/useAppointments.tsx`

3. **Error Cause**:
   - The application is correctly sending only UTC timestamps (`start_at` and `end_at`)
   - However, the database still requires values for the legacy columns due to NOT NULL constraints
   - This mismatch is causing the runtime error

## Solution: Option A - Drop Legacy Columns Entirely

Since the application code has been fully refactored to use only UTC timestamps, we'll implement Option A - dropping the legacy columns entirely. This is the cleanest approach because:

1. The application code has been fully refactored to use only UTC timestamps
2. Keeping unused columns with NULL values would add unnecessary complexity
3. A clean schema will prevent future confusion and potential bugs

## SQL Script to Execute

```sql
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
```

## Verification of Appointment Creation Logic

I've confirmed that all appointment creation components are already aligned with the UTC-only model:

1. **Calendar AppointmentDialog.tsx**:
   - Creates appointments using only `start_at` and `end_at`
   - Properly converts local date/time to UTC ISO strings

2. **Patient AppointmentBookingDialog.tsx**:
   - Creates appointments using only `start_at` and `end_at`
   - Properly handles timezone conversions

3. **useAppointments.tsx**:
   - Queries appointments using only `start_at` and `end_at`
   - Properly handles timezone conversions for display

No additional code changes are needed in the application.

## Implementation Steps

1. Execute the SQL script to modify the database schema
2. Test appointment creation to verify the error is resolved
3. Verify that existing appointments can still be retrieved and displayed correctly

## Testing Plan

1. **Create New Appointments**:
   - Test creating a single appointment
   - Test creating recurring appointments
   - Verify no constraint violations occur

2. **View Existing Appointments**:
   - Verify that appointments created before the schema change can still be viewed
   - Verify that the calendar displays correctly

3. **Edge Cases**:
   - Test appointment creation across timezone boundaries
   - Test appointment creation with different user timezones

## Risks and Mitigations

1. **Risk**: Existing appointments might rely on the legacy columns for some functionality
   **Mitigation**: The code review confirms all appointment logic uses `start_at` and `end_at`

2. **Risk**: Third-party integrations might expect the legacy columns
   **Mitigation**: Review any external integrations before proceeding

3. **Risk**: Data migration issues for existing appointments
   **Mitigation**: Consider running a data validation query after the schema change

## Next Steps

1. Switch to Code mode to implement the SQL script
2. Execute the script in the Supabase database
3. Test appointment creation to verify the error is resolved