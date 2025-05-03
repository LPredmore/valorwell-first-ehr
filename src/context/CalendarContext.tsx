import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timezone';
import CalendarService from '@/services/calendar/CalendarService';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { useUser } from './UserContext';

interface CalendarContextProps {
  selectedClinicianId: string | null;
  setSelectedClinicianId: (clinicianId: string | null) => void;
  availabilityEvents: CalendarEvent[];
  appointmentEvents: CalendarEvent[];
  timeOffEvents: CalendarEvent[];
  availabilityLoading: boolean;
  appointmentLoading: boolean;
  timeOffLoading: boolean;
  availabilityError: Error | null;
  appointmentError: Error | null;
  timeOffError: Error | null;
  getAvailabilityEvents: () => Promise<void>;
  getAppointmentEvents: () => Promise<void>;
  getTimeOffEvents: () => Promise<void>;
  refreshEvents: () => void;
  startDate: Date;
  endDate: Date;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

const defaultContext: CalendarContextProps = {
  selectedClinicianId: null,
  setSelectedClinicianId: () => {},
  availabilityEvents: [],
  appointmentEvents: [],
  timeOffEvents: [],
  availabilityLoading: false,
  appointmentLoading: false,
  timeOffLoading: false,
  availabilityError: null,
  appointmentError: null,
  timeOffError: null,
  getAvailabilityEvents: async () => {},
  getAppointmentEvents: async () => {},
  getTimeOffEvents: async () => {},
  refreshEvents: () => {},
  startDate: new Date(),
  endDate: new Date(),
  setStartDate: () => {},
  setEndDate: () => {},
  isSidebarOpen: false,
  setSidebarOpen: () => {},
  isDialogOpen: false,
  setIsDialogOpen: () => {},
};

export const CalendarContext = createContext<CalendarContextProps>(defaultContext);

export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(null);
  const [availabilityEvents, setAvailabilityEvents] = useState<CalendarEvent[]>([]);
  const [appointmentEvents, setAppointmentEvents] = useState<CalendarEvent[]>([]);
  const [timeOffEvents, setTimeOffEvents] = useState<CalendarEvent[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [timeOffLoading, setTimeOffLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<Error | null>(null);
  const [appointmentError, setAppointmentError] = useState<Error | null>(null);
  const [timeOffError, setTimeOffError] = useState<Error | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { timeZone: userTimeZone } = useUserTimeZone(selectedClinicianId);
  const { userId } = useUser();
  
  const refreshEvents = useCallback(() => {
    getAvailabilityEvents();
    getAppointmentEvents();
    getTimeOffEvents();
  }, [getAvailabilityEvents, getAppointmentEvents, getTimeOffEvents]);

  // Get availability events
  const getAvailabilityEvents = async () => {
    if (!selectedClinicianId || !userTimeZone) return;
    
    try {
      setAvailabilityLoading(true);
      setAvailabilityError(null);
      
      // Use the public getEvents method with event type filter instead of private method
      const events = await CalendarService.getEvents(
        selectedClinicianId,
        userTimeZone,
        startDate,
        endDate
      ).then(events => events.filter(e => e.extendedProps?.eventType === 'availability'));
      
      setAvailabilityEvents(events);
    } catch (error) {
      console.error('[CalendarContext] Error fetching availability events:', error);
      setAvailabilityError(error as Error);
    } finally {
      setAvailabilityLoading(false);
    }
  };
  
  // Get appointment events
  const getAppointmentEvents = async () => {
    if (!selectedClinicianId || !userTimeZone) return;
    
    try {
      setAppointmentLoading(true);
      setAppointmentError(null);
      
      // Use the public getEvents method with event type filter instead of private method
      const events = await CalendarService.getEvents(
        selectedClinicianId,
        userTimeZone,
        startDate,
        endDate
      ).then(events => events.filter(e => e.extendedProps?.eventType === 'appointment'));
      
      setAppointmentEvents(events);
    } catch (error) {
      console.error('[CalendarContext] Error fetching appointment events:', error);
      setAppointmentError(error as Error);
    } finally {
      setAppointmentLoading(false);
    }
  };
  
  // Get time off events
  const getTimeOffEvents = async () => {
    if (!selectedClinicianId || !userTimeZone) return;
    
    try {
      setTimeOffLoading(true);
      setTimeOffError(null);
      
      // Use the public getEvents method with event type filter instead of private method
      const events = await CalendarService.getEvents(
        selectedClinicianId,
        userTimeZone,
        startDate,
        endDate
      ).then(events => events.filter(e => e.extendedProps?.eventType === 'time_off'));
      
      setTimeOffEvents(events);
    } catch (error) {
      console.error('[CalendarContext] Error fetching time off events:', error);
      setTimeOffError(error as Error);
    } finally {
      setTimeOffLoading(false);
    }
  };

  useEffect(() => {
    refreshEvents();
  }, [selectedClinicianId, userTimeZone, startDate, endDate, refreshEvents]);

  const contextValue: CalendarContextProps = {
    selectedClinicianId,
    setSelectedClinicianId,
    availabilityEvents,
    appointmentEvents,
    timeOffEvents,
    availabilityLoading,
    appointmentLoading,
    timeOffLoading,
    availabilityError,
    appointmentError,
    timeOffError,
    getAvailabilityEvents,
    getAppointmentEvents,
    getTimeOffEvents,
    refreshEvents,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    isSidebarOpen,
    setSidebarOpen,
    isDialogOpen,
    setIsDialogOpen,
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};
