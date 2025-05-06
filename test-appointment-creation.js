// Test script to verify appointment creation after schema changes
// Run this with: node test-appointment-creation.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test function to create an appointment
async function testAppointmentCreation() {
  console.log('Testing appointment creation with UTC-only model...');
  
  try {
    // Generate test data
    const now = new Date();
    const startAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);    // 1 hour later
    
    // Get a client and clinician for testing
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .limit(1);
      
    if (clientError) {
      throw new Error(`Error fetching client: ${clientError.message}`);
    }
    
    const { data: clinicians, error: clinicianError } = await supabase
      .from('clinicians')
      .select('id')
      .limit(1);
      
    if (clinicianError) {
      throw new Error(`Error fetching clinician: ${clinicianError.message}`);
    }
    
    if (!clients.length || !clinicians.length) {
      throw new Error('No clients or clinicians found for testing');
    }
    
    const clientId = clients[0].id;
    const clinicianId = clinicians[0].id;
    
    // Create test appointment with UTC timestamps only
    const appointmentData = {
      client_id: clientId,
      clinician_id: clinicianId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      type: "Test Session",
      status: 'scheduled',
      notes: "Test appointment after schema changes"
    };
    
    console.log('Creating appointment with data:', appointmentData);
    
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select();
      
    if (error) {
      throw new Error(`Error creating appointment: ${error.message}`);
    }
    
    console.log('✅ Success! Appointment created with ID:', data[0].id);
    console.log('Appointment details:', data[0]);
    
    // Clean up - delete the test appointment
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', data[0].id);
      
    if (deleteError) {
      console.warn(`Warning: Could not delete test appointment: ${deleteError.message}`);
    } else {
      console.log('Test appointment deleted successfully');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAppointmentCreation();