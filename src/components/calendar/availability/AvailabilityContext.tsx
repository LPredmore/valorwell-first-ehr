import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CalendarService } from '@/services/calendarService';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { createWeeklyRule } from '@/utils/rruleUtils';
import { ICalendarEvent } from '@/types/calendar';

interface AvailabilityContextType {
  events: any[];
  isLoading: boolean;
  refreshEvents: () => void;
  addAvailabilitySlot: (dayIndex: number, startTime: string, endTime: string) => Promise<void>;
  updateAvailabilitySlot: (eventId: string, startTime: string, endTime: string) => Promise<void>;
  removeAvailabilitySlot: (eventId: string) => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextType | undefined>(undefined);

export const AvailabilityProvider: React.FC<{ clinicianId: string | null; children: React.ReactNode }> = ({ 
  clinicianId, 
  children 
}) => {
  const [userTimeZone, setUserTimeZone] = useState(getUserTimeZone());
  const { toast } = useToast();
  
  const {
    events,
    isLoading,
    refetch: refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCalendarEvents({
    clinicianId,
    userTimeZone,
    showAvailability: true
  });
  
  const addAvailabilitySlot = async (dayIndex: number, startTime: string, endTime: string) => {
    if (!clinicianId) {
      toast({
        title: "Error",
        description: "No clinician selected",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await CalendarService.addWeeklyAvailability(
        clinicianId,
        dayIndex,
        startTime,
        endTime,
        userTimeZone
      );
      
      toast({
        title: "Availability Added",
        description: "Weekly availability slot has been added",
      });
      
      refreshEvents();
    } catch (error) {
      console.error("Error adding availability slot:", error);
      toast({
        title: "Error",
        description: "Failed to add availability slot",
        variant: "destructive",
      });
    }
  };
  
  const updateAvailabilitySlot = async (eventId: string, startTime: string, endTime: string) => {
    if (!clinicianId) return;
    
    try {
      // Find the event to update
      const event = events.find(e => e.id === eventId);
      if (!event) {
        console.error("Event not found:", eventId);
        return;
      }
      
      // Create a date string from the event's start date
      const dateStr = event.start.toISOString().split('T')[0];
      
      // Create ISO datetime strings
      const startISO = `${dateStr}T${startTime}:00`;
      const endISO = `${dateStr}T${endTime}:00`;
      
      // Create an updated event object
      const updatedEvent: ICalendarEvent = {
        id: eventId,
        clinicianId,
        title: event.title,
        startTime: startISO,
        endTime: endISO,
        allDay: false,
        eventType: 'availability',
      };
      
      // If this is a recurring event, keep the recurrence rule
      if (event.extendedProps?.recurrenceRule) {
        updatedEvent.recurrenceRule = event.extendedProps.recurrenceRule;
      }
      
      // Update the event
      await updateEvent(updatedEvent);
      
      toast({
        title: "Availability Updated",
        description: "Availability slot has been updated",
      });
      
      refreshEvents();
    } catch (error) {
      console.error("Error updating availability slot:", error);
      toast({
        title: "Error",
        description: "Failed to update availability slot",
        variant: "destructive",
      });
    }
  };
  
  const removeAvailabilitySlot = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      
      toast({
        title: "Availability Removed",
        description: "Availability slot has been removed",
      });
      
      refreshEvents();
    } catch (error) {
      console.error("Error removing availability slot:", error);
      toast({
        title: "Error",
        description: "Failed to remove availability slot",
        variant: "destructive",
      });
    }
  };

  return (
    <AvailabilityContext.Provider
      value={{
        events,
        isLoading,
        refreshEvents,
        addAvailabilitySlot,
        updateAvailabilitySlot,
        removeAvailabilitySlot
      }}
    >
      {children}
    </AvailabilityContext.Provider>
  );
};

export const useAvailability = () => {
  const context = useContext(AvailabilityContext);
  if (context === undefined) {
    throw new Error('useAvailability must be used within an AvailabilityProvider');
  }
  return context;
};
