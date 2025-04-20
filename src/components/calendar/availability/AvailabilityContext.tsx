
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { generateRRule, createWeeklyRule } from '@/utils/rruleUtils';

interface AvailabilityContextType {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  showAvailabilityPanel: boolean;
  addAvailabilitySlot: (dayIndex: number, startTime: string, endTime: string) => Promise<void>;
  removeAvailabilitySlot: (eventId: string) => Promise<void>;
  updateAvailabilitySlot: (eventId: string, startTime: string, endTime: string) => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextType | null>(null);

export const useAvailability = () => {
  const context = useContext(AvailabilityContext);
  if (!context) {
    throw new Error('useAvailability must be used within an AvailabilityProvider');
  }
  return context;
};

interface AvailabilityProviderProps {
  children: React.ReactNode;
  clinicianId: string | null;
}

export const AvailabilityProvider: React.FC<AvailabilityProviderProps> = ({ children, clinicianId }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showAvailabilityPanel, setShowAvailabilityPanel] = useState(false);

  const addAvailabilitySlot = useCallback(async (dayIndex: number, startTime: string, endTime: string) => {
    // Implementation
  }, [clinicianId]);

  const removeAvailabilitySlot = useCallback(async (eventId: string) => {
    // Implementation
  }, [clinicianId]);

  const updateAvailabilitySlot = useCallback(async (eventId: string, startTime: string, endTime: string) => {
    // Implementation
  }, [clinicianId]);

  const value = {
    events,
    isLoading,
    error,
    showAvailabilityPanel,
    addAvailabilitySlot,
    removeAvailabilitySlot,
    updateAvailabilitySlot,
  };

  return (
    <AvailabilityContext.Provider value={value}>
      {children}
    </AvailabilityContext.Provider>
  );
};
