
import { CalendarEvent } from '@/types/calendar';

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

// Simplified availability block conversion since we're removing the old system
export const convertClinicianDataToAvailabilityBlocks = (clinicianData: any) => {
  return [];
};
