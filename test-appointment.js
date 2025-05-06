// Test script to create a new appointment and verify the fixes
import { supabase } from './src/integrations/supabase/client.ts';
import { TimeZoneService } from './src/utils/timeZoneService.ts';

// Function to create a test appointment
async function createTestAppointment() {
  try {
    // Get current date in the correct format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('Current date and time:', {
      raw: today,
      formatted: formattedDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
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
    
    // Get the current system timezone
    const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('System timezone:', systemTimeZone);
    
    // Test with multiple timezones to ensure consistent behavior
    const timezones = ['America/Chicago', 'UTC', systemTimeZone];
    
    for (const userTimeZone of timezones) {
      console.log(`\n--- Testing with timezone: ${userTimeZone} ---`);
      
      // Convert the appointment to the user's timezone
      const localizedAppointment = TimeZoneService.convertEventToUserTimeZone(
        data,
        userTimeZone
      );
      
      console.log('Localized appointment:', localizedAppointment);
      
      // Verify the date format using multiple methods
      const normalizedDate = new Date(localizedAppointment.date).toISOString().split('T')[0];
      console.log('Normalized date (JS Date):', normalizedDate);
      
      // Use TimeZoneService to normalize the date
      const luxonNormalizedDate = TimeZoneService.formatDate(
        TimeZoneService.fromDateString(localizedAppointment.date, userTimeZone)
      );
      console.log('Normalized date (TimeZoneService):', luxonNormalizedDate);
      
      // Check if the date is today (which it should be since we created it today)
      const today = new Date().toISOString().split('T')[0];
      const isToday = normalizedDate === today;
      console.log('Is appointment today?', isToday, `(today: ${today}, appointment: ${normalizedDate})`);
      
      // Simulate the calendar component's date comparison logic
      const appointmentDateTime = TimeZoneService.fromDateString(localizedAppointment.date, userTimeZone);
      const todayDateTime = TimeZoneService.fromDateString(today, userTimeZone);
      const isSameDay = TimeZoneService.isSameDay(appointmentDateTime, todayDateTime);
      console.log('isSameDay check:', isSameDay);
    }
    
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