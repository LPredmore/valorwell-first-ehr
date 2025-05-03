import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppointmentDetail } from '@/types/appointment';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timezone';

export function useAppointments(clinicianId: string | null) {
  const [todayAppointments, setTodayAppointments] = useState<AppointmentDetail[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentDetail[]>([]);
  const [pastAppointments, setPastAppointments] = useState<AppointmentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentAppointment, setCurrentAppointment] = useState<AppointmentDetail | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!clinicianId) return;

    try {
      setIsLoading(true);
      setError(null);

      const today = DateTime.now().setZone('utc').toFormat('yyyy-MM-dd');

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('appointment_datetime', { ascending: true });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        setError(appointmentsError);
        return;
      }

      const todayAppts: AppointmentDetail[] = [];
      const upcomingAppts: AppointmentDetail[] = [];
      const pastAppts: AppointmentDetail[] = [];

      appointments.forEach((appointment: any) => {
        const appointmentDate = DateTime.fromISO(appointment.appointment_datetime, { zone: 'utc' }).toFormat('yyyy-MM-dd');

        if (appointmentDate === today) {
          todayAppts.push(appointment);
        } else if (DateTime.fromISO(appointment.appointment_datetime, { zone: 'utc' }) > DateTime.now().setZone('utc')) {
          upcomingAppts.push(appointment);
        } else {
          pastAppts.push(appointment);
        }
      });

      setTodayAppointments(todayAppts);
      setUpcomingAppointments(upcomingAppts);
      setPastAppointments(pastAppts);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
      setError(error instanceof Error ? error : new Error('An unexpected error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [clinicianId]);

  useEffect(() => {
    if (clinicianId) {
      fetchAppointments();
    }
  }, [clinicianId, fetchAppointments]);

  const openSessionTemplate = useCallback(async (appointment: AppointmentDetail) => {
    setCurrentAppointment(appointment);
    setIsLoadingClientData(true);
    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', appointment.client_id)
        .single();

      if (clientError) {
        console.error('Error fetching client data:', clientError);
        setError(clientError);
        return;
      }
      setClientData(client);
    } catch (error) {
      console.error('Error in openSessionTemplate:', error);
      setError(error instanceof Error ? error : new Error('An unexpected error occurred'));
    } finally {
      setIsLoadingClientData(false);
      setShowSessionTemplate(true);
    }
  }, [setCurrentAppointment, setShowSessionTemplate, setClientData]);

  const closeSessionTemplate = useCallback(() => {
    setShowSessionTemplate(false);
    setCurrentAppointment(null);
    setClientData(null);
  }, [setShowSessionTemplate, setCurrentAppointment, setClientData]);

  const closeVideoSession = useCallback(() => {
    setIsVideoOpen(false);
    setCurrentVideoUrl('');
  }, [setIsVideoOpen, setCurrentVideoUrl]);

  const startVideoSession = useCallback(async (appointment: AppointmentDetail) => {
    try {
      setCurrentAppointment(appointment);
      setIsVideoOpen(true);

      const appointmentId = appointment?.id;

      if (!appointmentId) {
        console.error('Appointment ID is missing');
        return;
      }
      
      const { data: result } = await supabase.rpc('get_or_create_video_room', { appointment_id: appointmentId });
      
      if (result) {
        const videoUrl = result.video_room_url || '';
        setCurrentVideoUrl(videoUrl);
        console.log('Video URL:', videoUrl);
      } else {
        console.error('Failed to get or create video room');
      }
    } catch (error) {
      console.error('Error starting video session:', error);
      setError(error instanceof Error ? error : new Error('An unexpected error occurred'));
      setIsVideoOpen(false);
    }
  }, [currentAppointment, setIsVideoOpen, setCurrentVideoUrl]);

  return {
    todayAppointments,
    upcomingAppointments,
    pastAppointments,
    isLoading,
    error,
    refetch: fetchAppointments,
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
}
