import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import this to make toHaveTextContent available
import { CalendarProvider, useCalendar } from '../../context/CalendarContext';
import { CalendarService } from '../../services/calendar/CalendarService';
import { DateTime } from 'luxon';

// Mock dependencies
jest.mock('../../services/calendar/CalendarService', () => ({
  CalendarService: {
    getEvents: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn()
  }
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123' },
    isLoading: false
  }))
}));

// Test component that uses the calendar context
const TestComponent = () => {
  const {
    view,
    currentDate,
    selectedClinicianId,
    events,
    isLoading,
    error,
    showAvailability,
    showAppointments,
    showTimeOff,
    setView,
    setCurrentDate,
    setSelectedClinicianId,
    setShowAvailability,
    setShowAppointments,
    setShowTimeOff,
    refreshEvents
  } = useCalendar();

  return (
    <div>
      <div data-testid="view">{view}</div>
      <div data-testid="current-date">{currentDate.toISO()}</div>
      <div data-testid="clinician-id">{selectedClinicianId || 'none'}</div>
      <div data-testid="availability-count">{events.availability.length}</div>
      <div data-testid="appointments-count">{events.appointments.length}</div>
      <div data-testid="timeoff-count">{events.timeOff.length}</div>
      <div data-testid="loading-availability">{isLoading.availability.toString()}</div>
      <div data-testid="loading-appointments">{isLoading.appointments.toString()}</div>
      <div data-testid="loading-timeoff">{isLoading.timeOff.toString()}</div>
      <div data-testid="error">{error ? error.message : 'no error'}</div>
      <div data-testid="show-availability">{showAvailability.toString()}</div>
      <div data-testid="show-appointments">{showAppointments.toString()}</div>
      <div data-testid="show-timeoff">{showTimeOff.toString()}</div>
      
      <button onClick={() => setView('timeGridDay')}>Set Day View</button>
      <button onClick={() => setCurrentDate(DateTime.fromISO('2025-06-01T00:00:00.000Z'))}>Set Date</button>
      <button onClick={() => setSelectedClinicianId('clinician-456')}>Set Clinician</button>
      <button onClick={() => setShowAvailability(false)}>Hide Availability</button>
      <button onClick={() => setShowAppointments(false)}>Hide Appointments</button>
      <button onClick={() => setShowTimeOff(false)}>Hide Time Off</button>
      <button onClick={() => refreshEvents()}>Refresh Events</button>
    </div>
  );
};

describe('CalendarContext', () => {
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

  it('should provide initial state', async () => {
    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );
    
    // Default view should be timeGridWeek
    expect(screen.getByTestId('view')).toHaveTextContent('timeGridWeek');
    
    // Default filters should be true
    expect(screen.getByTestId('show-availability')).toHaveTextContent('true');
    expect(screen.getByTestId('show-appointments')).toHaveTextContent('true');
    expect(screen.getByTestId('show-timeoff')).toHaveTextContent('true');
    
    // Loading states should be false after initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading-availability')).toHaveTextContent('false');
      expect(screen.getByTestId('loading-appointments')).toHaveTextContent('false');
      expect(screen.getByTestId('loading-timeoff')).toHaveTextContent('false');
    });
    
    // Events should be loaded and categorized
    await waitFor(() => {
      expect(screen.getByTestId('availability-count')).toHaveTextContent('1');
      expect(screen.getByTestId('appointments-count')).toHaveTextContent('1');
      expect(screen.getByTestId('timeoff-count')).toHaveTextContent('1');
    });
  });

  it('should update view state', async () => {
    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );
    
    // Initial view should be timeGridWeek
    expect(screen.getByTestId('view')).toHaveTextContent('timeGridWeek');
    
    // Change view to day
    act(() => {
      screen.getByText('Set Day View').click();
    });
    
    // View should be updated
    expect(screen.getByTestId('view')).toHaveTextContent('timeGridDay');
  });

  it('should update current date', async () => {
    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );
    
    // Get initial date
    const initialDate = screen.getByTestId('current-date').textContent;
    
    // Change date
    act(() => {
      screen.getByText('Set Date').click();
    });
    
    // Date should be updated
    const newDate = screen.getByTestId('current-date').textContent;
    expect(newDate).not.toBe(initialDate);
    expect(newDate).toContain('2025-06-01');
  });

  it('should update selected clinician', async () => {
    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );
    
    // Initial clinician should be none
    expect(screen.getByTestId('clinician-id')).toHaveTextContent('none');
    
    // Change clinician
    act(() => {
      screen.getByText('Set Clinician').click();
    });
    
    // Clinician should be updated
    expect(screen.getByTestId('clinician-id')).toHaveTextContent('clinician-456');
    
    // Should trigger a refresh of events
    await waitFor(() => {
      expect(CalendarService.getEvents).toHaveBeenCalledWith(
        'clinician-456',
        expect.any(String),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  it('should update filter settings', async () => {
    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );
    
    // Initial filters should be true
    expect(screen.getByTestId('show-availability')).toHaveTextContent('true');
    expect(screen.getByTestId('show-appointments')).toHaveTextContent('true');
    expect(screen.getByTestId('show-timeoff')).toHaveTextContent('true');
    
    // Hide availability
    act(() => {
      screen.getByText('Hide Availability').click();
    });
    
    // Availability filter should be updated
    expect(screen.getByTestId('show-availability')).toHaveTextContent('false');
    expect(screen.getByTestId('show-appointments')).toHaveTextContent('true');
    expect(screen.getByTestId('show-timeoff')).toHaveTextContent('true');
    
    // Hide appointments
    act(() => {
      screen.getByText('Hide Appointments').click();
    });
    
    // Appointments filter should be updated
    expect(screen.getByTestId('show-availability')).toHaveTextContent('false');
    expect(screen.getByTestId('show-appointments')).toHaveTextContent('false');
    expect(screen.getByTestId('show-timeoff')).toHaveTextContent('true');
    
    // Hide time off
    act(() => {
      screen.getByText('Hide Time Off').click();
    });
    
    // Time off filter should be updated
    expect(screen.getByTestId('show-availability')).toHaveTextContent('false');
    expect(screen.getByTestId('show-appointments')).toHaveTextContent('false');
    expect(screen.getByTestId('show-timeoff')).toHaveTextContent('false');
  });

  it('should refresh events', async () => {
    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );
    
    // Clear previous calls
    (CalendarService.getEvents as jest.Mock).mockClear();
    
    // Refresh events
    act(() => {
      screen.getByText('Refresh Events').click();
    });
    
    // Should call CalendarService.getEvents
    await waitFor(() => {
      expect(CalendarService.getEvents).toHaveBeenCalled();
    });
    
    // Loading states should be updated during refresh
    await waitFor(() => {
      expect(screen.getByTestId('loading-availability')).toHaveTextContent('true');
      expect(screen.getByTestId('loading-appointments')).toHaveTextContent('true');
      expect(screen.getByTestId('loading-timeoff')).toHaveTextContent('true');
    });
    
    // Loading states should be false after refresh
    await waitFor(() => {
      expect(screen.getByTestId('loading-availability')).toHaveTextContent('false');
      expect(screen.getByTestId('loading-appointments')).toHaveTextContent('false');
      expect(screen.getByTestId('loading-timeoff')).toHaveTextContent('false');
    });
  });

  it('should handle errors', async () => {
    // Mock CalendarService.getEvents to throw an error
    (CalendarService.getEvents as jest.Mock).mockRejectedValue(new Error('Failed to load events'));
    
    render(
      <CalendarProvider>
        <TestComponent />
      </CalendarProvider>
    );
    
    // Error should be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load events');
    });
    
    // Loading states should be false after error
    await waitFor(() => {
      expect(screen.getByTestId('loading-availability')).toHaveTextContent('false');
      expect(screen.getByTestId('loading-appointments')).toHaveTextContent('false');
      expect(screen.getByTestId('loading-timeoff')).toHaveTextContent('false');
    });
  });
});
