import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment'; // Verify path is correct

// Interface for the raw Supabase response (as defined before)
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
  clients: {
    client_first_name: string | null;
    client_last_name: string | null;
    client_preferred_name: string | null;
  } | null;
}

// Interface for the structured client data within our Appointment type
interface AppointmentClientData {
  client_first_name: string;
  client_last_name: string;
  client_preferred_name: string;
}

// Type guard to check if an object is a valid client data object from Supabase
function isValidClientData(obj: any): obj is { client_first_name: string | null; client_last_name: string | null; client_preferred_name: string | null; } {
  return obj && typeof obj === 'object' && ('client_first_name' in obj || 'client_last_name' in obj || 'client_preferred_name' in obj);
}

export const useAppointments = (
  clinicianId: string | null,
  fromDate?: Date,
  toDate?: Date,
  timeZone?: string
) => {
  const { toast } = useToast();
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientDataForSession, setClientDataForSession] = useState<Appointment['client'] | null>(null);
  const [isLoadingClientDataForSession, setIsLoadingClientDataForSession] = useState(false);

  const formattedClinicianId = clinicianId ? clinicianId.trim() : null;
  const safeUserTimeZone = TimeZoneService.ensureIANATimeZone(timeZone || TimeZoneService.DEFAULT_TIMEZONE);

  const { fromUTCISO, toUTCISO } = useMemo(() => {
    let fromISO: string | undefined;
    let toISO: string | undefined;
    try {
      if (fromDate) fromISO = DateTime.fromJSDate(fromDate).setZone(safeUserTimeZone).startOf('day').toUTC().toISO() ?? undefined;
      if (toDate) toISO = DateTime.fromJSDate(toDate).setZone(safeUserTimeZone).endOf('day').toUTC().toISO() ?? undefined;
    } catch (e) { console.error("Error converting date range to UTC:", e); }
    return { fromUTCISO: fromISO, toUTCISO: toISO };
  }, [fromDate, toDate, safeUserTimeZone]);

  const {
    data: fetchedAppointments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Appointment[], Error>({
    queryKey: ['appointments', formattedClinicianId, fromUTCISO, toUTCISO],
    queryFn: async (): Promise<Appointment[]> => {
      if (!formattedClinicianId) return [];
      console.log('[useAppointments] Fetching for clinician:', formattedClinicianId, { from: fromUTCISO, to: toUTCISO });

      let query = supabase
        .from('appointments')
        .select(`id, client_id, clinician_id, start_at, end_at, type, status, appointment_recurring, recurring_group_id, video_room_url, notes, clients (client_first_name, client_last_name, client_preferred_name)`)
        .eq('clinician_id', formattedClinicianId)
        .eq('status', 'scheduled');

      if (fromUTCISO) query = query.gte('start_at', fromUTCISO);
      if (toUTCISO) query = query.lte('start_at', toUTCISO);
      query = query.order('start_at', { ascending: true });

      // Fetch data without .returns<T>() initially to inspect raw data if needed
      const { data: rawDataAny, error: queryError } = await query;

      if (queryError) {
        console.error('[useAppointments] Error fetching appointments:', queryError);
        throw new Error(queryError.message);
      }
      
      // Explicitly cast the raw data ONLY AFTER confirming its structure if necessary
      const rawData = rawDataAny as RawSupabaseAppointment[] | null;

      console.log(`[useAppointments] Fetched ${rawData?.length || 0} raw appointments.`);

      // Transform raw data with robust checks
      const formattedResult = (rawData || []).map((rawAppt): Appointment => {
        // Validate and process client data explicitly
        let processedClientData: Appointment['client'] | undefined;
        let computedClientName: string | undefined;
        const rawClientData = rawAppt.clients; // Extract potential client data

        if (isValidClientData(rawClientData)) { // Use type guard
           processedClientData = {
            client_first_name: rawClientData.client_first_name || '',
            client_last_name: rawClientData.client_last_name || '',
            client_preferred_name: rawClientData.client_preferred_name || '',
          };
          computedClientName = `${processedClientData.client_preferred_name || processedClientData.client_first_name || ''} ${processedClientData.client_last_name || ''}`.trim() || 'Unknown Client';
        } else {
            // Handle cases where rawClientData is null or not the expected object shape
            if (rawClientData !== null) {
                 console.warn(`[useAppointments] Unexpected 'clients' structure for appt ${rawAppt.id}:`, rawClientData);
            }
            processedClientData = undefined;
            computedClientName = 'Unknown Client';
        }

        // Construct the final Appointment object according to the interface
        const { clients, ...coreAppointmentFields } = rawAppt; // Exclude raw 'clients'
        return {
          ...coreAppointmentFields, // Spread validated core fields
          start_at: rawAppt.start_at, // Ensure these are correct UTC strings
          end_at: rawAppt.end_at,
          client: processedClientData, // Assign the validated/processed client object
          clientName: computedClientName, // Assign the computed name
        };
      });

      return formattedResult;
    },
    enabled: !!formattedClinicianId,
  });

  // Helper function to add display formatting (moved outside queryFn)
  const addDisplayFormattingToAppointment = (appointment: Appointment, displayTimeZone: string): Appointment & { formattedDate?: string; formattedStartTime?: string; formattedEndTime?: string; } => {
    const safeDisplayZone = TimeZoneService.ensureIANATimeZone(displayTimeZone);
    let formattedDate, formattedStartTime, formattedEndTime;
    if (appointment.start_at) { try { const d = TimeZoneService.convertUTCToLocal(appointment.start_at, safeDisplayZone); formattedStartTime = TimeZoneService.formatTime(d); formattedDate = TimeZoneService.formatDate(d, 'yyyy-MM-dd'); } catch (e) { console.error("Err format start_at", e); }}
    if (appointment.end_at) { try { const d = TimeZoneService.convertUTCToLocal(appointment.end_at, safeDisplayZone); formattedEndTime = TimeZoneService.formatTime(d); } catch (e) { console.error("Err format end_at", e); }}
    return { ...appointment, formattedDate, formattedStartTime, formattedEndTime };
  };
  
  // isAppointmentToday logic remains the same
  const isAppointmentToday = (appointment: Appointment): boolean => { /* ... same as before ... */ };

  // Memoized formatted appointments
  const appointmentsWithDisplayFormatting = useMemo(() => {
    return fetchedAppointments.map(appt => addDisplayFormattingToAppointment(appt, safeUserTimeZone));
  }, [fetchedAppointments, safeUserTimeZone]);

  // Other memoized filters (today, upcoming, past) remain the same, using appointmentsWithDisplayFormatting

  const todayAppointments = useMemo(() => { /* ... same as before ... */ }, [appointmentsWithDisplayFormatting]);
  const upcomingAppointments = useMemo(() => { /* ... same as before ... */ }, [appointmentsWithDisplayFormatting, safeUserTimeZone]);
  const pastAppointments = useMemo(() => { /* ... same as before ... */ }, [appointmentsWithDisplayFormatting, safeUserTimeZone]);

  // Session handling functions remain the same
  const startSession = async (appointment: Appointment) => { /* ... same as before ... */ };
  const documentSession = (appointment: Appointment) => { /* ... same as before ... */ };
  const closeVideoSession = () => setIsVideoOpen(false);
  const closeSessionTemplate = () => setShowSessionTemplate(false);

  return {
    // Return values remain largely the same
    appointments: appointmentsWithDisplayFormatting,
    todayAppointments,
    upcomingAppointments,
    pastAppointments,
    isLoading,
    error,
    refetchAppointments: refetch,
    startSession,
    documentSession,
    isVideoOpen,
    closeVideoSession,
    closeSessionTemplate,
    currentVideoUrl,
    currentAppointment,
    showSessionTemplate,
    setShowSessionTemplate,
    sessionClientData: clientDataForSession,
    isLoadingSessionClientData: isLoadingClientDataForSession,
    addDisplayFormattingToAppointment,
  };
};
