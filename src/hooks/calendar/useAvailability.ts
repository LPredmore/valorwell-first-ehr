import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { useCalendar } from '@/context/CalendarContext';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useToast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';

interface UseAvailabilityResult {
  availabilityEvents: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  createAvailability: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateAvailability: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteAvailability: (eventId: string) => Promise<boolean>;
  canEditAvailability: boolean;
  getAvailableSlots: (date: DateTime, duration?: number) => CalendarEvent[];
  checkSlotAvailability: (start: DateTime, end: DateTime) => boolean;
  refreshAvailability: () => Promise<void>;
}

/**
 * Hook for managing availability in the calendar system
 * Provides methods for creating, updating, and deleting availability events,
 * as well as checking availability for specific time slots
 */
export function useAvailability(): UseAvailabilityResult {
  const { 
    events, 
    isLoading, 
    error, 
    createAvailability, 
    updateAvailability, 
    deleteAvailability,
    refreshEvents,
    selectedClinicianId,
    canEditAvailability: checkPermission
  } = useCalendar();
  
  const { userTimeZone } = useTimeZone();
  const { toast } = useToast();
  const [canEdit, setCanEdit] = useState<boolean>(false);
  
  // Check if the user can edit availability for the selected clinician
  const checkEditPermission = useCallback(async () => {
    if (!selectedClinicianId) {
      setCanEdit(false);
      return;
    }
    
    try {
      const hasPermission = await checkPermission(selectedClinicianId);
      setCanEdit(hasPermission);
    } catch (error) {
      console.error('[useAvailability] Error checking edit permission:', error);
      setCanEdit(false);
    }
  }, [selectedClinicianId, checkPermission]);
  
  // Refresh availability events
  const refreshAvailability = useCallback(async () => {
    await refreshEvents();
    await checkEditPermission();
  }, [refreshEvents, checkEditPermission]);
  
  // Get available time slots for a specific date
  const getAvailableSlots = useCallback((date: DateTime, duration: number = 60) => {
    const availabilityForDate = events.availability.filter(event => {
      const eventStart = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      return eventStart.hasSame(date, 'day');
    });
    
    // If no availability blocks for this date, return empty array
    if (availabilityForDate.length === 0) {
      return [];
    }
    
    // Get all appointments for this date to check conflicts
    const appointmentsForDate = events.appointments.filter(event => {
      const eventStart = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      return eventStart.hasSame(date, 'day');
    });
    
    // Get all time off periods for this date to check conflicts
    const timeOffForDate = events.timeOff.filter(event => {
      const eventStart = typeof event.start === 'string' 
        ? DateTime.fromISO(event.start) 
        : DateTime.fromJSDate(event.start);
      
      return eventStart.hasSame(date, 'day');
    });
    
    // Generate available slots from availability blocks
    const availableSlots: CalendarEvent[] = [];
    
    for (const block of availabilityForDate) {
      const blockStart = typeof block.start === 'string' 
        ? DateTime.fromISO(block.start) 
        : DateTime.fromJSDate(block.start);
      
      const blockEnd = typeof block.end === 'string' 
        ? DateTime.fromISO(block.end) 
        : DateTime.fromJSDate(block.end);
      
      // Calculate number of slots in this block
      const blockDurationMinutes = blockEnd.diff(blockStart, 'minutes').minutes;
      const numSlots = Math.floor(blockDurationMinutes / duration);
      
      // Generate slots
      for (let i = 0; i < numSlots; i++) {
        const slotStart = blockStart.plus({ minutes: i * duration });
        const slotEnd = slotStart.plus({ minutes: duration });
        
        // Check if slot conflicts with any appointment
        const hasAppointmentConflict = appointmentsForDate.some(appt => {
          const apptStart = typeof appt.start === 'string' 
            ? DateTime.fromISO(appt.start) 
            : DateTime.fromJSDate(appt.start);
          
          const apptEnd = typeof appt.end === 'string' 
            ? DateTime.fromISO(appt.end) 
            : DateTime.fromJSDate(appt.end);
          
          return (
            (slotStart >= apptStart && slotStart < apptEnd) || // Slot starts during appointment
            (slotEnd > apptStart && slotEnd <= apptEnd) || // Slot ends during appointment
            (slotStart <= apptStart && slotEnd >= apptEnd) // Slot contains appointment
          );
        });
        
        // Check if slot conflicts with any time off
        const hasTimeOffConflict = timeOffForDate.some(off => {
          const offStart = typeof off.start === 'string' 
            ? DateTime.fromISO(off.start) 
            : DateTime.fromJSDate(off.start);
          
          const offEnd = typeof off.end === 'string' 
            ? DateTime.fromISO(off.end) 
            : DateTime.fromJSDate(off.end);
          
          return (
            (slotStart >= offStart && slotStart < offEnd) || // Slot starts during time off
            (slotEnd > offStart && slotEnd <= offEnd) || // Slot ends during time off
            (slotStart <= offStart && slotEnd >= offEnd) // Slot contains time off
          );
        });
        
        // If no conflicts, add slot to available slots
        if (!hasAppointmentConflict && !hasTimeOffConflict) {
          availableSlots.push({
            title: 'Available',
            start: slotStart.toJSDate(),
            end: slotEnd.toJSDate(),
            extendedProps: {
              eventType: 'availability',
              clinicianId: selectedClinicianId,
              timezone: userTimeZone,
              isAvailability: true
            }
          });
        }
      }
    }
    
    return availableSlots;
  }, [events, selectedClinicianId, userTimeZone]);
  
  // Check if a specific time slot is available
  const checkSlotAvailability = useCallback((start: DateTime, end: DateTime) => {
    // Check if the slot falls within any availability block
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
      return false;
    }
    
    // Check if the slot conflicts with any appointment
    const hasAppointmentConflict = events.appointments.some(appt => {
      const apptStart = typeof appt.start === 'string' 
        ? DateTime.fromISO(appt.start) 
        : DateTime.fromJSDate(appt.start);
      
      const apptEnd = typeof appt.end === 'string' 
        ? DateTime.fromISO(appt.end) 
        : DateTime.fromJSDate(appt.end);
      
      return (
        (start >= apptStart && start < apptEnd) || // Slot starts during appointment
        (end > apptStart && end <= apptEnd) || // Slot ends during appointment
        (start <= apptStart && end >= apptEnd) // Slot contains appointment
      );
    });
    
    // Check if the slot conflicts with any time off
    const hasTimeOffConflict = events.timeOff.some(off => {
      const offStart = typeof off.start === 'string' 
        ? DateTime.fromISO(off.start) 
        : DateTime.fromJSDate(off.start);
      
      const offEnd = typeof off.end === 'string' 
        ? DateTime.fromISO(off.end) 
        : DateTime.fromJSDate(off.end);
      
      return (
        (start >= offStart && start < offEnd) || // Slot starts during time off
        (end > offStart && end <= offEnd) || // Slot ends during time off
        (start <= offStart && end >= offEnd) // Slot contains time off
      );
    });
    
    return !hasAppointmentConflict && !hasTimeOffConflict;
  }, [events]);
  
  // Initialize permission check
  useMemo(() => {
    checkEditPermission();
  }, [checkEditPermission]);
  
  return {
    availabilityEvents: events.availability,
    isLoading: isLoading.availability,
    error,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    canEditAvailability: canEdit,
    getAvailableSlots,
    checkSlotAvailability,
    refreshAvailability
  };
}