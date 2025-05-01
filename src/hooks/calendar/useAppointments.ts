import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { useCalendar } from '@/context/CalendarContext';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useToast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';

interface UseAppointmentsResult {
  appointmentEvents: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  createAppointment: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateAppointment: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteAppointment: (eventId: string) => Promise<boolean>;
  getUpcomingAppointments: (limit?: number) => CalendarEvent[];
  getPastAppointments: (limit?: number) => CalendarEvent[];
  getAppointmentsByDate: (date: DateTime) => CalendarEvent[];
  refreshAppointments: () => Promise<void>;
}

/**
 * Hook for managing appointments in the calendar system
 * Provides methods for creating, updating, and deleting appointments,
 * as well as retrieving appointments by various criteria
 */
export function useAppointments(): UseAppointmentsResult {
  const { 
    events, 
    isLoading, 
    error, 
    createAppointment, 
    updateAppointment, 
    deleteAppointment,
    refreshEvents,
    selectedClinicianId
  } = useCalendar();
  
  const { userTimeZone } = useTimeZone();
  const { toast } = useToast();
  
  // Refresh appointments
  const refreshAppointments = useCallback(async () => {
    await refreshEvents();
  }, [refreshEvents]);
  
  // Get upcoming appointments
  const getUpcomingAppointments = useCallback((limit: number = 10) => {
    const now = DateTime.now().setZone(userTimeZone);
    
    // Filter appointments that are in the future
    const upcomingAppointments = events.appointments
      .filter(event => {
        const eventStart = typeof event.start === 'string' 
          ? DateTime.fromISO(event.start) 
          : DateTime.fromJSDate(event.start);
        
        return eventStart > now;
      })
      // Sort by start time (ascending)
      .sort((a, b) => {
        const aStart = typeof a.start === 'string' 
          ? DateTime.fromISO(a.start) 
          : DateTime.fromJSDate(a.start);
        
        const bStart = typeof b.start === 'string' 
          ? DateTime.fromISO(b.start) 
          : DateTime.fromJSDate(b.start);
        
        return aStart.toMillis() - bStart.toMillis();
      })
      // Limit the number of results
      .slice(0, limit);
    
    return upcomingAppointments;
  }, [events.appointments, userTimeZone]);
  
  // Get past appointments
  const getPastAppointments = useCallback((limit: number = 10) => {
    const now = DateTime.now().setZone(userTimeZone);
    
    // Filter appointments that are in the past
    const pastAppointments = events.appointments
      .filter(event => {
        const eventStart = typeof event.start === 'string' 
          ? DateTime.fromISO(event.start) 
          : DateTime.fromJSDate(event.start);
        
        return eventStart < now;
      })
      // Sort by start time (descending)
      .sort((a, b) => {
        const aStart = typeof a.start === 'string' 
          ? DateTime.fromISO(a.start) 
          : DateTime.fromJSDate(a.start);
        
        const bStart = typeof b.start === 'string' 
          ? DateTime.fromISO(b.start) 
          : DateTime.fromJSDate(b.start);
        
        return bStart.toMillis() - aStart.toMillis();
      })
      // Limit the number of results
      .slice(0, limit);
    
    return pastAppointments;
  }, [events.appointments, userTimeZone]);
  
  // Get appointments for a specific date
  const getAppointmentsByDate = useCallback((date: DateTime) => {
    // Filter appointments for the specified date
    const appointmentsForDate = events.appointments.filter(event => {
      const eventStart = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      return eventStart.hasSame(date, 'day');
    });
    
    // Sort by start time (ascending)
    return appointmentsForDate.sort((a, b) => {
      const aStart = typeof a.start === 'string' 
        ? DateTime.fromISO(a.start) 
        : DateTime.fromJSDate(a.start);
      
      const bStart = typeof b.start === 'string' 
        ? DateTime.fromISO(b.start) 
        : DateTime.fromJSDate(b.start);
      
      return aStart.toMillis() - bStart.toMillis();
    });
  }, [events.appointments]);
  
  // Create a new appointment with validation
  const createValidatedAppointment = useCallback(async (event: CalendarEvent) => {
    try {
      // Validate required fields
      if (!event.title) {
        throw new Error('Appointment title is required');
      }
      
      if (!event.start || !event.end) {
        throw new Error('Appointment start and end times are required');
      }
      
      if (!event.extendedProps?.clientId) {
        throw new Error('Client ID is required for appointments');
      }
      
      // Validate that the appointment falls within availability
      const start = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      const end = typeof event.end === 'string' 
        ? DateTime.fromISO(event.end) 
        : DateTime.fromJSDate(event.end);
      
      // Check if the appointment falls within any availability block
      const isWithinAvailability = events.availability.some(block => {
        const blockStart = typeof block.start === 'string' 
          ? DateTime.fromISO(block.start) 
          : DateTime.fromJSDate(block.start);
        
        const blockEnd = typeof block.end === 'string' 
          ? DateTime.fromISO(block.end) 
          : DateTime.fromJSDate(block.end);
        
        return start >= blockStart && end <= blockEnd;
      });
      
      if (!isWithinAvailability) {
        throw new Error('Appointment must be scheduled within available time slots');
      }
      
      // Check if the appointment conflicts with any existing appointment
      const hasAppointmentConflict = events.appointments.some(appt => {
        // Skip the current appointment if we're updating
        if (event.id && appt.id === event.id) {
          return false;
        }
        
        const apptStart = typeof appt.start === 'string' 
          ? DateTime.fromISO(appt.start) 
          : DateTime.fromJSDate(appt.start);
        
        const apptEnd = typeof appt.end === 'string' 
          ? DateTime.fromISO(appt.end) 
          : DateTime.fromJSDate(appt.end);
        
        return (
          (start >= apptStart && start < apptEnd) || // Appointment starts during another appointment
          (end > apptStart && end <= apptEnd) || // Appointment ends during another appointment
          (start <= apptStart && end >= apptEnd) // Appointment contains another appointment
        );
      });
      
      if (hasAppointmentConflict) {
        throw new Error('This time slot conflicts with an existing appointment');
      }
      
      // Check if the appointment conflicts with any time off
      const hasTimeOffConflict = events.timeOff.some(off => {
        const offStart = typeof off.start === 'string' 
          ? DateTime.fromISO(off.start) 
          : DateTime.fromJSDate(off.start);
        
        const offEnd = typeof off.end === 'string' 
          ? DateTime.fromISO(off.end) 
          : DateTime.fromJSDate(off.end);
        
        return (
          (start >= offStart && start < offEnd) || // Appointment starts during time off
          (end > offStart && end <= offEnd) || // Appointment ends during time off
          (start <= offStart && end >= offEnd) // Appointment contains time off
        );
      });
      
      if (hasTimeOffConflict) {
        throw new Error('This time slot conflicts with scheduled time off');
      }
      
      // Create the appointment
      return await createAppointment(event);
    } catch (error) {
      console.error('[useAppointments] Error creating appointment:', error);
      
      toast({
        title: "Error creating appointment",
        description: error instanceof Error ? error.message : 'Failed to create appointment',
        variant: "destructive"
      });
      
      return null;
    }
  }, [createAppointment, events, toast]);
  
  // Update an appointment with validation
  const updateValidatedAppointment = useCallback(async (event: CalendarEvent) => {
    try {
      // Validate required fields
      if (!event.id) {
        throw new Error('Appointment ID is required for updates');
      }
      
      if (!event.title) {
        throw new Error('Appointment title is required');
      }
      
      if (!event.start || !event.end) {
        throw new Error('Appointment start and end times are required');
      }
      
      if (!event.extendedProps?.clientId) {
        throw new Error('Client ID is required for appointments');
      }
      
      // Validate that the appointment falls within availability
      const start = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      const end = typeof event.end === 'string' 
        ? DateTime.fromISO(event.end) 
        : DateTime.fromJSDate(event.end);
      
      // Check if the appointment falls within any availability block
      const isWithinAvailability = events.availability.some(block => {
        const blockStart = typeof block.start === 'string' 
          ? DateTime.fromISO(block.start) 
          : DateTime.fromJSDate(block.start);
        
        const blockEnd = typeof block.end === 'string' 
          ? DateTime.fromISO(block.end) 
          : DateTime.fromJSDate(block.end);
        
        return start >= blockStart && end <= blockEnd;
      });
      
      if (!isWithinAvailability) {
        throw new Error('Appointment must be scheduled within available time slots');
      }
      
      // Check if the appointment conflicts with any existing appointment
      const hasAppointmentConflict = events.appointments.some(appt => {
        // Skip the current appointment
        if (appt.id === event.id) {
          return false;
        }
        
        const apptStart = typeof appt.start === 'string' 
          ? DateTime.fromISO(appt.start) 
          : DateTime.fromJSDate(appt.start);
        
        const apptEnd = typeof appt.end === 'string' 
          ? DateTime.fromISO(appt.end) 
          : DateTime.fromJSDate(appt.end);
        
        return (
          (start >= apptStart && start < apptEnd) || // Appointment starts during another appointment
          (end > apptStart && end <= apptEnd) || // Appointment ends during another appointment
          (start <= apptStart && end >= apptEnd) // Appointment contains another appointment
        );
      });
      
      if (hasAppointmentConflict) {
        throw new Error('This time slot conflicts with an existing appointment');
      }
      
      // Check if the appointment conflicts with any time off
      const hasTimeOffConflict = events.timeOff.some(off => {
        const offStart = typeof off.start === 'string' 
          ? DateTime.fromISO(off.start) 
          : DateTime.fromJSDate(off.start);
        
        const offEnd = typeof off.end === 'string' 
          ? DateTime.fromISO(off.end) 
          : DateTime.fromJSDate(off.end);
        
        return (
          (start >= offStart && start < offEnd) || // Appointment starts during time off
          (end > offStart && end <= offEnd) || // Appointment ends during time off
          (start <= offStart && end >= offEnd) // Appointment contains time off
        );
      });
      
      if (hasTimeOffConflict) {
        throw new Error('This time slot conflicts with scheduled time off');
      }
      
      // Update the appointment
      return await updateAppointment(event);
    } catch (error) {
      console.error('[useAppointments] Error updating appointment:', error);
      
      toast({
        title: "Error updating appointment",
        description: error instanceof Error ? error.message : 'Failed to update appointment',
        variant: "destructive"
      });
      
      return null;
    }
  }, [updateAppointment, events, toast]);
  
  return {
    appointmentEvents: events.appointments,
    isLoading: isLoading.appointments,
    error,
    createAppointment: createValidatedAppointment,
    updateAppointment: updateValidatedAppointment,
    deleteAppointment,
    getUpcomingAppointments,
    getPastAppointments,
    getAppointmentsByDate,
    refreshAppointments
  };
}