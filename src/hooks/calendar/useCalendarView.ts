import { useState, useCallback, useMemo } from 'react';
import { CalendarViewType } from '@/types/calendar';
import { useCalendar } from '@/context/CalendarContext';
import { DateTime } from 'luxon';

interface CalendarViewState {
  view: CalendarViewType;
  currentDate: DateTime;
  visibleRange: {
    start: DateTime;
    end: DateTime;
  };
  title: string;
}

interface UseCalendarViewResult extends CalendarViewState {
  setView: (view: CalendarViewType) => void;
  setCurrentDate: (date: DateTime) => void;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  goToToday: () => void;
  showAvailability: boolean;
  showAppointments: boolean;
  showTimeOff: boolean;
  setShowAvailability: (show: boolean) => void;
  setShowAppointments: (show: boolean) => void;
  setShowTimeOff: (show: boolean) => void;
}

/**
 * Hook for managing calendar view state
 * Provides methods for changing the view, navigating between periods,
 * and controlling which event types are displayed
 */
export function useCalendarView(): UseCalendarViewResult {
  const { 
    view, 
    currentDate, 
    setView, 
    setCurrentDate,
    showAvailability,
    showAppointments,
    showTimeOff,
    setShowAvailability,
    setShowAppointments,
    setShowTimeOff
  } = useCalendar();
  
  // Calculate visible range based on view and current date
  const visibleRange = useMemo(() => {
    const date = currentDate;
    
    switch (view) {
      case 'dayGridMonth':
        return {
          start: date.startOf('month'),
          end: date.endOf('month')
        };
      case 'timeGridWeek':
        return {
          start: date.startOf('week'),
          end: date.endOf('week')
        };
      case 'timeGridDay':
        return {
          start: date.startOf('day'),
          end: date.endOf('day')
        };
      default:
        return {
          start: date.startOf('week'),
          end: date.endOf('week')
        };
    }
  }, [view, currentDate]);
  
  // Generate a human-readable title for the current view
  const title = useMemo(() => {
    const date = currentDate;
    
    switch (view) {
      case 'dayGridMonth':
        return date.toFormat('MMMM yyyy');
      case 'timeGridWeek': {
        const weekStart = visibleRange.start;
        const weekEnd = visibleRange.end;
        
        // If week spans two months
        if (weekStart.month !== weekEnd.month) {
          return `${weekStart.toFormat('MMM d')} - ${weekEnd.toFormat('MMM d, yyyy')}`;
        }
        
        // If week spans two years
        if (weekStart.year !== weekEnd.year) {
          return `${weekStart.toFormat('MMM d, yyyy')} - ${weekEnd.toFormat('MMM d, yyyy')}`;
        }
        
        // Regular week
        return `${weekStart.toFormat('MMM d')} - ${weekEnd.toFormat('d, yyyy')}`;
      }
      case 'timeGridDay':
        return date.toFormat('EEEE, MMMM d, yyyy');
      default:
        return date.toFormat('MMMM yyyy');
    }
  }, [view, currentDate, visibleRange]);
  
  // Navigate to the next period based on current view
  const goToNextPeriod = useCallback(() => {
    switch (view) {
      case 'dayGridMonth':
        setCurrentDate(currentDate.plus({ months: 1 }));
        break;
      case 'timeGridWeek':
        setCurrentDate(currentDate.plus({ weeks: 1 }));
        break;
      case 'timeGridDay':
        setCurrentDate(currentDate.plus({ days: 1 }));
        break;
      default:
        setCurrentDate(currentDate.plus({ weeks: 1 }));
        break;
    }
  }, [view, currentDate, setCurrentDate]);
  
  // Navigate to the previous period based on current view
  const goToPreviousPeriod = useCallback(() => {
    switch (view) {
      case 'dayGridMonth':
        setCurrentDate(currentDate.minus({ months: 1 }));
        break;
      case 'timeGridWeek':
        setCurrentDate(currentDate.minus({ weeks: 1 }));
        break;
      case 'timeGridDay':
        setCurrentDate(currentDate.minus({ days: 1 }));
        break;
      default:
        setCurrentDate(currentDate.minus({ weeks: 1 }));
        break;
    }
  }, [view, currentDate, setCurrentDate]);
  
  // Navigate to today
  const goToToday = useCallback(() => {
    setCurrentDate(DateTime.now());
  }, [setCurrentDate]);
  
  return {
    view,
    currentDate,
    visibleRange,
    title,
    setView,
    setCurrentDate,
    goToNextPeriod,
    goToPreviousPeriod,
    goToToday,
    showAvailability,
    showAppointments,
    showTimeOff,
    setShowAvailability,
    setShowAppointments,
    setShowTimeOff
  };
}