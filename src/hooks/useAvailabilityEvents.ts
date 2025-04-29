

import { useState, useCallback, useMemo, useRef } from 'react';
import { WeeklyAvailability, DayOfWeek } from '@/types/availability';
import { CalendarEvent, WeekdayNumbers } from '@/types/calendar';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timezone';
import { weekdayNameToNumber } from '@/utils/calendarWeekdayUtils';
import { componentMonitor } from '@/utils/performance/componentMonitor';

// Define the type that the hook actually uses internally
type StringIndexedWeeklyAvailability = {
  [key: string]: {
    id?: string;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
    clinicianId: string; // Ensure this is required to match both interfaces
    isRecurring?: boolean;
    isAppointment?: boolean;
    clientName?: string;
    appointmentStatus?: string;
    excludeDates?: string[];
  }[];
};

interface UseAvailabilityEventsProps {
  userTimeZone: string;
  weeksToShow?: number;
}

export const useAvailabilityEvents = ({ userTimeZone, weeksToShow = 8 }: UseAvailabilityEventsProps) => {
  const validTimeZone = useMemo(() =>
    TimeZoneService.ensureIANATimeZone(userTimeZone),
    [userTimeZone]
  );
  
  // Cache for recurring events to avoid regenerating them
  const recurringEventsCache = useRef<Record<string, CalendarEvent[]>>({});
  
  // Performance monitoring
  const conversionStartTime = useRef(0);

  // Optimized conversion function with memoization for recurring events
  const convertAvailabilityToEvents = useCallback((weeklyAvailability: StringIndexedWeeklyAvailability): CalendarEvent[] => {
    // Start performance monitoring
    conversionStartTime.current = performance.now();
    
    // Log only in development
    console.log('[useAvailabilityEvents] Converting availability to events with timezone:', validTimeZone);
    
    const events: CalendarEvent[] = [];
    // Use DateTime directly instead of relying on getCurrentDateTime
    const now = DateTime.now().setZone(validTimeZone);
    
    // Process each day's availability slots
    for (const [day, slots] of Object.entries(weeklyAvailability)) {
      const weekday = weekdayNameToNumber[day as DayOfWeek];
      if (weekday === undefined) {
        console.error('[useAvailabilityEvents] Invalid weekday:', day);
        continue;
      }
      
      // Process each slot for this day
      for (const slot of slots) {
        // Skip appointment slots as they'll be handled separately
        if (slot.isAppointment) continue;
        
        // Generate a cache key for this recurring slot
        const cacheKey = `${slot.id}-${day}-${slot.startTime}-${slot.endTime}-${validTimeZone}`;
        
        // Check if we have this recurring event pattern cached
        if (slot.isRecurring && recurringEventsCache.current[cacheKey]) {
          // Use cached events for recurring slots
          events.push(...recurringEventsCache.current[cacheKey]);
          continue;
        }
        
        // Calculate the target day for this slot
        let targetDay = now.set({ weekday: weekday === 0 ? 7 : weekday });
        if (targetDay < now) {
          targetDay = targetDay.plus({ weeks: 1 });
        }
        
        const recurringEvents: CalendarEvent[] = [];
        
        // Generate events for each week in the range
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
            
            if (start.isValid && end.isValid) {
              const event: CalendarEvent = {
                id: `${slot.id}-week${week}`,
                title: 'Available',
                start: start.toJSDate(),
                end: end.toJSDate(),
                extendedProps: {
                  isAvailability: true,
                  eventType: 'availability',
                  isRecurring: slot.isRecurring,
                  sourceTable: slot.id,
                  dayOfWeek: day,
                  sourceInfo: 'calendar_events',
                  week
                },
                classNames: ['availability-event'],
                backgroundColor: '#4caf50',
                borderColor: '#388e3c'
              };
              
              // Add to the events array
              events.push(event);
              
              // If this is a recurring event, also add to the recurring events cache
              if (slot.isRecurring) {
                recurringEvents.push(event);
              }
            }
          } catch (weekError) {
            console.error(`[useAvailabilityEvents] Error processing week ${week} for day ${day}:`, weekError);
          }
        }
        
        // Cache recurring events for future use
        if (slot.isRecurring && recurringEvents.length > 0) {
          recurringEventsCache.current[cacheKey] = recurringEvents;
        }
      }
    }
    
    // Record performance
    const conversionTime = performance.now() - conversionStartTime.current;
    componentMonitor.recordRender('convertAvailabilityToEvents', conversionTime, {
      props: { eventCount: events.length }
    });
    
    // Log event generation
    console.log(`[useAvailabilityEvents] Generated ${events.length} availability events`);
    
    return events;
  }, [validTimeZone, weeksToShow]);

  return { convertAvailabilityToEvents };
};
