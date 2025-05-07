import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client'; // Assuming getOrCreateVideoRoom is needed
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment'; // Ensure this path is correct and Appointment type is clean

// Define the structure of the raw data Supabase returns for an appointment.
// Use a clean, direct definition for the nested 'clients' object.
interface RawSupabaseAppointment {
  id: string;
  client_id: string;
  clinician_id: string;
  start_at: string; // UTC ISO string from database
  end_at: string;   // UTC ISO string from database
  type: string;
  status: string;
  appointment_recurring: string | null;
  recurring_group_id: string | null;
  video_room_url: string | null;
  notes: string | null;
  clients: { // Directly define the expected object structure or null
    client_first_name: string | null;
    client_last_name: string | null;
    client_preferred_name: string | null;
  } | null; // Supabase join returns the object directly or null if no match
}

// Define a type for the processed appointment that includes display fields
// This keeps the base Appointment type clean.
type DisplayAppointment = Appointment & {
  formattedDate?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
};

export const useAppointments = (
  clinicianId: string | null,
  fromDate?: Date, // Input from component, typically local date
  toDate?: Date,   // Input from component, typically local date
  timeZone?: string // User's current IANA timezone for interpreting fromDate/toDate
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

  // Memoize UTC date range calculation
  const { fromUTCISO, toUTCISO } = useMemo(() => {
    let fromISO: string | undefined;
    let toISO: string | undefined;
    try {
      if (fromDate) {
        fromISO = DateTime.fromJSDate(fromDate).setZone(safeUserTimeZone).startOf('day').toUTC().toISO() ?? undefined;
      }
      if (toDate) {
        toISO = DateTime.fromJSDate(toDate).setZone(safeUserTimeZone).endOf('day').toUTC().toISO() ?? undefined;
      }
    } catch (e) {
      console.error("Error converting date range to UTC:", e);
    }
    return { fromUTCISO: fromISO, toUTCISO: toISO };
  }, [fromDate, toDate, safeUserTimeZone]);

  const {
    data: fetchedAppointments = [], // Default to empty array, type is inferred from queryFn or specified below
    isLoading,
    error,
    refetch,
  } = useQuery<Appointment[], Error>({ // Explicitly type the query data as our clean Appointment[]
    queryKey: ['appointments', formattedClinicianId, fromUTCISO, toUTCISO],
    queryFn: async (): Promise<Appointment[]> => { // queryFn MUST return Promise<Appointment[]>
      if (!formattedClinicianId) {
        console.log('[useAppointments] Skipping fetch: no clinicianId provided.');
        return [];
      }

      console.log('[useAppointments] Fetching for clinician:', formattedClinicianId, { from: fromUTCISO, to: toUTCISO });

      let query = supabase
        .from('appointments') // Use correct table name
        .select(`
          id, client_id, clinician_id, start_at, end_at, type, status,
          appointment_recurring, recurring_group_id, video_room_url, notes,
          clients ( client_first_name, client_last_name, client_preferred_name )
        `)
        .eq('clinician_id', formattedClinicianId)
        .eq('status', 'scheduled');

      if (fromUTCISO) query = query.gte('start_at', fromUTCISO);
      if (toUTCISO) query = query.lte('start_at', toUTCISO); // Ensure logic is correct for end date

      query = query.order('start_at', { ascending: true });

      // Use .returns<T>() to strongly type the expected response from Supabase
      const { data: rawData, error: queryError } = await query.returns<RawSupabaseAppointment[]>();

      if (queryError) {
        console.error('[useAppointments] Error fetching appointments:', queryError);
        throw new Error(queryError.message);
      }

      console.log(`[useAppointments] Fetched ${rawData?.length || 0} raw appointments.`);
      if (rawData && rawData.length > 0) {
        // Debug log to confirm structure ONLY if needed
        // console.log('[useAppointments] Sample raw appointment.clients:', JSON.stringify(rawData[0].clients, null, 2));
      }

      // Transform raw Supabase data to our frontend Appointment type
      const formattedResult = (rawData || []).map((rawAppt: RawSupabaseAppointment): Appointment => {
        // 'rawAppt.clients' should be correctly typed here because rawAppt is RawSupabaseAppointment
        const clientDataFromQuery = rawAppt.clients; 
        
        // Destructure safely
        const { clients, ...coreAppointmentFields } = rawAppt;

        // Explicitly return an object matching the 'Appointment' interface
        return {
          ...coreAppointmentFields,
          start_at: rawAppt.start_at, // Pass UTC string
          end_at: rawAppt.end_at,     // Pass UTC string
          client: clientDataFromQuery ? { // Check if object exists
            client_first_name: clientDataFromQuery.client_first_name || '', // Provide default empty string for nulls
            client_last_name: clientDataFromQuery.client_last_name || '',
            client_preferred_name: clientDataFromQuery.client_preferred_name || '',
          } : undefined, // Client is optional
          clientName: clientDataFromQuery ?
            `${clientDataFromQuery.client_preferred_name || clientDataFromQuery.client_first_name || ''} ${clientDataFromQuery.client_last_name || ''}`.trim() :
            'Unknown Client',
        };
      });

      return formattedResult; // This MUST be Appointment[]
    },
    enabled: !!formattedClinicianId,
  });

  // Helper function to add display formatting properties
  const addDisplayFormattingToAppointment = (appointment: Appointment, displayTimeZone: string): DisplayAppointment => {
    const safeDisplayZone = TimeZoneService.ensureIANATimeZone(displayTimeZone);
    let formattedDate, formattedStartTime, formattedEndTime;

    if (appointment.start_at) {
      try {
        const startLocal = TimeZoneService.convertUTCToLocal(appointment.start_at, safeDisplayZone);
        formattedStartTime = TimeZoneService.formatTime(startLocal);
        formattedDate = TimeZoneService.formatDate(startLocal, 'yyyy-MM-dd');
      } catch (e) {
        console.error("Error formatting start_at:", e, appointment.start_at);
      }
    }
    if (appointment.end_at) {
      try {
        const endLocal = TimeZoneService.convertUTCToLocal(appointment.end_at, safeDisplayZone);
        formattedEndTime = TimeZoneService.formatTime(endLocal);
      } catch (e) {
        console.error("Error formatting end_at:", e, appointment.end_at);
      }
    }
    // Return type includes optional formatted fields
    return {
      ...appointment,
      formattedDate: formattedDate || "Error", // Provide fallback
      formattedStartTime: formattedStartTime || "Error",
      formattedEndTime: formattedEndTime || "Error",
    };
  };

  // Function to check if appointment is today based on UTC timestamp
  const isAppointmentToday = (appointment: Appointment): boolean => {
    if (!appointment?.start_at) return false;
    try {
      const startDateTimeLocal = TimeZoneService.convertUTCToLocal(appointment.start_at, safeUserTimeZone);
      const todayLocal = TimeZoneService.today(safeUserTimeZone);
      // Ensure isSameDay method exists and works correctly in TimeZoneService
      return TimeZoneService.isSameDay(startDateTimeLocal, todayLocal);
    } catch (e) {
      console.error("Error in isAppointmentToday:", e);
      return false;
    }
  };

  // Memoized list of appointments with display formatting added for the hook's default timezone
  const appointmentsWithDisplayFormatting = useMemo<DisplayAppointment[]>(() => {
    // Use the clean fetchedAppointments (which are Appointment[])
    return fetchedAppointments.map(appt => addDisplayFormattingToAppointment(appt, safeUserTimeZone));
  }, [fetchedAppointments, safeUserTimeZone]);

  // Memoized lists for today, upcoming, past
  const todayAppointments = useMemo<DisplayAppointment[]>(() => {
    return appointmentsWithDisplayFormatting.filter(isAppointmentToday);
  }, [appointmentsWithDisplayFormatting]); // Removed isAppointmentToday from deps as it should be stable

  const upcomingAppointments = useMemo<DisplayAppointment[]>(() => {
    const now = DateTime.now().setZone(safeUserTimeZone);
    return appointmentsWithDisplayFormatting.filter(app => {
      if (!app.start_at) return false;
      try {
        const startTimeLocal = TimeZoneService.convertUTCToLocal(app.start_at, safeUserTimeZone);
        return startTimeLocal > now && !isAppointmentToday(app);
      } catch { return false; }
    });
  }, [appointmentsWithDisplayFormatting, safeUserTimeZone]); // Removed isAppointmentToday

  const pastAppointments = useMemo<DisplayAppointment[]>(() => {
    const now = DateTime.now().setZone(safeUserTimeZone);
    return appointmentsWithDisplayFormatting.filter(app => {
      if (!app.end_at) return false;
      try {
        const endTimeLocal = TimeZoneService.convertUTCToLocal(app.end_at, safeUserTimeZone);
        // Consider status carefully if needed
        return endTimeLocal < now && app.status === 'scheduled'; 
      } catch { return false; }
    });
  }, [appointmentsWithDisplayFormatting, safeUserTimeZone]);

  // Session handling functions remain largely the same, ensure they use the 'Appointment' type
  const startSession = async (appointment: Appointment) => {
    try {
      setCurrentAppointment(appointment);
      setIsLoadingClientDataForSession(true);
      if (appointment.client) {
        setClientDataForSession(appointment.client);
      } else if (appointment.client_id) {
        console.warn(`[useAppointments] Client data not pre-joined for appointment ${appointment.id}. Fetching separately.`);
        const { data: clientInfo, error: clientError } = await supabase
          .from('clients')
          .select('client_first_name, client_last_name, client_preferred_name')
          .eq('id', appointment.client_id)
          .single();
        if (clientError) console.error('[useAppointments] Error fetching client data for session:', clientError);
        else setClientDataForSession(clientInfo); // Assuming clientInfo matches Appointment['client'] structure
      }

      if (appointment.video_room_url) {
        setCurrentVideoUrl(appointment.video_room_url);
        setIsVideoOpen(true);
      } else {
        const result = await getOrCreateVideoRoom(appointment.id.toString());
        if (result.success && result.url) {
          setCurrentVideoUrl(result.url);
          setIsVideoOpen(true);
        } else {
          toast({ title: "Error", description: result.error || "Failed to create video room.", variant: "destructive" });
        }
      }
    } catch (e: any) {
      console.error('[useAppointments] Error starting session:', e);
      toast({ title: "Error", description: e.message || "Problem starting session.", variant: "destructive" });
    } finally {
      setIsLoadingClientDataForSession(false);
    }
  };

  const documentSession = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setShowSessionTemplate(true);
  };

  const closeVideoSession = () => setIsVideoOpen(false);
  const closeSessionTemplate = () => setShowSessionTemplate(false);

  return {
    appointments: appointmentsWithDisplayFormatting, // Provide the formatted list
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
    // Provide the helper for components needing different timezone formatting:
    addDisplayFormattingToAppointment,
  };
};
