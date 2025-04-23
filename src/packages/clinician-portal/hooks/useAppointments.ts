import { useState, useEffect } from 'react';
import { supabase } from '@/packages/api/client';
import { useClientData } from '@/packages/core/hooks/useClientData';
import { useToast } from '@/packages/ui/toast';

export const useAppointments = (clinicianId?: string) => {
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentAppointment, setCurrentAppointment] = useState<any | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientData, setClientData] = useState<any | null>(null);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);
  const { toast } = useToast();

  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!clinicianId) {
          console.warn('Clinician ID is missing.');
          return;
        }

        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('clinician_id', clinicianId)
          .order('date', { ascending: true });

        if (error) {
          setError(error);
          console.error('Error fetching appointments:', error);
          toast({
            title: "Error",
            description: "Failed to fetch appointments.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          const todayAppointments = data.filter(appointment => appointment.date === todayFormatted);
          const upcomingAppointments = data.filter(appointment => appointment.date > todayFormatted);
          const pastAppointments = data.filter(appointment => appointment.date < todayFormatted);

          setTodayAppointments(todayAppointments);
          setUpcomingAppointments(upcomingAppointments);
          setPastAppointments(pastAppointments);
        }
      } catch (err: any) {
        setError(err);
        console.error('Unexpected error fetching appointments:', err);
        toast({
          title: "Error",
          description: "Unexpected error fetching appointments.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [clinicianId, todayFormatted, toast]);

  const refetch = () => {
    fetchAppointments();
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!clinicianId) {
        console.warn('Clinician ID is missing.');
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('date', { ascending: true });

      if (error) {
        setError(error);
        console.error('Error fetching appointments:', error);
        toast({
          title: "Error",
          description: "Failed to fetch appointments.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        const todayAppointments = data.filter(appointment => appointment.date === todayFormatted);
        const upcomingAppointments = data.filter(appointment => appointment.date > todayFormatted);
        const pastAppointments = data.filter(appointment => appointment.date < todayFormatted);

        setTodayAppointments(todayAppointments);
        setUpcomingAppointments(upcomingAppointments);
        setPastAppointments(pastAppointments);
      }
    } catch (err: any) {
      setError(err);
      console.error('Unexpected error fetching appointments:', err);
      toast({
        title: "Error",
        description: "Unexpected error fetching appointments.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVideoSession = async (appointment: any) => {
    setCurrentAppointment(appointment);
    setIsVideoOpen(true);
    setCurrentVideoUrl(appointment.video_url);
  };

  const closeVideoSession = () => {
    setIsVideoOpen(false);
    setCurrentVideoUrl(null);
  };

  const openSessionTemplate = async (appointment: any) => {
    setCurrentAppointment(appointment);
    setShowSessionTemplate(true);

    if (appointment && appointment.client_id) {
      setIsLoadingClientData(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', appointment.client_id)
          .single();

        if (error) {
          console.error("Error fetching client data:", error);
          toast({
            title: "Error",
            description: "Failed to fetch client data.",
            variant: "destructive",
          });
        } else {
          setClientData(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching client data:", err);
        toast({
          title: "Error",
          description: "Unexpected error fetching client data.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingClientData(false);
      }
    } else {
      console.warn('Client ID is missing from the appointment.');
      toast({
        title: "Warning",
        description: "Client ID is missing from the appointment.",
        variant: "warning",
      });
    }
  };

  const closeSessionTemplate = () => {
    setShowSessionTemplate(false);
    setCurrentAppointment(null);
    setClientData(null);
  };

  return {
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
