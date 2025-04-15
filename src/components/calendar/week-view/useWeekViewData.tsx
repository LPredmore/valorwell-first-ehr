
import { Appointment, ProcessedAppointment } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfDay } from 'date-fns';

export type { 
  Appointment,
  ProcessedAppointment
} from '@/types/appointment';

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  clinician_id?: string;
  is_active?: boolean;
  isException?: boolean;
}

export interface AvailabilityException {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  clinician_id: string;
  type: 'block' | 'unblock';
}

export interface TimeBlock {
  id?: string;
  day: Date;
  start: Date;
  end: Date;
  availabilityIds: string[];
  type?: 'block' | 'unblock';
}

export interface AppointmentBlock {
  id: string;
  clientName: string;
  day: Date;
  start: Date;
  end: Date;
  status: string;
}

import { useState, useEffect } from 'react';

export function useWeekViewData(days: Date[], clinicianId: string | null, refreshTrigger: number = 0, appointments: Appointment[] = [], getClientName: (clientId: string) => string, userTimeZone: string) {
  const [loading, setLoading] = useState(true);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!clinicianId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch clinician data with availability information
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select(`
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
          `)
          .eq('id', clinicianId)
          .single();
          
        if (clinicianError) {
          throw new Error(`Failed to fetch clinician data: ${clinicianError.message}`);
        }

        // Process availability by day of week and create time blocks
        const processedTimeBlocks: TimeBlock[] = [];
        
        days.forEach(day => {
          const dayOfWeek = format(day, 'EEEE').toLowerCase(); // e.g., "monday", "tuesday", etc.
          const slots = [];
          
          // Check each available slot for the current day (up to 3 slots per day)
          for (let slotNum = 1; slotNum <= 3; slotNum++) {
            const startTimeKey = `clinician_${dayOfWeek}start${slotNum}`;
            const endTimeKey = `clinician_${dayOfWeek}end${slotNum}`;
            
            if (clinicianData && clinicianData[startTimeKey] && clinicianData[endTimeKey]) {
              // Create a time block for this availability slot
              const startTime = clinicianData[startTimeKey];
              const endTime = clinicianData[endTimeKey];
              
              // Parse hours and minutes from time string (format: "HH:MM:SS")
              const [startHour, startMinute] = startTime.split(':').map(Number);
              const [endHour, endMinute] = endTime.split(':').map(Number);
              
              // Create Date objects for start and end times
              const startDate = new Date(day);
              startDate.setHours(startHour, startMinute, 0, 0);
              
              const endDate = new Date(day);
              endDate.setHours(endHour, endMinute, 0, 0);
              
              processedTimeBlocks.push({
                day: day,
                start: startDate,
                end: endDate,
                availabilityIds: [`${clinicianId}-${dayOfWeek}-${slotNum}`],
              });
              
              console.log(`Added availability for ${format(day, 'yyyy-MM-dd')} (${dayOfWeek}): ${startTime} - ${endTime}`);
            }
          }
        });

        setTimeBlocks(processedTimeBlocks);

        // Process appointments
        const appointmentBlocks = appointments.map(appointment => {
          const start = parseISO(`${appointment.date}T${appointment.start_time}`);
          const end = parseISO(`${appointment.date}T${appointment.end_time}`);

          return {
            id: appointment.id,
            clientName: appointment.clientName || getClientName(appointment.client_id),
            day: startOfDay(start),
            start: start,
            end: end,
            status: appointment.status,
          };
        });

        setAppointmentBlocks(appointmentBlocks);
      } catch (err: any) {
        console.error('Error in useWeekViewData:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [days, clinicianId, refreshTrigger, appointments, getClientName, userTimeZone]);

  return {
    loading,
    timeBlocks,
    appointmentBlocks,
    error,
  };
}
