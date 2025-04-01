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
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);

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

  const openDocumentDialog = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setIsDocumentDialogOpen(true);
    setSelectedStatus(undefined);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    if (value === 'occurred') {
      setIsDocumentDialogOpen(false);
      setShowSessionTemplate(true);
    }
  };

  const handleProvideDocumentation = async () => {
    if (!currentAppointment || !selectedStatus || selectedStatus === 'occurred') return;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'Documented',
          type: selectedStatus === 'no-show' ? 'Late Cancel/No Show' : 'Cancelled'
        })
        .eq('id', currentAppointment.id);
      
      if (error) {
        console.error('Error updating appointment:', error);
        toast({
          title: 'Error',
          description: 'Could not update appointment status. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'Appointment has been documented successfully.',
      });
      
      setIsDocumentDialogOpen(false);
      setSelectedStatus(undefined);
      refetch();
      
    } catch (error) {
      console.error('Error in handleProvideDocumentation:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const closeSessionTemplate = () => {
    setShowSessionTemplate(false);
    setSelectedStatus(undefined);
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
    isDocumentDialogOpen,
    selectedStatus,
    showSessionTemplate,
    startVideoSession,
    openDocumentDialog,
    handleStatusChange,
    handleProvideDocumentation,
    closeSessionTemplate,
    closeVideoSession,
    setIsDocumentDialogOpen
  };
};
