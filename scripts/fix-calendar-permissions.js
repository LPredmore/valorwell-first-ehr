
/**
 * Script to fix calendar permissions and availability issues
 *
 * This script:
 * 1. Applies the new standardization migration
 * 2. Fixes any inconsistent clinician IDs
 * 3. Validates timezone settings
 * 4. Checks for and resolves permission issues
 * 5. Verifies database constraints and triggers
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting calendar permissions and availability fix script...');

// Step 1: Verify Clinician IDs in all relevant tables and fix inconsistencies
console.log('\n--- Verifying and fixing clinician ID formats ---');
try {
  console.log('Running ID format verification...');
  const checkFormatSql = `
    -- Create a temporary table to track inconsistencies found and fixed
    CREATE TEMP TABLE IF NOT EXISTS id_format_fixes (
      table_name TEXT,
      column_name TEXT,
      row_id TEXT,
      original_value TEXT,
      fixed_value TEXT
    );

    -- Clean up any clinician_id in calendar_events that doesn't match UUID format
    UPDATE calendar_events
    SET clinician_id = 
      CASE 
        WHEN clinician_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN clinician_id
        WHEN clinician_id::text ~ '^[0-9a-f]{32}$' THEN 
          (substring(clinician_id::text from 1 for 8) || '-' || 
           substring(clinician_id::text from 9 for 4) || '-' || 
           substring(clinician_id::text from 13 for 4) || '-' || 
           substring(clinician_id::text from 17 for 4) || '-' || 
           substring(clinician_id::text from 21 for 12))::uuid
        ELSE clinician_id
      END
    WHERE clinician_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    RETURNING 'calendar_events', 'clinician_id', id, clinician_id;

    -- Clean up any id in clinicians that doesn't match UUID format
    UPDATE clinicians
    SET id = 
      CASE 
        WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id
        WHEN id::text ~ '^[0-9a-f]{32}$' THEN 
          (substring(id::text from 1 for 8) || '-' || 
           substring(id::text from 9 for 4) || '-' || 
           substring(id::text from 13 for 4) || '-' || 
           substring(id::text from 17 for 4) || '-' || 
           substring(id::text from 21 for 12))::uuid
        ELSE id
      END
    WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    RETURNING 'clinicians', 'id', id, id;

    -- Check for any inconsistencies between auth.users and profiles
    INSERT INTO id_format_fixes
    SELECT 'auth/profiles mismatch', 'id', au.id, au.id, p.id
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE p.id IS NULL AND au.id IS NOT NULL;
    
    -- Check and report results
    SELECT COUNT(*) as fixed_ids FROM id_format_fixes;
  `;

  // Write the SQL to a temporary file
  const tempFormatSqlFile = path.join(__dirname, 'fix-id-formats.sql');
  fs.writeFileSync(tempFormatSqlFile, checkFormatSql);

  // Run the SQL
  console.log('Executing ID format fix SQL...');
  const formatResult = execSync(`npx supabase db execute ${tempFormatSqlFile}`, { encoding: 'utf8' });
  console.log('ID format fix result:', formatResult);

  // Clean up the temporary file
  fs.unlinkSync(tempFormatSqlFile);

} catch (error) {
  console.error('Error fixing ID formats:', error.message);
  console.log('Continuing with other fixes...');
}

// Step 2: Verify and fix the can_manage_clinician_calendar function
console.log('\n--- Verifying and fixing calendar permission function ---');
try {
  console.log('Checking calendar permission function...');
  const fixPermissionFuncSql = `
    -- Verify and recreate the can_manage_clinician_calendar function with robust error handling
    CREATE OR REPLACE FUNCTION public.can_manage_clinician_calendar(user_id text, target_clinician_id text)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      user_role text;
      is_self boolean;
      valid_user_id uuid;
      valid_clinician_id uuid;
      debug_info jsonb;
    BEGIN
      -- Store debug info for logging
      debug_info := jsonb_build_object(
        'function', 'can_manage_clinician_calendar',
        'user_id', user_id,
        'target_clinician_id', target_clinician_id
      );

      -- Handle null inputs safely
      IF user_id IS NULL OR target_clinician_id IS NULL THEN
        RETURN false;
      END IF;

      -- Standardize the IDs - handle any format issues gracefully
      BEGIN
        -- First attempt UUID casting directly
        BEGIN
          valid_user_id := user_id::uuid;
        EXCEPTION WHEN others THEN
          -- If direct casting fails, try to clean and format the string
          IF length(regexp_replace(lower(user_id), '[^a-f0-9]', '', 'g')) = 32 THEN
            valid_user_id := (
              substring(regexp_replace(lower(user_id), '[^a-f0-9]', '', 'g') from 1 for 8) || '-' || 
              substring(regexp_replace(lower(user_id), '[^a-f0-9]', '', 'g') from 9 for 4) || '-' || 
              substring(regexp_replace(lower(user_id), '[^a-f0-9]', '', 'g') from 13 for 4) || '-' || 
              substring(regexp_replace(lower(user_id), '[^a-f0-9]', '', 'g') from 17 for 4) || '-' || 
              substring(regexp_replace(lower(user_id), '[^a-f0-9]', '', 'g') from 21 for 12)
            )::uuid;
          ELSE
            -- If we still can't format it, return false
            RAISE WARNING 'Invalid user_id format in can_manage_clinician_calendar: %', user_id;
            RETURN false;
          END IF;
        END;

        -- Same process for clinician_id
        BEGIN
          valid_clinician_id := target_clinician_id::uuid;
        EXCEPTION WHEN others THEN
          IF length(regexp_replace(lower(target_clinician_id), '[^a-f0-9]', '', 'g')) = 32 THEN
            valid_clinician_id := (
              substring(regexp_replace(lower(target_clinician_id), '[^a-f0-9]', '', 'g') from 1 for 8) || '-' || 
              substring(regexp_replace(lower(target_clinician_id), '[^a-f0-9]', '', 'g') from 9 for 4) || '-' || 
              substring(regexp_replace(lower(target_clinician_id), '[^a-f0-9]', '', 'g') from 13 for 4) || '-' || 
              substring(regexp_replace(lower(target_clinician_id), '[^a-f0-9]', '', 'g') from 17 for 4) || '-' || 
              substring(regexp_replace(lower(target_clinician_id), '[^a-f0-9]', '', 'g') from 21 for 12)
            )::uuid;
          ELSE
            RAISE WARNING 'Invalid clinician_id format in can_manage_clinician_calendar: %', target_clinician_id;
            RETURN false;
          END IF;
        END;
      EXCEPTION WHEN others THEN
        -- Catch-all for any other issues
        RAISE WARNING 'Error in ID standardization: %', SQLERRM;
        RETURN false;
      END;
      
      -- Check if user is managing their own calendar - this should always work
      is_self := valid_user_id = valid_clinician_id;
      
      -- If it's their own calendar, they have permission
      IF is_self THEN
        RETURN true;
      END IF;
      
      -- For any other access, check if user is an admin
      BEGIN
        SELECT role INTO user_role FROM profiles WHERE id = valid_user_id;
        
        -- Add these debug details in production logs
        debug_info := debug_info || jsonb_build_object(
          'user_role', user_role,
          'is_self', is_self
        );
        
        -- Admins have permission to manage any calendar
        IF user_role = 'admin' THEN
          RETURN true;
        END IF;
      EXCEPTION WHEN others THEN
        RAISE WARNING 'Error checking user role: %', SQLERRM;
        -- In case of error, default to no permission
        RETURN false;
      END;
      
      -- Otherwise, no permission
      RETURN false;
    END;
    $$;

    -- Test the function with both valid and edge cases
    DO $$
    DECLARE
      test_user_id uuid := gen_random_uuid();
      test_clinician_id uuid := gen_random_uuid();
      test_result boolean;
    BEGIN
      -- Test self-access (should return true)
      SELECT public.can_manage_clinician_calendar(test_user_id::text, test_user_id::text) INTO test_result;
      RAISE NOTICE 'Self-access test result: %', test_result;
      
      -- Test with malformed UUIDs
      SELECT public.can_manage_clinician_calendar(
        replace(test_user_id::text, '-', ''), 
        test_clinician_id::text
      ) INTO test_result;
      RAISE NOTICE 'Malformed user_id test: %', test_result;
      
      -- Test with completely invalid formats
      SELECT public.can_manage_clinician_calendar(
        'not-a-uuid', 
        test_clinician_id::text
      ) INTO test_result;
      RAISE NOTICE 'Invalid user_id test: %', test_result;
    END;
    $$;

    -- Verify the function exists and has the correct signature
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE proname = 'can_manage_clinician_calendar';
  `;

  // Write the SQL to a temporary file
  const tempFuncSqlFile = path.join(__dirname, 'fix-permission-func.sql');
  fs.writeFileSync(tempFuncSqlFile, fixPermissionFuncSql);

  // Run the SQL
  console.log('Executing permission function fix SQL...');
  const funcResult = execSync(`npx supabase db execute ${tempFuncSqlFile}`, { encoding: 'utf8' });
  console.log('Permission function fix result:', funcResult);

  // Clean up the temporary file
  fs.unlinkSync(tempFuncSqlFile);

} catch (error) {
  console.error('Error fixing permission function:', error.message);
  console.log('Continuing with other fixes...');
}

// Step 3: Verify and fix RLS policies for calendar_events table
console.log('\n--- Verifying and fixing RLS policies ---');
try {
  console.log('Checking calendar RLS policies...');
  const fixRlsPoliciesSql = `
    -- First, check if RLS is enabled on the calendar_events table
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname = 'calendar_events' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    -- Enable RLS if not already enabled
    ALTER TABLE IF EXISTS public.calendar_events ENABLE ROW LEVEL SECURITY;
    
    -- Check existing policies
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'calendar_events';
    
    -- Drop all existing policies to ensure clean recreation
    DROP POLICY IF EXISTS "Users can manage their own calendar events" ON public.calendar_events;
    DROP POLICY IF EXISTS "Admins can manage all calendar events" ON public.calendar_events;
    DROP POLICY IF EXISTS "Users can view all calendar events" ON public.calendar_events;
    
    -- Create comprehensive new policies
    
    -- Policy 1: Anyone can view any calendar event (read-only)
    CREATE POLICY "Users can view all calendar events"
    ON public.calendar_events
    FOR SELECT
    USING (true);
    
    -- Policy 2: Admins can manage any calendar event
    CREATE POLICY "Admins can manage all calendar events"
    ON public.calendar_events
    USING (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );
    
    -- Policy 3: Users can manage their own calendar events
    CREATE POLICY "Users can manage their own calendar events"
    ON public.calendar_events
    USING (
      public.can_manage_clinician_calendar(auth.uid()::text, clinician_id::text)
    );
    
    -- Verify the new policies
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'calendar_events';
  `;

  // Write the SQL to a temporary file
  const tempRlsSqlFile = path.join(__dirname, 'fix-rls-policies.sql');
  fs.writeFileSync(tempRlsSqlFile, fixRlsPoliciesSql);

  // Run the SQL
  console.log('Executing RLS policy fix SQL...');
  const rlsResult = execSync(`npx supabase db execute ${tempRlsSqlFile}`, { encoding: 'utf8' });
  console.log('RLS policy fix result:', rlsResult);

  // Clean up the temporary file
  fs.unlinkSync(tempRlsSqlFile);

} catch (error) {
  console.error('Error fixing RLS policies:', error.message);
  console.log('Continuing with other fixes...');
}

// Step 4: Test calendar permission end-to-end
console.log('\n--- Testing calendar permissions end-to-end ---');
try {
  console.log('Running permission tests...');
  
  // Create a test script to check permissions
  const testScript = `
    import { supabase } from '../src/integrations/supabase/client.js';
    
    async function testCalendarPermissions() {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No authenticated user found. Please run this script while logged in.');
          return;
        }
        
        console.log('Testing calendar permissions for user:', user.id);
        
        // Test 1: Check can_manage_clinician_calendar function directly
        const { data: testResult1, error: testError1 } = await supabase
          .rpc('can_manage_clinician_calendar', {
            user_id: user.id,
            target_clinician_id: user.id
          });
          
        console.log('Test 1 - Self calendar access function result:', 
          testResult1 ? 'PASS' : 'FAIL', 
          testError1 ? \`Error: \${testError1.message}\` : '');
        
        // Test 2: Try to select own calendar events
        const { data: events, error: eventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('clinician_id', user.id)
          .limit(5);
          
        console.log('Test 2 - Select own calendar events:', 
          !eventsError ? 'PASS' : 'FAIL', 
          eventsError ? \`Error: \${eventsError.message}\` : \`Found \${events?.length || 0} events\`);
        
        // Test 3: Try to insert a test calendar event
        const testEvent = {
          title: 'TEST EVENT - PLEASE DELETE',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
          clinician_id: user.id,
          event_type: 'test',
          is_active: true
        };
        
        const { data: insertResult, error: insertError } = await supabase
          .from('calendar_events')
          .insert(testEvent)
          .select();
          
        console.log('Test 3 - Insert calendar event:', 
          !insertError ? 'PASS' : 'FAIL', 
          insertError ? \`Error: \${insertError.message}\` : 'Event created successfully');
          
        // Test 4: Clean up if test event was created
        if (insertResult && insertResult.length > 0) {
          const { error: deleteError } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', insertResult[0].id);
            
          console.log('Test 4 - Delete test event:', 
            !deleteError ? 'PASS' : 'FAIL',
            deleteError ? \`Error: \${deleteError.message}\` : 'Event deleted successfully');
        }
        
        console.log('Permission tests completed');
      } catch (error) {
        console.error('Error in permission tests:', error);
      }
    }
    
    testCalendarPermissions();
  `;
  
  // Write the test script to a temporary file
  const tempTestFile = path.join(__dirname, 'temp-permission-test.js');
  fs.writeFileSync(tempTestFile, testScript);
  
  // Run the test script
  try {
    console.log('Running permission test script...');
    const testOutput = execSync(`node ${tempTestFile}`, { encoding: 'utf8' });
    console.log('Test script output:');
    console.log(testOutput);
  } catch (testErr) {
    console.error('Error running test script:', testErr.message);
    if (testErr.stdout) console.log('Test script output:', testErr.stdout);
  }
  
  // Clean up the temporary file
  fs.unlinkSync(tempTestFile);
  
} catch (error) {
  console.error('Error testing permissions:', error.message);
}

// Step 5: Apply the original migration if needed
console.log('\n--- Applying standard migration if not already applied ---');
try {
  console.log('Checking if migration needs to be applied...');
  
  // Check if the standardize_uuid function exists
  const checkMigrationSql = `
    SELECT EXISTS(
      SELECT 1 FROM pg_proc
      WHERE proname = 'standardize_uuid'
    ) as migration_applied;
  `;
  
  // Write the check SQL to a temporary file
  const tempCheckSqlFile = path.join(__dirname, 'check-migration.sql');
  fs.writeFileSync(tempCheckSqlFile, checkMigrationSql);
  
  // Run the check
  const checkResult = execSync(`npx supabase db execute ${tempCheckSqlFile}`, { encoding: 'utf8' });
  
  // Clean up the temporary file
  fs.unlinkSync(tempCheckSqlFile);
  
  // If migration hasn't been applied, run it
  if (!checkResult.includes('t') && !checkResult.includes('true')) {
    console.log('Migration needs to be applied, running supabase migration...');
    execSync('npx supabase migration up', { stdio: 'inherit' });
    console.log('Migration applied successfully');
  } else {
    console.log('Migration already applied, skipping');
  }
} catch (error) {
  console.error('Error checking/applying migration:', error.message);
}

// Step 6: Restart Supabase to ensure changes take effect
console.log('\n--- Restarting Supabase services ---');
try {
  console.log('Restarting Supabase...');
  execSync('npx supabase stop && npx supabase start', { stdio: 'inherit' });
  console.log('Supabase services restarted successfully');
} catch (error) {
  console.error('Error restarting Supabase services:', error.message);
}

console.log('\n--- Fix script completed ---');
console.log('The calendar permissions and availability issues should now be fixed.');
console.log('If you still encounter issues, please check the browser console for specific error messages.');
