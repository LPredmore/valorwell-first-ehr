
import { useEffect, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { useAvailability } from '@/hooks/useAvailability';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';

interface CalendarAvailabilityHandlerProps {
  clinicianId: string;
  userTimeZone: string;
  onEventsChange: (events: CalendarEvent[]) => void;
  showAvailability: boolean;
}

/**
 * Component to handle the fetching and preparation of availability data for the calendar
 * This separates the availability logic from the calendar rendering component
 */
const CalendarAvailabilityHandler: React.FC<CalendarAvailabilityHandlerProps> = ({
  clinicianId,
  userTimeZone,
  onEventsChange,
  showAvailability
}) => {
  const {
    weeklyAvailability,
    isLoading,
    refreshAvailability
  } = useAvailability(clinicianId);

  const convertAvailabilityToEvents = useCallback(() => {
    if (!weeklyAvailability || !showAvailability) {
      return [];
    }

    const events: CalendarEvent[] = [];
    const now = DateTime.now();
    const currentWeekStart = now.startOf('week');
    
    // Map day names to ISO weekday numbers (1-7)
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
      if (!dayNumber) return;
      
      // Get the date for this day in the current week
      const dayDate = currentWeekStart.plus({ days: dayNumber - 1 });
      
      // Process each slot
      slots
        .filter(slot => !slot.isAppointment) // Only include availability slots, not appointments
        .forEach(slot => {
          // Parse the time strings
          const [startHour, startMinute] = slot.startTime.split(':').map(Number);
          const [endHour, endMinute] = slot.endTime.split(':').map(Number);
          
          // Create DateTime objects for start and end times
          let startDateTime = dayDate.set({ hour: startHour, minute: startMinute });
          let endDateTime = dayDate.set({ hour: endHour, minute: endMinute });
          
          // Convert to UTC for FullCalendar
          const start = startDateTime.toJSDate();
          const end = endDateTime.toJSDate();
          
          // Create the event
          events.push({
            id: slot.id,
            title: 'Available',
            start,
            end,
            backgroundColor: '#22c55e',
            borderColor: '#16a34a',
            textColor: '#ffffff',
            extendedProps: {
              isAvailability: true,
              isRecurring: !!slot.isRecurring,
              dayOfWeek: day,
              eventType: 'availability'
            }
          });
        });
    });

    return events;
  }, [weeklyAvailability, showAvailability]);

  // Update events when availability data changes
  useEffect(() => {
    if (!isLoading && clinicianId) {
      const availabilityEvents = convertAvailabilityToEvents();
      if (availabilityEvents.length > 0) {
        console.log('[CalendarAvailabilityHandler] Converted availability to events:', availabilityEvents.length);
        onEventsChange(availabilityEvents);
      }
    }
  }, [clinicianId, weeklyAvailability, isLoading, onEventsChange, convertAvailabilityToEvents]);

  // Refresh availability when component mounts or clinician changes
  useEffect(() => {
    if (clinicianId && showAvailability) {
      refreshAvailability();
    }
  }, [clinicianId, refreshAvailability, showAvailability]);

  return null;
};

export default CalendarAvailabilityHandler;
