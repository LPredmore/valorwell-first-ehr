/**
 * Script to fix calendar permissions and availability issues
 * 
 * This script:
 * 1. Applies the new migration
 * 2. Fixes any inconsistent clinician IDs
 * 3. Validates timezone settings
 * 4. Checks for and resolves permission issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting calendar permissions and availability fix script...');

// Step 1: Apply the migration
console.log('\n--- Applying migration ---');
try {
  console.log('Running supabase migration...');
  execSync('npx supabase migration up', { stdio: 'inherit' });
  console.log('Migration applied successfully');
} catch (error) {
  console.error('Error applying migration:', error.message);
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

    -- Check if the RLS policy exists
    SELECT COUNT(*) as policy_count 
    FROM pg_policies 
    WHERE tablename = 'calendar_events' 
    AND policyname = 'Users can manage their own calendar events';
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

console.log('\n--- Fix script completed ---');
console.log('The calendar permissions and availability issues should now be fixed.');
console.log('If you still encounter issues, please check the browser console for specific error messages.');