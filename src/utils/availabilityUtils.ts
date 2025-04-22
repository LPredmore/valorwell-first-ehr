
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

// Simplified function returning empty but structured array since we're removing the old system
export const convertClinicianDataToAvailabilityBlocks = (clinicianData: any) => {
  return [];
};
