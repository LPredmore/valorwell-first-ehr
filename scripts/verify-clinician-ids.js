/**
 * Clinician ID Verification Script
 * 
 * This script verifies that all clinician IDs in the database are valid UUIDs
 * and exist in the profiles table. It checks all tables that use clinician_id
 * and reports any issues found.
 * 
 * Usage: node scripts/verify-clinician-ids.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Tables to check for clinician_id
const TABLES_WITH_CLINICIAN_ID = [
  'calendar_events',
  'appointments',
  'time_off',
  'availability_settings'
];

// Function to check if a string is a valid UUID
function isValidUUID(id) {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

// Function to check a specific table
async function checkTable(tableName) {
  console.log(`\nChecking ${tableName} table...`);
  
  // Get all records with clinician_id
  const { data, error } = await supabase
    .from(tableName)
    .select('id, clinician_id')
    .order('id');
    
  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error.message);
    return {
      table: tableName,
      total: 0,
      valid: 0,
      invalid: 0,
      invalidRecords: []
    };
  }
  
  if (!data || data.length === 0) {
    console.log(`No records found in ${tableName}`);
    return {
      table: tableName,
      total: 0,
      valid: 0,
      invalid: 0,
      invalidRecords: []
    };
  }
  
  console.log(`Found ${data.length} records in ${tableName}`);
  
  // Check each record
  const invalidRecords = [];
  let validCount = 0;
  
  for (const record of data) {
    if (!record.clinician_id) {
      invalidRecords.push({
        id: record.id,
        clinician_id: record.clinician_id,
        reason: 'NULL or empty clinician_id'
      });
      continue;
    }
    
    if (!isValidUUID(record.clinician_id)) {
      invalidRecords.push({
        id: record.id,
        clinician_id: record.clinician_id,
        reason: 'Not a valid UUID format'
      });
      continue;
    }
    
    validCount++;
  }
  
  return {
    table: tableName,
    total: data.length,
    valid: validCount,
    invalid: invalidRecords.length,
    invalidRecords
  };
}

// Function to check if clinician IDs exist in profiles table
async function checkClinicianIDsExist(allInvalidRecords) {
  console.log('\nChecking if clinician IDs exist in profiles table...');
  
  // Extract all unique clinician IDs from valid records
  const uniqueClinicianIds = new Set();
  
  for (const table of TABLES_WITH_CLINICIAN_ID) {
    const { data, error } = await supabase
      .from(table)
      .select('clinician_id')
      .filter('clinician_id', 'not.is', null);
      
    if (error) {
      console.error(`Error fetching clinician IDs from ${table}:`, error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      for (const record of data) {
        if (record.clinician_id && isValidUUID(record.clinician_id)) {
          uniqueClinicianIds.add(record.clinician_id);
        }
      }
    }
  }
  
  console.log(`Found ${uniqueClinicianIds.size} unique clinician IDs`);
  
  // Check if each clinician ID exists in profiles table
  const nonExistentClinicianIds = [];
  
  for (const clinicianId of uniqueClinicianIds) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', clinicianId)
      .single();
      
    if (error || !data) {
      nonExistentClinicianIds.push(clinicianId);
    }
  }
  
  return {
    total: uniqueClinicianIds.size,
    existing: uniqueClinicianIds.size - nonExistentClinicianIds.length,
    nonExistent: nonExistentClinicianIds.length,
    nonExistentIds: nonExistentClinicianIds
  };
}

// Main function
async function main() {
  console.log('Starting clinician ID verification...');
  
  const results = [];
  const allInvalidRecords = [];
  
  // Check each table
  for (const table of TABLES_WITH_CLINICIAN_ID) {
    const result = await checkTable(table);
    results.push(result);
    
    if (result.invalidRecords.length > 0) {
      allInvalidRecords.push(...result.invalidRecords.map(record => ({
        ...record,
        table
      })));
    }
  }
  
  // Check if clinician IDs exist in profiles table
  const existenceCheck = await checkClinicianIDsExist(allInvalidRecords);
  
  // Print summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  
  console.log('\nTable Results:');
  for (const result of results) {
    console.log(`${result.table}: ${result.total} total, ${result.valid} valid, ${result.invalid} invalid`);
  }
  
  console.log('\nClinician ID Existence Check:');
  console.log(`${existenceCheck.total} unique clinician IDs, ${existenceCheck.existing} exist in profiles, ${existenceCheck.nonExistent} do not exist`);
  
  // Print detailed report if there are issues
  if (allInvalidRecords.length > 0 || existenceCheck.nonExistent > 0) {
    console.log('\n=== DETAILED REPORT ===');
    
    if (allInvalidRecords.length > 0) {
      console.log('\nInvalid Records:');
      for (const record of allInvalidRecords) {
        console.log(`Table: ${record.table}, ID: ${record.id}, Clinician ID: ${record.clinician_id}, Reason: ${record.reason}`);
      }
    }
    
    if (existenceCheck.nonExistent > 0) {
      console.log('\nNon-existent Clinician IDs:');
      for (const id of existenceCheck.nonExistentIds) {
        console.log(id);
      }
    }
    
    console.log('\nRecommendations:');
    console.log('1. Fix invalid UUID formats by updating them to valid UUIDs');
    console.log('2. For non-existent clinician IDs, either create corresponding profiles or update the references');
    console.log('3. Run this script again after making changes to verify all issues are resolved');
    
    process.exit(1); // Exit with error code
  } else {
    console.log('\nAll clinician IDs are valid and exist in the profiles table!');
  }
}

// Run the script
main().catch(error => {
  console.error('Error running verification script:', error);
  process.exit(1);
});