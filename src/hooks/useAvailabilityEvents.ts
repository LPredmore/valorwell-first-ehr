
import { useState, useCallback } from 'react';
import { WeeklyAvailability, DayOfWeek } from '@/types/availability';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { weekdayNameToNumber } from '@/utils/calendarWeekdayUtils';

interface UseAvailabilityEventsProps {
  userTimeZone: string;
  weeksToShow?: number;
}

export const useAvailabilityEvents = ({ userTimeZone, weeksToShow = 8 }: UseAvailabilityEventsProps) => {
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);

  const convertAvailabilityToEvents = useCallback((weeklyAvailability: WeeklyAvailability): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const now = TimeZoneService.getCurrentDateTime(validTimeZone);
    
    for (const [day, slots] of Object.entries(weeklyAvailability)) {
      const weekday = weekdayNameToNumber[day as DayOfWeek];
      if (weekday === undefined) {
        console.error('[useAvailabilityEvents] Invalid weekday:', day);
        continue;
      }
      
      for (const slot of slots) {
        if (slot.isAppointment) continue;
        
        let targetDay = now.set({ weekday: weekday === 0 ? 7 : weekday });
        if (targetDay < now) {
          targetDay = targetDay.plus({ weeks: 1 });
        }
        
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
                  sourceTable: slot.id
                },
                classNames: ['availability-event'],
                backgroundColor: '#4caf50',
                borderColor: '#388e3c'
              };
              
              events.push(event);
            }
          } catch (weekError) {
            console.error(`[useAvailabilityEvents] Error processing week ${week} for day ${day}:`, weekError);
          }
        }
      }
    }
    
    return events;
  }, [validTimeZone, weeksToShow]);

  return { convertAvailabilityToEvents };
};
