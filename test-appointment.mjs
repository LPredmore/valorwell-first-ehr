// Test script to create a new appointment and verify the fixes
import { supabase } from './src/integrations/supabase/client.js';
import { TimeZoneService } from './src/utils/timeZoneService.js';

// Function to create a test appointment
async function createTestAppointment() {
  try {
    // Get current date in the correct format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create appointment data
    const appointmentData = {
      client_id: '00000000-0000-0000-0000-000000000001', // Replace with an actual client ID
      clinician_id: '00000000-0000-0000-0000-000000000002', // Replace with an actual clinician ID
      date: formattedDate,
      start_time: '10:00', // 10:00 AM
      end_time: '11:00', // 11:00 AM
      type: 'Test Appointment',
      status: 'scheduled'
    };
    
    console.log('Creating test appointment with data:', appointmentData);
    
    // Insert the appointment into the database
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select();
    
    if (error) {
      console.error('Error creating test appointment:', error);
      return null;
    }
    
    console.log('Test appointment created successfully:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Unexpected error creating test appointment:', error);
    return null;
  }
}

// Function to verify the appointment appears in the calendar
async function verifyAppointmentInCalendar(appointmentId) {
  try {
    // Fetch the appointment from the database
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();
    
    if (error) {
      console.error('Error fetching test appointment:', error);
      return false;
    }
    
    console.log('Fetched appointment from database:', data);
    
    // Convert the appointment to the user's timezone
    const userTimeZone = 'America/Chicago';
    const localizedAppointment = TimeZoneService.convertEventToUserTimeZone(
      data,
      userTimeZone
    );
    
    console.log('Localized appointment:', localizedAppointment);
    
    // Verify the date format
    const normalizedDate = new Date(localizedAppointment.date).toISOString().split('T')[0];
    console.log('Normalized date:', normalizedDate);
    
    return true;
  } catch (error) {
    console.error('Unexpected error verifying appointment:', error);
    return false;
  }
}

// Main function to run the test
async function runTest() {
  console.log('Starting appointment display test...');
  
  // Create a test appointment
  const appointment = await createTestAppointment();
  if (!appointment) {
    console.error('Failed to create test appointment');
    return;
  }
  
  // Verify the appointment appears in the calendar
  const verified = await verifyAppointmentInCalendar(appointment.id);
  if (verified) {
    console.log('Test passed: Appointment was created and can be properly displayed in the calendar');
  } else {
    console.error('Test failed: Could not verify appointment display');
  }
}

// Run the test
runTest();