
import { useState, useEffect } from 'react';
import { format, isToday, isFuture, parseISO, isBefore } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';

export interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  video_room_url: string | null;
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
}

export const useAppointments = (userId: string | null) => {
  const { toast } = useToast();
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);

  const { data: appointments, isLoading, error, refetch } = useQuery({
    queryKey: ['clinician-appointments', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('Fetching appointments for clinician:', userId);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          date,
          start_time,
          end_time,
          type,
          status,
          video_room_url,
          clients (
            client_first_name,
            client_last_name
          )
        `)
        .eq('clinician_id', userId)
        .order('date')
        .order('start_time');

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      return data.map((appointment: any) => ({
        ...appointment,
        client: appointment.clients
      }));
    },
    enabled: !!userId
  });

  // Filter appointments based on date - using UTC date comparison
  const todayAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isToday(appointmentDate);
  }) || [];

  const upcomingAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isFuture(appointmentDate) && !isToday(appointmentDate);
  }) || [];

  const pastAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isBefore(appointmentDate, new Date()) && !isToday(appointmentDate);
  }) || [];

  const startVideoSession = async (appointment: Appointment) => {
    try {
      console.log("Starting video session for appointment:", appointment.id);
      
      if (appointment.video_room_url) {
        console.log("Using existing video room URL:", appointment.video_room_url);
        setCurrentVideoUrl(appointment.video_room_url);
        setIsVideoOpen(true);
      } else {
        console.log("Creating new video room for appointment:", appointment.id);
        const result = await getOrCreateVideoRoom(appointment.id);
        console.log("Video room creation result:", result);
        
        if (result.success && result.url) {
          setCurrentVideoUrl(result.url);
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

  // New function to fetch client data and open session template directly
  const openSessionTemplate = async (appointment: Appointment) => {
    if (!appointment || !appointment.client_id) {
      toast({
        title: 'Error',
        description: 'Could not find client information for this appointment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoadingClientData(true);
      setCurrentAppointment(appointment);
      
      // Fetch full client data
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', appointment.client_id)
        .single();
        
      if (error) {
        throw error;
      }
      
      // Set client data and show session template
      setClientData(data);
      setShowSessionTemplate(true);
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: 'Error',
        description: 'Could not load client information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingClientData(false);
    }
  };

  const closeSessionTemplate = () => {
    setShowSessionTemplate(false);
    setClientData(null);
    setCurrentAppointment(null);
  };

  const closeVideoSession = () => {
    setIsVideoOpen(false);
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
    startVideoSession,
    openSessionTemplate,
    closeSessionTemplate,
    closeVideoSession
  };
};
