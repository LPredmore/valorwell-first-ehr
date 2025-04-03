
import { useState, useEffect } from 'react';
import { format, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';
import { AppointmentBlockType, Appointment } from '../types/availability-types';

export const useAppointmentProcessing = (
  appointments: Appointment[] = [],
  getClientName: (clientId: string) => string = () => 'Client'
) => {
  const [appointmentBlocks, setAppointmentBlocks] = useState<AppointmentBlockType[]>([]);

  useEffect(() => {
    if (!appointments.length) {
      setAppointmentBlocks([]);
      console.log("No appointments to process in week view");
      return;
    }

    console.log("Processing appointments in week view:", appointments);
    
    const blocks: AppointmentBlockType[] = appointments.map(appointment => {
      const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
      const [endHour, endMinute] = appointment.end_time.split(':').map(Number);

      const dateObj = parseISO(appointment.date);
      const start = setMinutes(setHours(startOfDay(dateObj), startHour), startMinute);
      const end = setMinutes(setHours(startOfDay(dateObj), endHour), endMinute);

      const result = {
        id: appointment.id,
        day: dateObj,
        start,
        end,
        clientId: appointment.client_id,
        type: appointment.type,
        clientName: getClientName(appointment.client_id)
      };
      
      console.log(`Week view processed appointment ${appointment.id}:`, {
        date: format(dateObj, 'yyyy-MM-dd'),
        startTime: format(start, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        rawStart: appointment.start_time,
        rawEnd: appointment.end_time
      });
      
      return result;
    });

    console.log("Week view appointment blocks created:", blocks);
    setAppointmentBlocks(blocks);
  }, [appointments, getClientName]);

  return { appointmentBlocks };
};
