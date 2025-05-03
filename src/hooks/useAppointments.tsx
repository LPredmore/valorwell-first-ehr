import { useState, useEffect } from 'react';
import { format, isToday, isFuture, parseISO, isBefore } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTimeZone } from '@/context/TimeZoneContext';
import { AppointmentType } from '@/types/appointment';
import { getAppointmentsInUserTimeZone } from '@/utils/appointmentUtils';
import { formatClientName } from '@/utils/clientDataUtils';
import { appointmentService } from '@/services/appointmentService';

export type { AppointmentType };

// Define a base appointment type that matches what getAppointmentsInUserTimeZone expects
interface LocalBaseAppointment {
  id: string;
  clientId?: string;
  clientName: string;
  startTime: string;
  endTime: string;
  date: string;
  status: string;
  location: string;
  type?: string;
  // Add other required fields here
}

export const useAppointments = (userId: string | null) => {
  const { toast } = useToast();
  const { userTimeZone } = useTimeZone();
  const [currentAppointment, setCurrentAppointment] = useState<AppointmentType | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

        // Transform the data to match the expected BaseAppointment type
        const transformedData: LocalBaseAppointment[] = (data || []).map(item => ({
          id: item.id,
          clientId: item.client_id,
          clientName: item.clients?.[0] ? `${item.clients[0].client_first_name} ${item.clients[0].client_last_name}` : 'Unknown',
          startTime: item.start_time,
          endTime: item.end_time,
          date: item.date,
          status: item.status || 'scheduled',
          type: item.type,
          location: 'Virtual', // Ensure location is always provided
          video_room_url: item.video_room_url,
          appointment_datetime: item.appointment_datetime,
          appointment_end_datetime: item.appointment_end_datetime,
          source_time_zone: item.source_time_zone
        }));

        console.log(`[useAppointments] Retrieved ${transformedData.length} appointments`);
        return getAppointmentsInUserTimeZone(transformedData, userTimeZone);
      } catch (err) {
        console.error('[useAppointments] Error in queryFn:', err);
        throw err;
      }
    },
    enabled: !!userId
  });

  const startVideoSession = async (appointment: AppointmentType) => {
    try {
      console.log('[useAppointments] Starting video session for appointment:', appointment);
      
      setIsUpdating(true);
      setCurrentAppointment(appointment);
      
      let roomUrl = appointment.video_room_url;
      
      if (!roomUrl) {
        console.log('[useAppointments] No video room URL found, creating a new room');
        const result = await getOrCreateVideoRoom(appointment.id);
        console.log('[useAppointments] Created video room:', result);
        
        if (result && typeof result === 'object' && result.url) {
          roomUrl = result.url;
          // Update the appointment with the new room URL
          const { error: updateError } = await supabase
            .from('appointments')
            .update({ video_room_url: roomUrl })
            .eq('id', appointment.id);
            
          if (updateError) {
            console.error('[useAppointments] Error updating appointment with video room URL:', updateError);
            throw updateError;
          }
        } else {
          throw new Error('Failed to create video room');
        }
      }
      
      // Fix null safety issue with non-null assertion
      setCurrentVideoUrl(roomUrl || '');
      setIsVideoOpen(true);
      
    } catch (err) {
      console.error('[useAppointments] Error starting video session:', err);
      toast({
        title: 'Error',
        description: 'Failed to start video session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openSessionTemplate = async (appointment: AppointmentType) => {
    try {
      console.log('[useAppointments] Opening session template for appointment:', appointment);
      setCurrentAppointment(appointment);
      setShowSessionTemplate(true);
      
      // Fetch client data if we need it
      if (appointment.client_id) {
        setIsLoadingClientData(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', appointment.client_id)
          .single();
          
        if (error) {
          console.error('[useAppointments] Error fetching client data:', error);
          throw error;
        }
        
        if (data) {
          console.log('[useAppointments] Retrieved client data:', data);
          setClientData(data);
        }
      }
    } catch (err) {
      console.error('[useAppointments] Error opening session template:', err);
      toast({
        title: 'Error',
        description: 'Failed to open session template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingClientData(false);
    }
  };

  const closeSessionTemplate = () => {
    setShowSessionTemplate(false);
    setCurrentAppointment(null);
    refetch();
  };

  const closeVideoSession = () => {
    setIsVideoOpen(false);
    setCurrentVideoUrl('');
    refetch();
  };

  return {
    appointments,
    todayAppointments: appointments?.filter(appt => isToday(parseISO(appt.date))) || [],
    upcomingAppointments: appointments?.filter(appt => 
      isFuture(parseISO(appt.date)) && !isToday(parseISO(appt.date))
    ).slice(0, 5) || [],
    pastAppointments: appointments?.filter(appt => 
      !isFuture(parseISO(appt.date)) && !isToday(parseISO(appt.date)) && appt.status !== 'completed'
    ).slice(0, 5) || [],
    isLoading,
    isUpdating,
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
