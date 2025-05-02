import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

// Mock the necessary dependencies
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({
    userId: 'test-user-id',
    isLoading: false
  })
}));

import { CalendarService } from '../../services/calendar/CalendarService';
import { DateTime } from 'luxon';

// Mock dependencies
jest.mock('../../services/calendar/CalendarService', () => ({
  CalendarService: {
    getEvents: jest.fn()
  }
}));

// Mock context provider
const mockContextValue = {
  view: 'timeGridWeek',
  currentDate: DateTime.fromISO('2025-05-01T00:00:00.000Z'),
  selectedClinicianId: 'clinician-123',
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
  showAvailability: true,
  showAppointments: true,
  showTimeOff: true,
  setView: jest.fn(),
  setCurrentDate: jest.fn(),
  setSelectedClinicianId: jest.fn(),
  setShowAvailability: jest.fn(),
  setShowAppointments: jest.fn(),
  setShowTimeOff: jest.fn(),
  refreshEvents: jest.fn(),
  createAvailability: jest.fn(),
  updateAvailability: jest.fn(),
  deleteAvailability: jest.fn(),
  createAppointment: jest.fn(),
  updateAppointment: jest.fn(),
  deleteAppointment: jest.fn(),
  createTimeOff: jest.fn(),
  updateTimeOff: jest.fn(),
  deleteTimeOff: jest.fn()
};

jest.mock('../../context/CalendarContext', () => ({
  useCalendar: () => mockContextValue
}));

describe('useCalendarEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock CalendarService.getEvents
    (CalendarService.getEvents as jest.Mock).mockResolvedValue([
      {
        id: 'availability-123',
        title: 'Availability',
        start: new Date('2025-05-01T10:00:00.000Z'),
        end: new Date('2025-05-01T11:00:00.000Z'),
        extendedProps: {
          eventType: 'availability'
        }
      },
      {
        id: 'appointment-123',
        title: 'Appointment',
        start: new Date('2025-05-02T10:00:00.000Z'),
        end: new Date('2025-05-02T11:00:00.000Z'),
        extendedProps: {
          eventType: 'appointment'
        }
      },
      {
        id: 'timeoff-123',
        title: 'Time Off',
        start: new Date('2025-05-03T00:00:00.000Z'),
        end: new Date('2025-05-03T23:59:59.999Z'),
        extendedProps: {
          eventType: 'time_off'
        }
      }
    ]);
  });

  it('should return filtered events based on visibility settings', async () => {
    // Set up mock context with all event types visible
    mockContextValue.showAvailability = true;
    mockContextValue.showAppointments = true;
    mockContextValue.showTimeOff = true;
    
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Wait for the hook to update
    await waitForNextUpdate();
    
    // Should return all events
    expect(result.current.events).toHaveLength(3);
    
    // Update mock context to hide availability
    mockContextValue.showAvailability = false;
    
    // Re-render the hook
    const { result: result2, waitForNextUpdate: waitForNextUpdate2 } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Wait for the hook to update
    await waitForNextUpdate2();
    
    // Should return only appointments and time off
    expect(result2.current.events).toHaveLength(2);
    expect(result2.current.events.find(e => e.extendedProps.eventType === 'availability')).toBeUndefined();
    
    // Update mock context to hide appointments
    mockContextValue.showAvailability = true;
    mockContextValue.showAppointments = false;
    
    // Re-render the hook
    const { result: result3, waitForNextUpdate: waitForNextUpdate3 } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Wait for the hook to update
    await waitForNextUpdate3();
    
    // Should return only availability and time off
    expect(result3.current.events).toHaveLength(2);
    expect(result3.current.events.find(e => e.extendedProps.eventType === 'appointment')).toBeUndefined();
    
    // Update mock context to hide time off
    mockContextValue.showAppointments = true;
    mockContextValue.showTimeOff = false;
    
    // Re-render the hook
    const { result: result4, waitForNextUpdate: waitForNextUpdate4 } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Wait for the hook to update
    await waitForNextUpdate4();
    
    // Should return only availability and appointments
    expect(result4.current.events).toHaveLength(2);
    expect(result4.current.events.find(e => e.extendedProps.eventType === 'time_off')).toBeUndefined();
  });

  it('should handle loading state', async () => {
    // Set up mock context with loading state
    mockContextValue.isLoading.availability = true;
    mockContextValue.isLoading.appointments = true;
    mockContextValue.isLoading.timeOff = true;
    
    // Render the hook
    const { result } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Should be in loading state
    expect(result.current.isLoading).toBe(true);
    
    // Update mock context to finish loading
    mockContextValue.isLoading.availability = false;
    mockContextValue.isLoading.appointments = false;
    mockContextValue.isLoading.timeOff = false;
    
    // Re-render the hook
    const { result: result2 } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Should not be in loading state
    expect(result2.current.isLoading).toBe(false);
    
    // Update mock context to partial loading
    mockContextValue.isLoading.availability = false;
    mockContextValue.isLoading.appointments = true;
    mockContextValue.isLoading.timeOff = false;
    
    // Re-render the hook
    const { result: result3 } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Should still be in loading state if any type is loading
    expect(result3.current.isLoading).toBe(true);
  });

  it('should handle error state', async () => {
    // Set up mock context with no error
    mockContextValue.error = null;
    
    // Render the hook
    const { result } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Should not have an error
    expect(result.current.error).toBeNull();
    
    // Update mock context with an error
    mockContextValue.error = new Error('Failed to load events');
    
    // Re-render the hook
    const { result: result2 } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Should have an error
    expect(result2.current.error).not.toBeNull();
    expect(result2.current.error?.message).toBe('Failed to load events');
  });

  it('should handle date range changes', async () => {
    // Set up mock context with initial date
    mockContextValue.currentDate = DateTime.fromISO('2025-05-01T00:00:00.000Z');
    mockContextValue.view = 'timeGridWeek';
    
    // Render the hook
    const { result, waitForNextUpdate } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Wait for the hook to update
    await waitForNextUpdate();
    
    // Mock the dateRange property
    const dateRange = {
      start: DateTime.fromISO('2025-04-27T00:00:00.000Z'),
      end: DateTime.fromISO('2025-05-03T00:00:00.000Z')
    };
    
    // Update mock context to month view
    mockContextValue.view = 'dayGridMonth';
    
    // Re-render the hook
    const { result: result2, waitForNextUpdate: waitForNextUpdate2 } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Wait for the hook to update
    await waitForNextUpdate2();
    
    // Update mock context to day view
    mockContextValue.view = 'timeGridDay';
    
    // Re-render the hook
    const { result: result3, waitForNextUpdate: waitForNextUpdate3 } = renderHook(() => useCalendarEvents({
      clinicianId: 'clinician-123',
      userTimeZone: 'America/Chicago'
    }));
    
    // Wait for the hook to update
    await waitForNextUpdate3();
  });
});
