
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { TimeZoneService } from '@/utils/timeZoneService';
import { CalendarService } from '@/services/calendar/CalendarService';
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
  // Added properties needed by hooks
  events: {
    availability: CalendarEvent[];
    appointments: CalendarEvent[];
    timeOff: CalendarEvent[];
  };
  isLoading: {
    availability: boolean;
    appointments: boolean;
    timeOff: boolean;
  };
  error: Error | null;
  createAvailability: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateAvailability: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteAvailability: (eventId: string) => Promise<boolean>;
  createAppointment: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateAppointment: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteAppointment: (eventId: string) => Promise<boolean>;
  createTimeOff: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateTimeOff: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  deleteTimeOff: (eventId: string) => Promise<boolean>;
  canEditAvailability: (clinicianId: string) => Promise<boolean>;
  // Calendar view state properties
  view: string;
  currentDate: any;
  setView: (view: string) => void;
  setCurrentDate: (date: any) => void;
  showAvailability: boolean;
  showAppointments: boolean;
  showTimeOff: boolean;
  setShowAvailability: (show: boolean) => void;
  setShowAppointments: (show: boolean) => void;
  setShowTimeOff: (show: boolean) => void;
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
  // Added default values for new props
  events: {
    availability: [],
    appointments: [],
    timeOff: []
  },
  isLoading: {
    availability: false,
    appointments: false,
    timeOff: false
  },
  error: null,
  createAvailability: async () => null,
  updateAvailability: async () => null,
  deleteAvailability: async () => false,
  createAppointment: async () => null,
  updateAppointment: async () => null,
  deleteAppointment: async () => false,
  createTimeOff: async () => null,
  updateTimeOff: async () => null,
  deleteTimeOff: async () => false,
  canEditAvailability: async () => false,
  view: 'timeGridWeek',
  currentDate: new Date(),
  setView: () => {},
  setCurrentDate: () => {},
  showAvailability: true,
  showAppointments: true,
  showTimeOff: true,
  setShowAvailability: () => {},
  setShowAppointments: () => {},
  setShowTimeOff: () => {},
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
  // Additional state for calendar view
  const [view, setView] = useState('timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAvailability, setShowAvailability] = useState(true);
  const [showAppointments, setShowAppointments] = useState(true);
  const [showTimeOff, setShowTimeOff] = useState(true);
  
  const { timeZone: userTimeZone } = useUserTimeZone(selectedClinicianId);
  const { userId } = useUser();
  
  // Declare these function definitions before they are used
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

  // Mock implementations for CRUD operations
  const createAvailability = async (event: CalendarEvent) => {
    try {
      return event; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error creating availability:', error);
      return null;
    }
  };

  const updateAvailability = async (event: CalendarEvent) => {
    try {
      return event; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error updating availability:', error);
      return null;
    }
  };

  const deleteAvailability = async (eventId: string) => {
    try {
      return true; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error deleting availability:', error);
      return false;
    }
  };

  const createAppointment = async (event: CalendarEvent) => {
    try {
      return event; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error creating appointment:', error);
      return null;
    }
  };

  const updateAppointment = async (event: CalendarEvent) => {
    try {
      return event; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error updating appointment:', error);
      return null;
    }
  };

  const deleteAppointment = async (eventId: string) => {
    try {
      return true; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error deleting appointment:', error);
      return false;
    }
  };

  const createTimeOff = async (event: CalendarEvent) => {
    try {
      return event; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error creating time off:', error);
      return null;
    }
  };

  const updateTimeOff = async (event: CalendarEvent) => {
    try {
      return event; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error updating time off:', error);
      return null;
    }
  };

  const deleteTimeOff = async (eventId: string) => {
    try {
      return true; // Mock implementation
    } catch (error) {
      console.error('[CalendarContext] Error deleting time off:', error);
      return false;
    }
  };

  const canEditAvailability = async (clinicianId: string) => {
    return userId === clinicianId;
  };

  const refreshEvents = useCallback(() => {
    getAvailabilityEvents();
    getAppointmentEvents();
    getTimeOffEvents();
  }, []);

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
    // Additional props for hooks
    events: {
      availability: availabilityEvents,
      appointments: appointmentEvents,
      timeOff: timeOffEvents
    },
    isLoading: {
      availability: availabilityLoading,
      appointments: appointmentLoading,
      timeOff: timeOffLoading
    },
    error: availabilityError || appointmentError || timeOffError,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    createTimeOff,
    updateTimeOff,
    deleteTimeOff,
    canEditAvailability,
    // Calendar view properties
    view,
    currentDate,
    setView,
    setCurrentDate,
    showAvailability,
    showAppointments,
    showTimeOff,
    setShowAvailability,
    setShowAppointments,
    setShowTimeOff,
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};
