
import { WeeklyAvailability, DayOfWeek } from '@/types/availability';

export const createEmptyWeeklyAvailability = (): WeeklyAvailability => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
});

export const getDayNumber = (day: string): number => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days.indexOf(day.toLowerCase());
};

export const convertClinicianDataToAvailabilityBlocks = (clinicianData: any) => {
  if (!clinicianData) return [];
  
  return Object.entries(clinicianData)
    .filter(([key]) => key.startsWith('availability_'))
    .map(([key, value]) => {
      const availabilityValue = value as Record<string, any> | null;
      return {
        id: `${clinicianData.id}-${key}`,
        day_of_week: key.replace('availability_', ''),
        start_time: availabilityValue?.start_time || '09:00:00',
        end_time: availabilityValue?.end_time || '17:00:00',
        clinician_id: clinicianData.id
      };
    })
    .filter(block => block.start_time && block.end_time);
};

export const getClinicianAvailabilityFieldsQuery = () => `
  id,
  availability_monday,
  availability_tuesday,
  availability_wednesday,
  availability_thursday,
  availability_friday,
  availability_saturday,
  availability_sunday
`;
