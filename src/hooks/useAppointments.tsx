
import { useState, useEffect } from 'react';
import { format, isToday, isFuture, parseISO, isBefore } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timeZoneService';

export interface Appointment {
  id: string;
  client_id: string;
  clinician_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  appointment_recurring?: string | null;
  recurring_group_id?: string | null;
  video_room_url?: string | null;
  notes?: string | null;
  client?: {
    client_first_name: string;
    client_last_name: string;
    client_preferred_name: string;
  };
}

export const useAppointments = (
  clinicianId: string | null,
  fromDate?: Date,
  toDate?: Date
) => {
  const { toast } = useToast();
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);

  // Format clinician ID if provided
  const formattedClinicianId = clinicianId ? clinicianId.trim() : null;

  // Fetch appointments
  const { 
    data: appointments = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['appointments', formattedClinicianId, fromDate, toDate],
    queryFn: async () => {
      if (!formattedClinicianId) {
        console.log('[useAppointments] Skipping appointment fetch - no clinicianId provided');
        return [];
      }
      
      console.log('[useAppointments] Fetching appointments for clinician:', formattedClinicianId);
      console.log('[useAppointments] Clinician ID type:', typeof formattedClinicianId);
      
      try {
        let query = supabase
          .from('appointments')
          .select(`
            id,
            client_id,
            clinician_id,
            date,
            start_time,
            end_time,
            type,
            status,
            appointment_recurring,
            recurring_group_id,
            video_room_url,
            notes,
            clients (
              client_first_name,
              client_last_name,
              client_preferred_name
            )
          `)
          .eq('clinician_id', formattedClinicianId);
        
        if (fromDate) {
          query = query.gte('date', format(fromDate, 'yyyy-MM-dd'));
        }
        
        if (toDate) {
          query = query.lte('date', format(toDate, 'yyyy-MM-dd'));
        }
        
        const { data, error } = await query
          .order('date')
          .order('start_time');

        if (error) {
          console.error('[useAppointments] Error fetching appointments:', error);
          throw error;
        }

        // Check if we actually got data back
        if (!data || data.length === 0) {
          console.log('[useAppointments] No appointments found for clinician:', formattedClinicianId);
          return [];
        }

        const processedAppointments = data.map((appointment: any) => ({
          ...appointment,
          client: appointment.clients
        }));
        
        console.log(`[useAppointments] Retrieved ${processedAppointments.length} appointments for clinician ${formattedClinicianId}`, processedAppointments);
        
        // Log the first appointment for debugging
        if (processedAppointments.length > 0) {
          const firstAppointment = processedAppointments[0];
          console.log('[useAppointments] Example appointment:', {
            id: firstAppointment.id,
            date: firstAppointment.date,
            time: `${firstAppointment.start_time} - ${firstAppointment.end_time}`,
            clinicianId: firstAppointment.clinician_id,
            clientId: firstAppointment.client_id,
            client: firstAppointment.client ? 
              `${firstAppointment.client.client_preferred_name || ''} ${firstAppointment.client.client_last_name || ''}` : 
              'Unknown client'
          });
        }
        
        return processedAppointments;
      } catch (err) {
        console.error('[useAppointments] Unexpected error in appointment fetch:', err);
        throw err;
      }
    },
    enabled: !!formattedClinicianId
  });

  // Get today's appointments
  const todayAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isToday(appointmentDate);
  }) || [];

  // Get upcoming appointments
  const upcomingAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isFuture(appointmentDate) && !isToday(appointmentDate);
  }) || [];

  // Get past appointments
  const pastAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isBefore(appointmentDate, new Date()) && 
           !isToday(appointmentDate) && 
           appointment.status === "scheduled";
  }) || [];

  // Create a new appointment
  const createAppointment = async (appointmentData: Partial<Appointment>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create appointment. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  // Create recurring appointments
  const createRecurringAppointments = async (
    baseAppointment: Partial<Appointment>,
    recurrenceType: string,
    count: number
  ) => {
    try {
      const recurringGroupId = crypto.randomUUID();
      const appointments = [];
      
      // Create the base date from the appointment date
      let currentDate = parseISO(baseAppointment.date as string);
      
      for (let i = 0; i < count; i++) {
        // For the first appointment, use the base date
        // For subsequent appointments, calculate the next date
        const appointmentDate = i === 0 
          ? currentDate 
          : getNextRecurringDate(currentDate, recurrenceType);
        
        // Update current date for next iteration
        currentDate = appointmentDate;
        
        appointments.push({
          ...baseAppointment,
          date: format(appointmentDate, 'yyyy-MM-dd'),
          appointment_recurring: recurrenceType,
          recurring_group_id: recurringGroupId
        });
      }
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointments)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating recurring appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to create recurring appointments. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  // Helper function to calculate the next date based on recurrence type
  const getNextRecurringDate = (date: Date, recurrenceType: string): Date => {
    const newDate = new Date(date);
    
    switch (recurrenceType) {
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'biweekly':
        newDate.setDate(newDate.getDate() + 14);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      default:
        newDate.setDate(newDate.getDate() + 7); // Default to weekly
    }
    
    return newDate;
  };

  // Update an appointment
  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  // Update recurring appointments
  const updateRecurringAppointments = async (
    appointmentId: string,
    recurringGroupId: string,
    updates: Partial<Appointment>,
    updateMode: 'single' | 'future' | 'all'
  ) => {
    try {
      let query = supabase
        .from('appointments')
        .update(updates);
      
      if (updateMode === 'single') {
        // Update only this appointment
        query = query.eq('id', appointmentId);
      } else if (updateMode === 'future') {
        // Update this and all future appointments in the series
        const appointment = appointments.find(a => a.id === appointmentId);
        if (!appointment) {
          throw new Error('Appointment not found');
        }
        
        query = query
          .eq('recurring_group_id', recurringGroupId)
          .gte('date', appointment.date);
      } else {
        // Update all appointments in the series
        query = query.eq('recurring_group_id', recurringGroupId);
      }
      
      const { data, error } = await query.select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating recurring appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointments. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  // Delete an appointment
  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete appointment. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  // Delete recurring appointments
  const deleteRecurringAppointments = async (
    appointmentId: string,
    recurringGroupId: string,
    deleteMode: 'single' | 'future' | 'all'
  ) => {
    try {
      let query = supabase
        .from('appointments')
        .delete();
      
      if (deleteMode === 'single') {
        // Delete only this appointment
        query = query.eq('id', appointmentId);
      } else if (deleteMode === 'future') {
        // Delete this and all future appointments in the series
        const appointment = appointments.find(a => a.id === appointmentId);
        if (!appointment) {
          throw new Error('Appointment not found');
        }
        
        query = query
          .eq('recurring_group_id', recurringGroupId)
          .gte('date', appointment.date);
      } else {
        // Delete all appointments in the series
        query = query.eq('recurring_group_id', recurringGroupId);
      }
      
      const { error } = await query;

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting recurring appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete appointments. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  // Fetch client data for a specific appointment
  const fetchClientData = async (clientId: string) => {
    setIsLoadingClientData(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      setClientData(data);
      return data;
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client information.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoadingClientData(false);
    }
  };

  // Start a video session for an appointment
  const startVideoSession = async (appointment: Appointment) => {
    try {
      console.log("Starting video session for appointment:", appointment.id);
      
      if (appointment.video_room_url) {
        console.log("Using existing video room URL:", appointment.video_room_url);
        setCurrentVideoUrl(appointment.video_room_url);
        setCurrentAppointment(appointment);
        setIsVideoOpen(true);
      } else {
        console.log("Creating new video room for appointment:", appointment.id);
        const result = await getOrCreateVideoRoom(appointment.id);
        console.log("Video room creation result:", result);
        
        if (result.success && result.url) {
          setCurrentVideoUrl(result.url);
          setCurrentAppointment(appointment);
          setIsVideoOpen(true);
          refetch();
        } else {
          console.error("Failed to create video room:", result.error);
          throw new Error('Failed to create video room');
        }
      }
    } catch (error) {
      console.error('Error starting video session:', error);
      toast({
        title: 'Error',
        description: 'Could not start the video session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const closeVideoSession = () => {
    setIsVideoOpen(false);
    setCurrentAppointment(null);
  };

  // Open session template for documentation
  const openSessionTemplate = async (appointment: Appointment) => {
    try {
      // Fetch client data if needed
      if (!clientData || clientData.id !== appointment.client_id) {
        await fetchClientData(appointment.client_id);
      }
      setCurrentAppointment(appointment);
      setShowSessionTemplate(true);
    } catch (error) {
      console.error('Error opening session template:', error);
      toast({
        title: 'Error',
        description: 'Could not load the session template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Close session template
  const closeSessionTemplate = () => {
    setShowSessionTemplate(false);
    setCurrentAppointment(null);
  };

  return {
    appointments,
    todayAppointments,
    upcomingAppointments,
    pastAppointments,
    isLoading,
    error,
    refetch,
    currentAppointment,
    isVideoOpen,
    currentVideoUrl,
    showSessionTemplate,
    clientData,
    isLoadingClientData,
    createAppointment,
    createRecurringAppointments,
    updateAppointment,
    updateRecurringAppointments,
    deleteAppointment,
    deleteRecurringAppointments,
    startVideoSession,
    openSessionTemplate,
    closeSessionTemplate,
    closeVideoSession
  };
};
