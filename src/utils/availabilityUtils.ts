
import { CalendarEvent } from '@/types/calendar';
import { WeeklyAvailability } from '@/types/appointment';

export const getClinicianAvailabilityFieldsQuery = () => {
  return `
    id,
    clinician_first_name,
    clinician_last_name,
    clinician_email,
    clinician_phone,
    clinician_time_zone,
    clinician_status
  `;
};

// Provide an empty but correctly structured WeeklyAvailability object
export const createEmptyWeeklyAvailability = (): WeeklyAvailability => {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  };
};

// Convert clinician availability fields (data from Supabase) into an array of blocks
// This function is used by ViewAvailabilityDialog, which expects an array:
//   [{ id, day_of_week, start_time, end_time }]
// We'll check for the common field names on the 'clinicianData' (possibly via a join/related table)
export const convertClinicianDataToAvailabilityBlocks = (clinicianData: any) => {
  if (!clinicianData) return [];
  // If the structure is "clinician_availability_blocks" or similar, use that
  if (Array.isArray(clinicianData.clinician_availability_blocks)) {
    // The fields expected by ViewAvailabilityDialog: id, day_of_week, start_time, end_time
    return clinicianData.clinician_availability_blocks.map((block: any) => ({
      id: block.id,
      day_of_week: block.day_of_week,
      start_time: block.start_time,
      end_time: block.end_time,
    }));
  }
  // Fallback for flat properties (not array)
  if (clinicianData.day_of_week && clinicianData.start_time && clinicianData.end_time) {
    return [{
      id: clinicianData.id,
      day_of_week: clinicianData.day_of_week,
      start_time: clinicianData.start_time,
      end_time: clinicianData.end_time,
    }];
  }
  // Defensive: handle case where structure is not matched
  return [];
};

