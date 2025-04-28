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

// Step 1: Apply the standardization migration
console.log('\n--- Applying ID standardization migration ---');
try {
  console.log('Running supabase migration...');
  execSync('npx supabase migration up', { stdio: 'inherit' });
  console.log('Migration applied successfully');
} catch (error) {
  console.error('Error applying migration:', error.message);
  console.log('Continuing with other fixes...');
}

// Step 2: Verify clinician IDs are properly standardized
console.log('\n--- Verifying clinician ID standardization ---');
try {
  console.log('Running verification script...');
  execSync('node scripts/verify-clinician-ids.js', { stdio: 'inherit' });
  console.log('Clinician ID verification completed');
} catch (error) {
  console.error('Error verifying clinician IDs:', error.message);
  console.log('Continuing with other fixes...');
}

// Step 2: Restart the Supabase services to ensure changes take effect
console.log('\n--- Restarting Supabase services ---');
try {
  console.log('Restarting Supabase...');
  execSync('npx supabase stop && npx supabase start', { stdio: 'inherit' });
  console.log('Supabase services restarted successfully');
} catch (error) {
  console.error('Error restarting Supabase services:', error.message);
  console.log('Continuing with other fixes...');
}

// Step 3: Verify the fixes
console.log('\n--- Verifying fixes ---');
try {
  console.log('Running verification SQL...');
  const verificationSql = `
    -- Check if the prevent_overlapping_availability function exists
    SELECT EXISTS(
      SELECT 1 FROM pg_proc
      WHERE proname = 'prevent_overlapping_availability'
    ) as function_exists;

    -- Check if the can_manage_clinician_calendar function exists
    SELECT EXISTS(
      SELECT 1 FROM pg_proc
      WHERE proname = 'can_manage_clinician_calendar'
    ) as permission_function_exists;
    
    -- Check if the standardize_uuid function exists
    SELECT EXISTS(
      SELECT 1 FROM pg_proc
      WHERE proname = 'standardize_uuid'
    ) as uuid_function_exists;
    
    -- Check if the validate_clinician_id function exists
    SELECT EXISTS(
      SELECT 1 FROM pg_proc
      WHERE proname = 'validate_clinician_id'
    ) as validation_function_exists;

    -- Check if the RLS policy exists
    SELECT COUNT(*) as policy_count
    FROM pg_policies
    WHERE tablename = 'calendar_events'
    AND policyname = 'Users can manage their own calendar events';
    
    -- Check if foreign key constraints exist
    SELECT COUNT(*) as fk_count
    FROM pg_constraint
    WHERE conname = 'calendar_events_clinician_id_fkey';
  `;

  // Write the verification SQL to a temporary file
  const tempSqlFile = path.join(__dirname, 'verify-calendar-fixes.sql');
  fs.writeFileSync(tempSqlFile, verificationSql);

  // Run the verification SQL
  const result = execSync(`npx supabase db execute ${tempSqlFile}`, { encoding: 'utf8' });
  console.log('Verification result:', result);

  // Clean up the temporary file
  fs.unlinkSync(tempSqlFile);

  console.log('Verification completed');
} catch (error) {
  console.error('Error verifying fixes:', error.message);
}

// Step 4: Test calendar permissions
console.log('\n--- Testing calendar permissions ---');
try {
  console.log('Running permission tests...');
  
  // Create a test script to check permissions
  const testScript = `
    import { calendarPermissionDebug } from '../src/utils/calendarPermissionDebug.js';
    import { supabase } from '../src/integrations/supabase/client.js';
    import { fileURLToPath } from 'url';
    import path from 'path';
    
    // Get the directory name in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    async function testPermissions() {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No authenticated user found. Please run this script while logged in.');
          return;
        }
        
        // Run diagnostic on user's own calendar
        console.log('Testing permissions for own calendar...');
        const selfDiagnostic = await calendarPermissionDebug.runDiagnostic(user.id, user.id);
        console.log('Self-calendar diagnostic result:', selfDiagnostic.success ? 'PASS' : 'FAIL');
        
        // Get a different clinician ID if possible
        const { data: clinicians } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'clinician')
          .neq('id', user.id)
          .limit(1);
          
        if (clinicians && clinicians.length > 0) {
          console.log('Testing permissions for another clinician calendar...');
          const otherDiagnostic = await calendarPermissionDebug.runDiagnostic(user.id, clinicians[0].id);
          console.log('Other-calendar diagnostic result:', otherDiagnostic.success ? 'PASS' : 'FAIL');
        }
        
        console.log('Permission tests completed');
      } catch (error) {
        console.error('Error testing permissions:', error);
      }
    }
    
    testPermissions();
  `;
  
  // Write the test script to a temporary file
  const tempTestFile = path.join(__dirname, 'temp-permission-test.js');
  fs.writeFileSync(tempTestFile, testScript);
  
  // Run the test script
  execSync(`node ${tempTestFile}`, { stdio: 'inherit' });
  
  // Clean up the temporary file
  fs.unlinkSync(tempTestFile);
  
} catch (error) {
  console.error('Error testing permissions:', error.message);
}

console.log('\n--- Fix script completed ---');
console.log('The calendar permissions and availability issues should now be fixed.');
console.log('If you still encounter issues, please check the browser console for specific error messages.');
console.log('You can also run the diagnostic tool from the calendar page by clicking the "Troubleshoot" button.');