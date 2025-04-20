/**
 * Utility functions for working with availability data
 * These functions help convert between the clinicians table format and the availability blocks format
 */

import { CalendarEvent } from '@/types/calendar';
import { fromUTCTimestamp, toUTCTimestamp } from './timeZoneUtils';
import { addDays, addWeeks, format, parseISO, startOfWeek } from 'date-fns';

/**
 * Converts clinician data to availability blocks format
 * @param clinicianData Data from the clinicians table
 * @returns Array of availability blocks in the format expected by components
 */
export function convertClinicianDataToAvailabilityBlocks(clinicianData: any) {
  if (!clinicianData) return [];
  
  const availabilityBlocks = [];
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeekMap = {
    'sunday': 'Sunday',
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday'
  };
  
  dayNames.forEach(day => {
    for (let slot = 1; slot <= 3; slot++) {
      const startKey = `clinician_${day}start${slot}`;
      const endKey = `clinician_${day}end${slot}`;
      
      if (clinicianData[startKey] && clinicianData[endKey]) {
        availabilityBlocks.push({
          id: `${clinicianData.id}-${day}-${slot}`,
          clinician_id: clinicianData.id,
          day_of_week: dayOfWeekMap[day],
          start_time: clinicianData[startKey],
          end_time: clinicianData[endKey],
          is_active: true
        });
      }
    }
  });
  
  return availabilityBlocks;
}

/**
 * Filters availability blocks for a specific day
 * @param availabilityBlocks Array of availability blocks
 * @param dayOfWeek Day of week to filter by (e.g., "Monday")
 * @returns Filtered array of availability blocks
 */
export function filterAvailabilityBlocksByDay(availabilityBlocks: any[], dayOfWeek: string) {
  return availabilityBlocks.filter(block => block.day_of_week === dayOfWeek);
}

/**
 * Converts clinician data to availability for a specific day
 * @param clinicianData Data from the clinicians table
 * @param dayOfWeek Day of week to get availability for (e.g., "Monday")
 * @returns Array of availability blocks for the specified day
 */
export function getClinicianAvailabilityForDay(clinicianData: any, dayOfWeek: string) {
  if (!clinicianData) return [];
  
  const day = dayOfWeek.toLowerCase();
  const availabilityBlocks = [];
  
  for (let slot = 1; slot <= 3; slot++) {
    const startKey = `clinician_${day}start${slot}`;
    const endKey = `clinician_${day}end${slot}`;
    
    if (clinicianData[startKey] && clinicianData[endKey]) {
      availabilityBlocks.push({
        id: `${clinicianData.id}-${day}-${slot}`,
        clinician_id: clinicianData.id,
        day_of_week: dayOfWeek,
        start_time: clinicianData[startKey],
        end_time: clinicianData[endKey],
        is_active: true
      });
    }
  }
  
  return availabilityBlocks;
}

/**
 * Gets the clinician availability fields query string for Supabase
 * @returns String containing all availability fields for a SELECT query
 */
export function getClinicianAvailabilityFieldsQuery(): string {
  return `
    id,
    clinician_mondaystart1, clinician_mondayend1,
    clinician_mondaystart2, clinician_mondayend2,
    clinician_mondaystart3, clinician_mondayend3,
    clinician_tuesdaystart1, clinician_tuesdayend1,
    clinician_tuesdaystart2, clinician_tuesdayend2,
    clinician_tuesdaystart3, clinician_tuesdayend3,
    clinician_wednesdaystart1, clinician_wednesdayend1,
    clinician_wednesdaystart2, clinician_wednesdayend2,
    clinician_wednesdaystart3, clinician_wednesdayend3,
    clinician_thursdaystart1, clinician_thursdayend1,
    clinician_thursdaystart2, clinician_thursdayend2,
    clinician_thursdaystart3, clinician_thursdayend3,
    clinician_fridaystart1, clinician_fridayend1,
    clinician_fridaystart2, clinician_fridayend2,
    clinician_fridaystart3, clinician_fridayend3,
    clinician_saturdaystart1, clinician_saturdayend1,
    clinician_saturdaystart2, clinician_saturdayend2,
    clinician_saturdaystart3, clinician_saturdayend3,
    clinician_sundaystart1, clinician_sundayend1,
    clinician_sundaystart2, clinician_sundayend2,
    clinician_sundaystart3, clinician_sundayend3
  `;
}

/**
 * Converts clinician availability data to calendar events for display
 * Handles time zone conversion for display in the user's time zone
 * 
 * @param clinicianData The clinician data containing weekly availability slots
 * @param singleDayAvailability Array of single day availability records
 * @param timeBlocks Array of time blocks (time off)
 * @param userTimeZone The user's time zone for display
 * @returns Array of calendar events representing availability
 */
export function convertClinicianDataToCalendarEvents(
  clinicianData: any,
  singleDayAvailability: any[] = [],
  timeBlocks: any[] = [],
  userTimeZone: string
): CalendarEvent[] {
  if (!clinicianData) return [];
  
  const calendarEvents: CalendarEvent[] = [];
  const today = new Date();
  const startDate = startOfWeek(today);
  
  // Process weekly recurring availability (create events for next 4 weeks)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMap = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  };
  
  // For each of the next 4 weeks
  for (let week = 0; week < 4; week++) {
    // For each day of the week
    dayNames.forEach((dayName, dayIndex) => {
      // Process up to 3 slots per day
      for (let slot = 1; slot <= 3; slot++) {
        const startKey = `clinician_${dayName}start${slot}`;
        const endKey = `clinician_${dayName}end${slot}`;
        
        if (clinicianData[startKey] && clinicianData[endKey]) {
          // Calculate the actual date for this day in this week
          const eventDate = addDays(addWeeks(startDate, week), dayIndex);
          const dateStr = format(eventDate, 'yyyy-MM-dd');
          
          // Create a calendar event for this time slot
          calendarEvents.push({
            title: 'Available',
            start: toUTCTimestamp(dateStr, clinicianData[startKey], userTimeZone),
            end: toUTCTimestamp(dateStr, clinicianData[endKey], userTimeZone),
            extendedProps: {
              isAvailability: true,
              availabilityBlock: {
                id: `weekly-${dayName}-${slot}`,
                type: 'weekly',
                dayOfWeek: dayName,
                startTime: clinicianData[startKey],
                endTime: clinicianData[endKey]
              }
            },
            display: 'block',
            backgroundColor: 'rgba(76, 175, 80, 0.3)',  // Light green
            borderColor: '#4CAF50',
            textColor: '#1B5E20'
          });
        }
      }
    });
  }
  
  // Add single day availability events
  singleDayAvailability.forEach((block) => {
    calendarEvents.push({
      title: 'Available (Custom)',
      start: toUTCTimestamp(block.availability_date, block.start_time, userTimeZone),
      end: toUTCTimestamp(block.availability_date, block.end_time, userTimeZone),
      extendedProps: {
        isAvailability: true,
        availabilityBlock: {
          id: block.id,
          type: 'single_day',
          date: block.availability_date,
          startTime: block.start_time,
          endTime: block.end_time
        }
      },
      display: 'block',
      backgroundColor: 'rgba(33, 150, 243, 0.3)',  // Light blue
      borderColor: '#2196F3',
      textColor: '#0D47A1'
    });
  });
  
  // Add time blocks (time off periods)
  timeBlocks.forEach((block) => {
    calendarEvents.push({
      title: block.reason || 'Unavailable',
      start: toUTCTimestamp(block.block_date, block.start_time, userTimeZone),
      end: toUTCTimestamp(block.block_date, block.end_time, userTimeZone),
      extendedProps: {
        isAvailability: false, // This is actually unavailability
        availabilityBlock: {
          id: block.id,
          type: 'time_block',
          date: block.block_date,
          startTime: block.start_time,
          endTime: block.end_time,
          reason: block.reason
        }
      },
      display: 'block',
      backgroundColor: 'rgba(244, 67, 54, 0.3)',  // Light red
      borderColor: '#F44336',
      textColor: '#B71C1C'
    });
  });
  
  return calendarEvents;
}

/**
 * Calculate if a given time slot overlaps with existing appointments
 * @param appointmentStart Start time of appointment to check
 * @param appointmentEnd End time of appointment to check
 * @param existingAppointments Array of existing appointments
 * @returns Boolean indicating if there is an overlap
 */
export function hasAppointmentOverlap(
  appointmentStart: Date,
  appointmentEnd: Date,
  existingAppointments: any[]
): boolean {
  return existingAppointments.some(appointment => {
    const existingStart = parseISO(appointment.start);
    const existingEnd = parseISO(appointment.end);
    
    // Check for overlap
    return (
      (appointmentStart >= existingStart && appointmentStart < existingEnd) ||
      (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
      (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
    );
  });
}

/**
 * Add custom CSS for availability events
 */
export function addAvailabilityStyles() {
  // Create a style element if it doesn't already exist
  let styleEl = document.getElementById('availability-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'availability-styles';
    document.head.appendChild(styleEl);
  }

  // Define styles for availability events
  styleEl.textContent = `
    .availability-event {
      opacity: 0.8;
      border-radius: 4px;
    }
    
    .fc-event.availability-event:hover {
      opacity: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  `;
}
