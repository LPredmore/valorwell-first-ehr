/**
 * Utility functions for working with availability data
 * These functions help convert between the clinicians table format and the availability blocks format
 */

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
