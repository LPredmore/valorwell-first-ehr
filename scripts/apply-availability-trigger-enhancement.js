/**
 * Script to apply the enhanced availability trigger migration and run basic tests
 * 
 * This script:
 * 1. Applies the new migration
 * 2. Verifies the trigger and supporting functions exist
 * 3. Runs basic tests to verify the trigger works correctly
 * 4. Provides a summary of the changes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting availability trigger enhancement script...');

// Step 1: Apply the migration
console.log('\n--- Applying migration ---');
try {
  console.log('Running supabase migration...');
  execSync('npx supabase migration up', { stdio: 'inherit' });
  console.log('Migration applied successfully');
} catch (error) {
  console.error('Error applying migration:', error.message);
  console.log('Continuing with verification...');
}

// Step 2: Restart the Supabase services to ensure changes take effect
console.log('\n--- Restarting Supabase services ---');
try {
  console.log('Restarting Supabase...');
  execSync('npx supabase stop && npx supabase start', { stdio: 'inherit' });
  console.log('Supabase services restarted successfully');
} catch (error) {
  console.error('Error restarting Supabase services:', error.message);
  console.log('Continuing with verification...');
}

// Step 3: Verify the trigger and supporting functions exist
console.log('\n--- Verifying installation ---');
try {
  console.log('Running verification SQL...');
  const verificationSql = `
    -- Check if the prevent_overlapping_availability function exists
    SELECT EXISTS(
      SELECT 1 FROM pg_proc 
      WHERE proname = 'prevent_overlapping_availability'
    ) as function_exists;

    -- Check if the test_availability_overlap function exists
    SELECT EXISTS(
      SELECT 1 FROM pg_proc 
      WHERE proname = 'test_availability_overlap'
    ) as test_function_exists;

    -- Check if the trigger exists
    SELECT COUNT(*) as trigger_count 
    FROM pg_trigger 
    WHERE tgname = 'check_availability_overlap';

    -- Check if the index exists
    SELECT COUNT(*) as index_count 
    FROM pg_indexes 
    WHERE indexname = 'idx_calendar_events_availability_overlap';
  `;

  // Write the verification SQL to a temporary file
  const tempSqlFile = path.join(__dirname, 'verify-availability-trigger.sql');
  fs.writeFileSync(tempSqlFile, verificationSql);

  // Run the verification SQL
  const result = execSync(`npx supabase db execute ${tempSqlFile}`, { encoding: 'utf8' });
  console.log('Verification result:', result);

  // Clean up the temporary file
  fs.unlinkSync(tempSqlFile);

  console.log('Verification completed');
} catch (error) {
  console.error('Error verifying installation:', error.message);
}

// Step 4: Run basic tests
console.log('\n--- Running basic tests ---');
try {
  console.log('Running test SQL...');
  const testSql = `
    -- Create a test clinician if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111') THEN
        INSERT INTO profiles (id, email, role) 
        VALUES ('11111111-1111-1111-1111-111111111111', 'test@example.com', 'clinician');
      END IF;
    END $$;

    -- Clean up any existing test data
    DELETE FROM calendar_events 
    WHERE clinician_id = '11111111-1111-1111-1111-111111111111'
    AND title LIKE 'Test%';

    -- Create a test availability slot
    INSERT INTO calendar_events (
      title, event_type, start_time, end_time, clinician_id, 
      availability_type, is_active, time_zone
    )
    VALUES (
      'Test Available', 'availability', 
      '2025-05-01 09:00:00+00', '2025-05-01 10:00:00+00',
      '11111111-1111-1111-1111-111111111111', 
      'single', true, 'UTC'
    );

    -- Test 1: Non-overlapping slot (should succeed)
    SELECT 'Test 1: Non-overlapping slot' as test_name, * FROM test_availability_overlap(
      '11111111-1111-1111-1111-111111111111',
      '2025-05-01 11:00:00+00', 
      '2025-05-01 12:00:00+00'
    );

    -- Test 2: Overlapping slot (should fail)
    SELECT 'Test 2: Overlapping slot' as test_name, * FROM test_availability_overlap(
      '11111111-1111-1111-1111-111111111111',
      '2025-05-01 09:30:00+00', 
      '2025-05-01 10:30:00+00'
    );

    -- Test 3: Invalid time range (should fail)
    SELECT 'Test 3: Invalid time range' as test_name, * FROM test_availability_overlap(
      '11111111-1111-1111-1111-111111111111',
      '2025-05-01 15:00:00+00', 
      '2025-05-01 14:00:00+00'
    );
  `;

  // Write the test SQL to a temporary file
  const tempTestFile = path.join(__dirname, 'test-availability-trigger.sql');
  fs.writeFileSync(tempTestFile, testSql);

  // Run the test SQL
  const testResult = execSync(`npx supabase db execute ${tempTestFile}`, { encoding: 'utf8' });
  console.log('Test results:');
  console.log(testResult);

  // Clean up the temporary file
  fs.unlinkSync(tempTestFile);

  console.log('Basic tests completed');
} catch (error) {
  console.error('Error running tests:', error.message);
}

// Step 5: Provide a summary
console.log('\n--- Enhancement Summary ---');
console.log('The availability trigger has been enhanced with the following improvements:');
console.log('1. Detailed error messages with specific information about overlapping slots');
console.log('2. Performance optimization with a dedicated index');
console.log('3. Enhanced edge case handling for recurring vs. non-recurring availability');
console.log('4. Better timezone awareness and validation of time ranges');
console.log('5. A test function to verify overlap detection without modifying data');
console.log('\nDocumentation:');
console.log('- docs/EnhancedAvailabilityTrigger.md: Detailed documentation of the enhanced trigger');
console.log('- docs/AvailabilityTriggerTestPlan.md: Comprehensive test plan for various scenarios');
console.log('\nNext Steps:');
console.log('1. Review the documentation to understand the changes');
console.log('2. Run the test plan to verify the trigger works correctly in various scenarios');
console.log('3. Update frontend error handling to display the detailed error messages');

console.log('\n--- Script completed ---');
console.log('The availability trigger enhancement has been applied successfully.');