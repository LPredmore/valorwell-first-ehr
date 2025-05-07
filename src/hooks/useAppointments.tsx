
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment';

// Define the structure of the raw appointment data from Supabase
interface RawSupabaseAppointment {
  id: string;
  client_id: string;
  clinician_id: string;
  start_at: string;
  end_at: string;
  type: string;
  status: string;
  appointment_recurring: string | null;
  recurring_group_id: string | null;
  video_room_url: string | null;
  notes: string | null;
  // Supabase returns joined clients as a direct object, not an array
  clients: {
    client_first_name: string | null;
    client_last_name: string | null;
    client_preferred_name: string | null;
  } | null;
}

export const useAppointments = (
  clinicianId: string | null,
  fromDate?: Date,
  toDate?: Date,
  timeZone: string = TimeZoneService.DEFAULT_TIMEZONE
) => {
  const { toast } = useToast();
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientData, setClientData] = useState<Record<string, any> | null>(null);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);

  // Format clinician ID if provided
  const formattedClinicianId = clinicianId ? clinicianId.trim() : null;
  const safeTimeZone = TimeZoneService.ensureIANATimeZone(timeZone);

  // Convert from/to dates to UTC for database query
  const fromUTC = fromDate ? 
    DateTime.fromJSDate(fromDate).setZone(safeTimeZone).toUTC().toISO() : 
    undefined;
    
  const toUTC = toDate ? 
    DateTime.fromJSDate(toDate).setZone(safeTimeZone).toUTC().toISO() : 
    undefined;

  // Fetch appointments
  const { 
    data: appointments = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['appointments', formattedClinicianId, fromUTC, toUTC],
    queryFn: async () => {
      if (!formattedClinicianId) {
        console.log('[useAppointments] Skipping appointment fetch - no clinicianId provided');
        return [];
      }
      
      console.log('[useAppointments] Fetching appointments for clinician:', formattedClinicianId);
      console.log('[useAppointments] Date range:', { 
        from: fromUTC ? new Date(fromUTC).toISOString() : 'none', 
        to: toUTC ? new Date(toUTC).toISOString() : 'none' 
      });
      
      try {
        let query = supabase
          .from('appointments')
          .select(`
            id,
            client_id,
            clinician_id,
            start_at,
            end_at,
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
          .eq('clinician_id', formattedClinicianId)
          .eq('status', 'scheduled');

        // Apply date range filters if provided
        if (fromUTC) {
          query = query.gte('start_at', fromUTC);
        }
        
        if (toUTC) {
          query = query.lte('start_at', toUTC);
        }
        
        query = query.order('start_at', { ascending: true });

        const { data, error } = await query;

        if (error) {
          console.error('[useAppointments] Error fetching appointments:', error);
          throw new Error(error.message);
        }
        
        console.log(`[useAppointments] Fetched ${data?.length || 0} appointments`);
        
        // Process appointments to format client data correctly
        const formattedAppointments = (data || []).map((rawAppt: RawSupabaseAppointment): Appointment => {
          // Extract client data from the joined table
          const clientDataFromQuery = rawAppt.clients;
          
          // Log the first appointment's client data structure for debugging
          if (data && data.length > 0 && rawAppt.id === data[0].id) {
            console.log('[useAppointments] First appointment client data structure:', {
              clientsField: rawAppt.clients,
              clientsType: rawAppt.clients ? typeof rawAppt.clients : 'null'
            });
          }
          
          // Create a new object without the clients field
          const { clients, ...coreAppointmentFields } = rawAppt;
          
          // Create properly formatted appointment object
          return {
            ...coreAppointmentFields,
            start_at: rawAppt.start_at, // Ensure these are present and correctly typed as string
            end_at: rawAppt.end_at,     // Ensure these are present and correctly typed as string
            // Add formatted client object with required properties
            client: clientDataFromQuery ? {
              client_first_name: clientDataFromQuery.client_first_name || '',
              client_last_name: clientDataFromQuery.client_last_name || '',
              client_preferred_name: clientDataFromQuery.client_preferred_name || ''
            } : undefined,
            // Add computed client name for convenience
            clientName: clientDataFromQuery ?
              `${clientDataFromQuery.client_preferred_name || clientDataFromQuery.client_first_name || ''} ${clientDataFromQuery.client_last_name || ''}`.trim() :
              'Unknown Client'
          };
        });

        return formattedAppointments;
      } catch (error) {
        console.error('[useAppointments] Error:', error);
        toast({
          title: "Error",
          description: "Failed to load appointments. Please try again later.",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!formattedClinicianId
  });

  // Helper function to convert appointment dates between timezones
  const convertAppointmentToTimeZone = (appointment: Appointment, targetTimeZone: string): Appointment => {
    const safeZone = TimeZoneService.ensureIANATimeZone(targetTimeZone);
    
    // Clone appointment to avoid mutating the original
    const converted = { ...appointment };
    
    // Add formatted fields for display based on UTC timestamps
    if (converted.start_at) {
      const startLocal = TimeZoneService.fromUTC(converted.start_at, safeZone);
      converted.formattedStartTime = TimeZoneService.formatTime(startLocal);
      converted.formattedDate = TimeZoneService.formatDate(startLocal);
    }
    
    if (converted.end_at) {
      const endLocal = TimeZoneService.fromUTC(converted.end_at, safeZone);
      converted.formattedEndTime = TimeZoneService.formatTime(endLocal);
    }
    
    return converted;
  };

  // Function to check if appointment is today based on UTC timestamp
  const isAppointmentToday = (appointment: Appointment): boolean => {
    if (!appointment?.start_at) return false;
    
    try {
      const startDateTime = TimeZoneService.fromUTC(appointment.start_at, safeTimeZone);
      const todayInTimeZone = TimeZoneService.today(safeTimeZone);
      return TimeZoneService.isSameDay(startDateTime, todayInTimeZone);
    } catch (error) {
      console.error('[useAppointments] Error checking if appointment is today:', error);
      return false;
    }
  };

  const startSession = async (appointment: Appointment) => {
    try {
      setCurrentAppointment(appointment);
      setIsLoadingClientData(true);
      
      // Get client data if needed
      if (appointment.client_id) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', appointment.client_id)
          .single();
          
        if (error) {
          console.error('[useAppointments] Error fetching client data:', error);
        } else {
          setClientData(data);
        }
      }
      
      // Open video session if URL exists or create a new one
      if (appointment.video_room_url) {
        setCurrentVideoUrl(appointment.video_room_url);
        setIsVideoOpen(true);
      } else {
        const result = await getOrCreateVideoRoom(appointment.id.toString());
        if (result.success && result.url) {
          setCurrentVideoUrl(result.url);
          setIsVideoOpen(true);
        } else {
          toast({
            title: "Error",
            description: "Failed to create video room. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('[useAppointments] Error starting session:', error);
      toast({
        title: "Error",
        description: "There was a problem starting the session.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingClientData(false);
    }
  };

  const documentSession = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setShowSessionTemplate(true);
  };

  const closeVideoSession = () => {
    setIsVideoOpen(false);
  };

  const closeSessionTemplate = () => {
    setShowSessionTemplate(false);
  };

  // Filter past appointments that need documentation
  const pastAppointments = appointments.filter(app => {
    if (!app.end_at) return false;
    const endTime = new Date(app.end_at);
    return endTime < new Date() && app.status === 'scheduled';
  });

  // Filter upcoming (future) appointments
  const upcomingAppointments = appointments.filter(app => {
    if (!app.start_at) return false;
    const startTime = new Date(app.start_at);
    // Not today and in the future
    return startTime > new Date() && !isAppointmentToday(app);
  });

  // Convert appointments to display timezone
  const processedAppointments = appointments.map(appt => 
    convertAppointmentToTimeZone(appt, safeTimeZone)
  );

  // Filter appointments by today 
  const todayAppointments = processedAppointments.filter(isAppointmentToday);

  return {
    appointments: processedAppointments,
    todayAppointments,
    upcomingAppointments,
    pastAppointments,
    isLoading,
    error,
    refetch,
    startSession,
    startVideoSession: startSession,
    documentSession,
    openSessionTemplate: documentSession,
    isVideoOpen,
    closeVideoSession,
    closeSessionTemplate,
    currentVideoUrl,
    currentAppointment,
    showSessionTemplate,
    setShowSessionTemplate,
    clientData,
    isLoadingClientData
  };
};

export default useAppointments;
