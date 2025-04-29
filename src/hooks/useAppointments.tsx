import { useState, useEffect } from 'react';
import { format, isToday, isFuture, parseISO, isBefore } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTimeZone } from '@/context/TimeZoneContext';
import { AppointmentType } from '@/types/appointment';
import { getAppointmentsInUserTimeZone } from '@/utils/appointmentUtils';

export type { AppointmentType };

export const useAppointments = (userId: string | null) => {
  const { toast } = useToast();
  const { userTimeZone } = useTimeZone();
  const [currentAppointment, setCurrentAppointment] = useState<AppointmentType | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);

  const { data: appointments, isLoading, error, refetch } = useQuery({
    queryKey: ['clinician-appointments', userId, userTimeZone],
    queryFn: async () => {
      if (!userId) {
        console.log('[useAppointments] No userId provided, returning empty appointments array');
        return [];
      }
      
      console.log(`[useAppointments] Fetching appointments for clinician ID: "${userId}" with timezone: ${userTimeZone}`);
      
      try {
        const { data, error } = await supabase
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
            video_room_url,
            appointment_datetime,
            appointment_end_datetime,
            source_time_zone,
            clients (
              client_first_name,
              client_last_name
            )
          `)
          .eq('clinician_id', userId)
          .order('date')
          .order('start_time');

        if (error) {
          console.error('[useAppointments] Error fetching appointments:', error);
          throw error;
        }

        console.log(`[useAppointments] Retrieved ${data?.length || 0} appointments for clinician ID: "${userId}"`);
        
        // Convert appointments to user's time zone
        const appointmentsWithClient = data.map((appointment: any) => ({
          ...appointment,
          client: appointment.clients
        })) as AppointmentType[];
        
        // Apply time zone conversion to all appointments
        const convertedAppointments = getAppointmentsInUserTimeZone(appointmentsWithClient, userTimeZone);
        console.log(`[useAppointments] Converted ${convertedAppointments.length} appointments to timezone: ${userTimeZone}`);
        
        return convertedAppointments;
      } catch (error) {
        console.error('[useAppointments] Exception in appointment fetching:', error);
        throw error;
      }
    },
    enabled: !!userId && !!userTimeZone
  });

  useEffect(() => {
    console.log(`[useAppointments] Appointments data updated. Count: ${appointments?.length || 0}`);
  }, [appointments]);

  const todayAppointments = appointments?.filter(appointment => {
    // Use display_date if available (time zone converted), otherwise fall back to date
    const dateToUse = appointment.display_date || appointment.date;
    const appointmentDate = parseISO(dateToUse);
    return isToday(appointmentDate);
  }) || [];

  const upcomingAppointments = appointments?.filter(appointment => {
    // Use display_date if available (time zone converted), otherwise fall back to date
    const dateToUse = appointment.display_date || appointment.date;
    const appointmentDate = parseISO(dateToUse);
    return isFuture(appointmentDate) && !isToday(appointmentDate);
  }) || [];

  const pastAppointments = appointments?.filter(appointment => {
    // Use display_date if available (time zone converted), otherwise fall back to date
    const dateToUse = appointment.display_date || appointment.date;
    const appointmentDate = parseISO(dateToUse);
    return isBefore(appointmentDate, new Date()) && 
           !isToday(appointmentDate) && 
           appointment.status === "scheduled";
  }) || [];

  const startVideoSession = async (appointment: AppointmentType) => {
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

  const openSessionTemplate = async (appointment: AppointmentType) => {
    if (!appointment || !appointment.clientId) {
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
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', appointment.clientId || appointment.client_id)
        .single();
        
      if (error) {
        throw error;
      }
      
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
