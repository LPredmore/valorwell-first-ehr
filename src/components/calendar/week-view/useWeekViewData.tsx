import { Appointment, ProcessedAppointment } from '@/types/appointment';

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
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

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
        const timeBlocks = days.map(day => {
          const blocks: TimeBlock[] = [];
          for (let i = 6; i < 24; i++) {
            const start = new Date(day);
            start.setHours(i, 0, 0, 0);
            const end = new Date(day);
            end.setHours(i + 1, 0, 0, 0);

            blocks.push({
              day: day,
              start: start,
              end: end,
              availabilityIds: [],
            });
          }
          return blocks;
        }).flat();

        setTimeBlocks(timeBlocks);

        const appointmentBlocks = appointments.map(appointment => {
          const start = parseISO(appointment.date + 'T' + appointment.start_time);
          const end = parseISO(appointment.date + 'T' + appointment.end_time);

          return {
            id: appointment.id,
            clientName: appointment.clientName || getClientName(appointment.client_id),
            day: parseISO(appointment.date),
            start: start,
            end: end,
            status: appointment.status,
          };
        });

        setAppointmentBlocks(appointmentBlocks);
      } catch (err: any) {
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
