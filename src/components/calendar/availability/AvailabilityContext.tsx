
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { generateRRule, createWeeklyRule } from '@/utils/rruleUtils';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Fetch availability slots on init
  useEffect(() => {
    if (!clinicianId) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('clinician_id', clinicianId)
          .eq('is_active', true);

        if (error) throw error;

        // Convert availability data to calendar events
        const availabilityEvents: CalendarEvent[] = data.map(slot => {
          const dayOfWeek = parseInt(slot.day_of_week);
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          
          return {
            id: slot.id,
            title: `Available: ${slot.start_time} - ${slot.end_time}`,
            start: '', // Will be populated by FullCalendar
            end: '', // Will be populated by FullCalendar
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50',
            textColor: '#FFFFFF',
            display: 'block',
            extendedProps: {
              isAvailability: true,
              eventType: 'availability',
              availabilityBlock: {
                id: slot.id,
                type: 'weekly',
                dayOfWeek: dayOfWeek.toString(),
                startTime: slot.start_time,
                endTime: slot.end_time
              }
            }
          };
        });

        setEvents(availabilityEvents);
      } catch (e) {
        console.error('Error fetching availability:', e);
        setError(e instanceof Error ? e : new Error('Unknown error occurred'));
        toast({
          title: 'Failed to load availability',
          description: 'There was a problem fetching your availability slots.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [clinicianId, toast]);

  const addAvailabilitySlot = useCallback(async (dayIndex: number, startTime: string, endTime: string) => {
    if (!clinicianId) {
      throw new Error('No clinician selected');
    }

    setIsLoading(true);
    try {
      // Generate a new UUID for the slot
      const slotId = uuidv4();
      
      // Insert into availability table
      const { error } = await supabase
        .from('availability')
        .insert({
          id: slotId,
          clinician_id: clinicianId,
          day_of_week: dayIndex.toString(),
          start_time: startTime,
          end_time: endTime,
          is_active: true
        });

      if (error) throw error;

      // Add to local state
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const newEvent: CalendarEvent = {
        id: slotId,
        title: `Available: ${startTime} - ${endTime}`,
        start: '', // Will be populated by FullCalendar
        end: '', // Will be populated by FullCalendar
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
        textColor: '#FFFFFF',
        display: 'block',
        extendedProps: {
          isAvailability: true,
          eventType: 'availability',
          availabilityBlock: {
            id: slotId,
            type: 'weekly',
            dayOfWeek: dayIndex.toString(),
            startTime: startTime,
            endTime: endTime
          }
        }
      };

      setEvents(prev => [...prev, newEvent]);
      
      toast({
        title: 'Availability Added',
        description: `Added availability for ${dayNames[dayIndex]} from ${startTime} to ${endTime}`,
      });
    } catch (e) {
      console.error('Error adding availability slot:', e);
      setError(e instanceof Error ? e : new Error('Failed to add availability slot'));
      toast({
        title: 'Failed to Add Availability',
        description: 'There was a problem adding the availability slot.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [clinicianId, toast]);

  const removeAvailabilitySlot = useCallback(async (eventId: string) => {
    if (!clinicianId) {
      throw new Error('No clinician selected');
    }

    setIsLoading(true);
    try {
      // Delete from database
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      // Remove from local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast({
        title: 'Availability Removed',
        description: 'The availability slot has been removed.',
      });
    } catch (e) {
      console.error('Error removing availability slot:', e);
      setError(e instanceof Error ? e : new Error('Failed to remove availability slot'));
      toast({
        title: 'Failed to Remove Availability',
        description: 'There was a problem removing the availability slot.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [clinicianId, toast]);

  const updateAvailabilitySlot = useCallback(async (eventId: string, startTime: string, endTime: string) => {
    if (!clinicianId) {
      throw new Error('No clinician selected');
    }

    setIsLoading(true);
    try {
      // Update in database
      const { error } = await supabase
        .from('availability')
        .update({
          start_time: startTime,
          end_time: endTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;

      // Update in local state
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            title: `Available: ${startTime} - ${endTime}`,
            extendedProps: {
              ...event.extendedProps,
              availabilityBlock: {
                ...event.extendedProps?.availabilityBlock,
                startTime,
                endTime
              }
            }
          };
        }
        return event;
      }));
      
      toast({
        title: 'Availability Updated',
        description: `Updated availability time to ${startTime} - ${endTime}`,
      });
    } catch (e) {
      console.error('Error updating availability slot:', e);
      setError(e instanceof Error ? e : new Error('Failed to update availability slot'));
      toast({
        title: 'Failed to Update Availability',
        description: 'There was a problem updating the availability slot.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [clinicianId, toast]);

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
