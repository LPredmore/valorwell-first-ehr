import React, { useEffect, useState, useCallback } from 'react';
import { AvailabilityQueryService } from '@/services/AvailabilityQueryService';
import { WeeklyAvailability, AvailabilitySlot, DayOfWeek } from '@/types/availability';
import { CalendarEvent, WeekdayNumbers } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { weekdayNameToNumber, getWeekdayNumberFromDateTime } from '@/utils/calendarWeekdayUtils';

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

  const convertAvailabilityToEvents = useCallback((weeklyAvailability: WeeklyAvailability): CalendarEvent[] => {
    try {
      const events: CalendarEvent[] = [];
      const now = TimeZoneService.getCurrentDateTime(validTimeZone);
      
      for (const [day, slots] of Object.entries(weeklyAvailability)) {
        const weekday = weekdayNameToNumber[day as DayOfWeek];
        if (weekday === undefined) {
          console.error('[CalendarAvailabilityHandler] Invalid weekday:', day);
          continue;
        }
        
        for (const slot of slots) {
          if (slot.isAppointment) continue;
          
          let targetDay = now.set({ weekday: weekday === 0 ? 7 : weekday });
          if (targetDay < now) {
            targetDay = targetDay.plus({ weeks: 1 });
          }
          
          console.log('[CalendarAvailabilityHandler] Processing slot:', {
            day,
            weekday,
            targetDay: targetDay.toISO(),
            startTime: slot.startTime,
            endTime: slot.endTime,
            timeZone: validTimeZone
          });
          
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
                
                console.log('[CalendarAvailabilityHandler] Created event:', {
                  id: event.id,
                  start: event.start,
                  end: event.end
                });
                
                events.push(event);
              } else {
                console.error('[CalendarAvailabilityHandler] Invalid date created:', {
                  day, 
                  slot, 
                  start, 
                  end, 
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

  return null;
};

export default CalendarAvailabilityHandler;
