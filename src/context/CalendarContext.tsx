
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CalendarEvent, CalendarViewType } from '@/types/calendar';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

interface CalendarContextProps {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  view: CalendarViewType;
  setView: (view: CalendarViewType) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedClinicianId: string | null;
  setSelectedClinicianId: (id: string | null) => void;
  showAvailability: boolean;
  setShowAvailability: (show: boolean) => void;
  refreshEvents: () => void;
  createEvent: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateEvent: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
}

const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);

export const CalendarProvider: React.FC<{
  children: React.ReactNode;
  initialClinicianId?: string | null;
  initialView?: CalendarViewType;
}> = ({ children, initialClinicianId = null, initialView = 'timeGridWeek' }) => {
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [view, setView] = useState<CalendarViewType>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showAvailability, setShowAvailability] = useState<boolean>(true);
  const { userTimeZone } = useTimeZone();
  const { toast } = useToast();
  const { userId } = useUser();

  const {
    events,
    isLoading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCalendarEvents({
    clinicianId: selectedClinicianId,
    userTimeZone,
  });

  const refreshEvents = useCallback(() => {
    if (selectedClinicianId) {
      console.log('[CalendarContext] Refreshing events for clinician:', selectedClinicianId);
      refetch();
    } else {
      console.log('[CalendarContext] No clinician selected, skipping refresh');
    }
  }, [selectedClinicianId, refetch]);

  // Refresh events when clinician changes
  useEffect(() => {
    if (selectedClinicianId) {
      refreshEvents();
    }
  }, [selectedClinicianId, refreshEvents]);

  // Notify on errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Calendar Error",
        description: `Error loading calendar events: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const value = {
    events,
    isLoading,
    error,
    view,
    setView,
    currentDate,
    setCurrentDate,
    selectedClinicianId,
    setSelectedClinicianId,
    showAvailability,
    setShowAvailability,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = (): CalendarContextProps => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
