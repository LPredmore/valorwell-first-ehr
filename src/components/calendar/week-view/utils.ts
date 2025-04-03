
import { differenceInMinutes, addMinutes } from 'date-fns';
import { TimeBlock, AppointmentBlock } from './useWeekViewData';

// Helper function to convert hours and minutes to total minutes
export const timeToMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

// Helper function to check for overlapping appointments
export const getOverlappingAppointments = (
  appointment: AppointmentBlock,
  appointments: AppointmentBlock[]
): AppointmentBlock[] => {
  return appointments.filter(app => {
    if (app.id === appointment.id) return false;
    
    const appStart = timeToMinutes(app.start.getHours(), app.start.getMinutes());
    const appEnd = timeToMinutes(app.end.getHours(), app.end.getMinutes());
    const currentStart = timeToMinutes(appointment.start.getHours(), appointment.start.getMinutes());
    const currentEnd = timeToMinutes(appointment.end.getHours(), appointment.end.getMinutes());
    
    return (
      (appStart <= currentStart && appEnd > currentStart) || // App starts before and ends after current start
      (appStart >= currentStart && appStart < currentEnd) // App starts during current
    );
  });
};
