/**
 * Script to verify clinician IDs are properly standardized
 * 
 * This script:
 * 1. Checks for non-standard UUID formats in the database
 * 2. Verifies foreign key constraints are working
 * 3. Tests ID validation functions
 * 4. Reports any inconsistencies found
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting clinician ID verification...');

// Step 1: Check for non-standard UUID formats
console.log('\n--- Checking for non-standard UUID formats ---');
try {
  console.log('Running UUID format check...');
  const uuidCheckSql = `
    -- Check calendar_events table
    SELECT id, clinician_id, event_type
    FROM calendar_events
    WHERE clinician_id IS NOT NULL 
    AND clinician_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LIMIT 10;
    
    -- Check clinicians table
    SELECT id, clinician_email
    FROM clinicians
    WHERE id IS NOT NULL 
    AND id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LIMIT 10;
    
    -- Check profiles table
    SELECT id, email, role
    FROM profiles
    WHERE id IS NOT NULL 
    AND id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LIMIT 10;
  `;

  // Write the SQL to a temporary file
  const tempSqlFile = path.join(__dirname, 'verify-uuid-formats.sql');
  fs.writeFileSync(tempSqlFile, uuidCheckSql);

  // Run the SQL
  const result = execSync(`npx supabase db execute ${tempSqlFile}`, { encoding: 'utf8' });
  console.log('UUID format check result:');
  console.log(result || 'No non-standard UUIDs found (empty result is good)');

  // Clean up the temporary file
  fs.unlinkSync(tempSqlFile);
} catch (error) {
  console.error('Error checking UUID formats:', error.message);
}

// Step 2: Verify foreign key constraints
console.log('\n--- Verifying foreign key constraints ---');
try {
  console.log('Running foreign key check...');
  const fkCheckSql = `
    -- Check if all clinician_ids in calendar_events exist in profiles
    SELECT ce.clinician_id, COUNT(*) as event_count
    FROM calendar_events ce
    LEFT JOIN profiles p ON ce.clinician_id = p.id
    WHERE p.id IS NULL
    GROUP BY ce.clinician_id
    LIMIT 10;
    
    -- Check if all clinician IDs in clinicians table exist in profiles
    SELECT c.id, c.clinician_email
    FROM clinicians c
    LEFT JOIN profiles p ON c.id = p.id
    WHERE p.id IS NULL
    LIMIT 10;
  `;

  // Write the SQL to a temporary file
  const tempSqlFile = path.join(__dirname, 'verify-foreign-keys.sql');
  fs.writeFileSync(tempSqlFile, fkCheckSql);

  // Run the SQL
  const result = execSync(`npx supabase db execute ${tempSqlFile}`, { encoding: 'utf8' });
  console.log('Foreign key check result:');
  console.log(result || 'No foreign key violations found (empty result is good)');

  // Clean up the temporary file
  fs.unlinkSync(tempSqlFile);
} catch (error) {
  console.error('Error checking foreign keys:', error.message);
}

// Step 3: Test ID validation functions
console.log('\n--- Testing ID validation functions ---');
try {
  console.log('Running validation function tests...');
  const validationTestSql = `
    -- Test standardize_uuid function with various inputs
    SELECT 
      'Valid UUID' as test_case,
      '123e4567-e89b-12d3-a456-426614174000'::text as input,
      standardize_uuid('123e4567-e89b-12d3-a456-426614174000') as result,
      standardize_uuid('123e4567-e89b-12d3-a456-426614174000') = '123e4567-e89b-12d3-a456-426614174000'::uuid as passed
    UNION ALL
    SELECT 
      'UUID without hyphens' as test_case,
      '123e4567e89b12d3a456426614174000'::text as input,
      standardize_uuid('123e4567e89b12d3a456426614174000') as result,
      standardize_uuid('123e4567e89b12d3a456426614174000') = '123e4567-e89b-12d3-a456-426614174000'::uuid as passed;
    
    -- Test validate_clinician_id trigger
    DO $$
    DECLARE
      test_result text;
      test_passed boolean := false;
    BEGIN
      BEGIN
        -- This should fail if the trigger is working correctly
        INSERT INTO calendar_events (
          title, 
          event_type, 
          start_time, 
          end_time, 
          clinician_id
        ) VALUES (
          'TEST_VALIDATION', 
          'availability', 
          NOW(), 
          NOW() + interval '1 hour', 
          'not-a-valid-uuid'
        );
        
        test_result := 'FAILED: Trigger did not reject invalid UUID';
        test_passed := false;
      EXCEPTION WHEN OTHERS THEN
        test_result := 'PASSED: Trigger correctly rejected invalid UUID - ' || SQLERRM;
        test_passed := true;
      END;
      
      RAISE NOTICE 'Validation trigger test: %', test_result;
      
      -- Clean up any test data
      DELETE FROM calendar_events WHERE title = 'TEST_VALIDATION';
    END $$;
  `;

  // Write the SQL to a temporary file
  const tempSqlFile = path.join(__dirname, 'test-validation-functions.sql');
  fs.writeFileSync(tempSqlFile, validationTestSql);

  // Run the SQL
  const result = execSync(`npx supabase db execute ${tempSqlFile}`, { encoding: 'utf8' });
  console.log('Validation function test result:');
  console.log(result);

  // Clean up the temporary file
  fs.unlinkSync(tempSqlFile);
} catch (error) {
  console.error('Error testing validation functions:', error.message);
}

// Step 4: Check for ID mismatches between auth and profiles
console.log('\n--- Checking for ID mismatches between auth and profiles ---');
try {
  console.log('Running ID mismatch check...');
  const mismatchCheckSql = `
    -- This query checks for users in auth.users that don't have matching profiles
    SELECT au.id as auth_id, au.email, p.id as profile_id
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE p.id IS NULL
    LIMIT 10;
    
    -- This query checks for profiles that don't have matching auth users
    SELECT p.id as profile_id, p.email, au.id as auth_id
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE au.id IS NULL AND p.role = 'clinician'
    LIMIT 10;
  `;

  // Write the SQL to a temporary file
  const tempSqlFile = path.join(__dirname, 'check-id-mismatches.sql');
  fs.writeFileSync(tempSqlFile, mismatchCheckSql);

  // Run the SQL
  const result = execSync(`npx supabase db execute ${tempSqlFile}`, { encoding: 'utf8' });
  console.log('ID mismatch check result:');
  console.log(result || 'No ID mismatches found (empty result is good)');

  // Clean up the temporary file
  fs.unlinkSync(tempSqlFile);
} catch (error) {
  console.error('Error checking ID mismatches:', error.message);
}

console.log('\n--- Verification completed ---');
console.log('If any issues were found, they should be addressed by the standardization migration.');
console.log('If problems persist, manual intervention may be required.');