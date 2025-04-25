
import React, { useEffect, useState, useCallback } from 'react';
import { AvailabilityQueryService } from '@/services/AvailabilityQueryService';
import { WeeklyAvailability } from '@/types/availability';
import { CalendarEvent, WeekdayNumbers } from '@/types/calendar';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timeZoneService';

interface CalendarAvailabilityHandlerProps {
  clinicianId: string;
  userTimeZone: string;
  onEventsChange: (events: CalendarEvent[]) => void;
  onError?: (error: Error) => void;
  showAvailability: boolean;
  weeksToShow?: number;
}

const CalendarAvailabilityHandler: React.FC<CalendarAvailabilityHandlerProps> = ({
  clinicianId,
  userTimeZone,
  onEventsChange,
  onError,
  showAvailability,
  weeksToShow = 8
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);

  // Convert weekly availability to calendar events
  const convertAvailabilityToEvents = useCallback((weeklyAvailability: WeeklyAvailability): CalendarEvent[] => {
    try {
      const events: CalendarEvent[] = [];
      const now = DateTime.now().setZone(validTimeZone).startOf('day');
      
      // Define weekday mapping using WeekdayNumbers type from our calendar types
      const weekdayMap: { [key: string]: WeekdayNumbers } = {
        monday: 1 as WeekdayNumbers,
        tuesday: 2 as WeekdayNumbers,
        wednesday: 3 as WeekdayNumbers,
        thursday: 4 as WeekdayNumbers,
        friday: 5 as WeekdayNumbers,
        saturday: 6 as WeekdayNumbers,
        sunday: 0 as WeekdayNumbers
      };
      
      // Create events for each weekday for the next several weeks
      for (const [day, slots] of Object.entries(weeklyAvailability)) {
        const weekday = weekdayMap[day];
        if (weekday === undefined) continue;

        // Process each slot for this day
        for (const slot of slots) {
          try {
            // Skip appointment slots, we only want to show availability
            if (slot.isAppointment) continue;
            
            // Get today's date and find the next occurrence of this weekday
            let targetDay = now.set({ weekday });
            if (targetDay < now) {
              targetDay = targetDay.plus({ days: 7 });
            }
            
            // Create events for multiple weeks ahead
            for (let week = 0; week < weeksToShow; week++) {
              try {
                const eventDate = targetDay.plus({ weeks: week });
                const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                const [endHour, endMinute] = slot.endTime.split(':').map(Number);
                
                const start = eventDate.set({
                  hour: startHour,
                  minute: startMinute,
                  second: 0,
                  millisecond: 0
                });
                
                const end = eventDate.set({
                  hour: endHour,
                  minute: endMinute,
                  second: 0,
                  millisecond: 0
                });
                
                // Only add valid dates
                if (start.isValid && end.isValid) {
                  events.push({
                    id: `${slot.id}-week${week}`,
                    title: 'Available',
                    start: start.toJSDate(),
                    end: end.toJSDate(),
                    extendedProps: {
                      isAvailability: true,
                      isRecurring: slot.isRecurring,
                      // Use sourceTable which exists in the type definition
                      sourceTable: slot.id
                    },
                    classNames: ['availability-event'],
                    backgroundColor: '#4caf50',
                    borderColor: '#388e3c'
                  });
                } else {
                  console.error('[CalendarAvailabilityHandler] Invalid date created:', {
                    day, slot, start, end, 
                    startValid: start.isValid, 
                    endValid: end.isValid,
                    startError: start.invalidReason,
                    endError: end.invalidReason
                  });
                }
              } catch (weekError) {
                console.error(`[CalendarAvailabilityHandler] Error processing week ${week} for day ${day}:`, weekError);
              }
            }
          } catch (slotError) {
            console.error(`[CalendarAvailabilityHandler] Error processing slot ${slot.id}:`, slotError);
          }
        }
      }

      console.log(`[CalendarAvailabilityHandler] Generated ${events.length} availability events`);
      return events;
    } catch (error) {
      console.error('[CalendarAvailabilityHandler] Error converting availability to events:', error);
      if (onError) onError(error as Error);
      return [];
    }
  }, [validTimeZone, weeksToShow, onError]);

  // Fetch availability when clinician changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!showAvailability || !clinicianId) {
        onEventsChange([]);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('[CalendarAvailabilityHandler] Fetching availability for clinician:', clinicianId);
        
        const weeklyAvailability = await AvailabilityQueryService.getWeeklyAvailability(clinicianId);
        const events = convertAvailabilityToEvents(weeklyAvailability);
        onEventsChange(events);
      } catch (error) {
        console.error('[CalendarAvailabilityHandler] Error fetching availability:', error);
        if (onError) onError(error as Error);
        onEventsChange([]); // Send empty array so calendar still renders without availability
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, showAvailability, convertAvailabilityToEvents, onEventsChange, onError]);

  // This component doesn't render anything, it just processes data and calls onEventsChange
  return null;
};

export default CalendarAvailabilityHandler;
