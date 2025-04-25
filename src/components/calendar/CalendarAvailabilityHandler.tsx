
import { useEffect, useCallback, useState } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { useAvailability } from '@/hooks/useAvailability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

interface CalendarAvailabilityHandlerProps {
  clinicianId: string;
  userTimeZone: string;
  onEventsChange: (events: CalendarEvent[]) => void;
  showAvailability: boolean;
  weeksToShow?: number; // New prop to control how many weeks to display
}

/**
 * Component to handle the fetching and preparation of availability data for the calendar
 * This separates the availability logic from the calendar rendering component
 */
const CalendarAvailabilityHandler: React.FC<CalendarAvailabilityHandlerProps> = ({
  clinicianId,
  userTimeZone,
  onEventsChange,
  showAvailability,
  weeksToShow = 8 // Default to 8 weeks (2 months) of availability
}) => {
  const [availabilityEvents, setAvailabilityEvents] = useState<CalendarEvent[]>([]);
  
  const {
    weeklyAvailability,
    isLoading,
    refreshAvailability
  } = useAvailability(clinicianId);

  const convertAvailabilityToEvents = useCallback(() => {
    if (!weeklyAvailability || !showAvailability) {
      console.log('[CalendarAvailabilityHandler] No availability data or showAvailability is false');
      return [];
    }

    const events: CalendarEvent[] = [];
    const now = DateTime.now();
    const currentWeekStart = now.startOf('week');
    
    console.log('[CalendarAvailabilityHandler] Converting availability to events for', weeksToShow, 'weeks');
    console.log('[CalendarAvailabilityHandler] Current week starts at:', currentWeekStart.toISO());
    console.log('[CalendarAvailabilityHandler] Weekly availability data:', weeklyAvailability);
    
    // Map day names to ISO weekday numbers (1-7, Monday to Sunday)
    const dayToIsoWeekday: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };

    // Process each day's availability slots
    Object.entries(weeklyAvailability).forEach(([day, slots]) => {
      const dayNumber = dayToIsoWeekday[day];
      if (!dayNumber) {
        console.warn(`[CalendarAvailabilityHandler] Unknown day: ${day}`);
        return;
      }
      
      console.log(`[CalendarAvailabilityHandler] Processing ${slots.length} slots for ${day}`);
      
      // Filter out appointment slots
      const availabilitySlots = slots.filter(slot => !slot.isAppointment);
      
      console.log(`[CalendarAvailabilityHandler] Found ${availabilitySlots.length} availability slots for ${day}`);
      
      if (availabilitySlots.length === 0) {
        return;
      }
      
      // Generate events for multiple weeks
      for (let week = 0; week < weeksToShow; week++) {
        // Get the date for this day in the current week + offset
        const weekOffset = week * 7; // days
        const dayDate = currentWeekStart.plus({ days: (dayNumber - 1) + weekOffset });
        
        // Skip dates in the past
        if (dayDate < now.startOf('day')) {
          continue;
        }
        
        // Process each slot for the current day
        availabilitySlots.forEach(slot => {
          try {
            // Parse the time strings
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            
            // Create DateTime objects for start and end times in the clinician's timezone
            let startDateTime = dayDate.set({ hour: startHour, minute: startMinute });
            let endDateTime = dayDate.set({ hour: endHour, minute: endMinute });
            
            // Format for logging
            const startFormatted = startDateTime.toFormat('yyyy-MM-dd HH:mm');
            const endFormatted = endDateTime.toFormat('yyyy-MM-dd HH:mm');
            
            console.log(`[CalendarAvailabilityHandler] Creating event for week ${week}, ${day}:`, {
              start: startFormatted,
              end: endFormatted,
              id: slot.id
            });
            
            // Convert to UTC for FullCalendar
            const start = startDateTime.toJSDate();
            const end = endDateTime.toJSDate();
            
            // Create the event
            events.push({
              id: `${slot.id}-week-${week}`,
              title: 'Available',
              start,
              end,
              backgroundColor: '#22c55e',
              borderColor: '#16a34a',
              textColor: '#ffffff',
              editable: false, // Make sure availability slots aren't editable
              extendedProps: {
                isAvailability: true,
                isRecurring: !!slot.isRecurring,
                originalSlotId: slot.id, // Keep reference to original slot ID
                dayOfWeek: day,
                eventType: 'availability',
                week
              }
            });
          } catch (error) {
            console.error(`[CalendarAvailabilityHandler] Error processing slot ${slot.id} for ${day}:`, error);
          }
        });
      }
    });

    console.log(`[CalendarAvailabilityHandler] Total availability events created: ${events.length}`);
    return events;
  }, [weeklyAvailability, showAvailability, weeksToShow]);

  // Generate availability events when data changes
  useEffect(() => {
    setAvailabilityEvents(convertAvailabilityToEvents());
  }, [convertAvailabilityToEvents]);

  // Update provided events when our internal state changes
  useEffect(() => {
    if (availabilityEvents.length > 0) {
      console.log('[CalendarAvailabilityHandler] Sending availability events to parent:', availabilityEvents.length);
      onEventsChange(availabilityEvents);
    } else if (!isLoading && showAvailability) {
      console.log('[CalendarAvailabilityHandler] No availability events to send');
      onEventsChange([]);
    }
  }, [availabilityEvents, onEventsChange, isLoading, showAvailability]);

  // Refresh availability when component mounts or clinician changes
  useEffect(() => {
    if (clinicianId && showAvailability) {
      console.log(`[CalendarAvailabilityHandler] Refreshing availability for clinician: ${clinicianId}`);
      refreshAvailability();
    }
  }, [clinicianId, refreshAvailability, showAvailability]);

  return null;
};

export default CalendarAvailabilityHandler;
