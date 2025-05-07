import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client'; // Assuming getOrCreateVideoRoom is still needed
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timeZoneService';
import { DateTime } from 'luxon';
import { Appointment } from '@/types/appointment'; // Ensure this path is correct

// Define the structure of the raw data Supabase returns for an appointment
// This includes the 'clients' nested object from the join.
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
  clients: { // This is the object returned by Supabase for the 'clients (...)' join
    client_first_name: string | null;
    client_last_name: string | null;
    client_preferred_name: string | null;
  } | null; // The entire 'clients' object can be null if no joined client
}

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
  // clientData and isLoadingClientData were for a separate client fetch;
  // if client data is now reliably part of the Appointment type from the main query,
  // these might be simplified or removed depending on detailed interaction needs for 'startSession'.
  const [clientDataForSession, setClientDataForSession] = useState<Appointment['client'] | null>(null);
  const [isLoadingClientDataForSession, setIsLoadingClientDataForSession] = useState(false);

  const formattedClinicianId = clinicianId ? clinicianId.trim() : null;
  const safeUserTimeZone = TimeZoneService.ensureIANATimeZone(timeZone || TimeZoneService.DEFAULT_TIMEZONE);

  // Convert fromDate and toDate (which are local JS Dates in component's context) to UTC ISO strings
  // for the database query, considering the user's current timezone.
  const fromUTCISO = useMemo(() => {
    if (!fromDate) return undefined;
    try {
      // Assume fromDate is the start of the day in user's local timezone
      return DateTime.fromJSDate(fromDate).setZone(safeUserTimeZone).startOf('day').toUTC().toISO();
    } catch (e) {
      console.error("Error converting fromDate to UTC:", e);
      return undefined;
    }
  }, [fromDate, safeUserTimeZone]);

  const toUTCISO = useMemo(() => {
    if (!toDate) return undefined;
    try {
      // Assume toDate is the end of the day in user's local timezone
      return DateTime.fromJSDate(toDate).setZone(safeUserTimeZone).endOf('day').toUTC().toISO();
    } catch (e) {
      console.error("Error converting toDate to UTC:", e);
      return undefined;
    }
  }, [toDate, safeUserTimeZone]);

  const {
    data: fetchedAppointments = [], // Default to empty array
    isLoading,
    error,
    refetch,
  } = useQuery<Appointment[], Error>({ // Explicitly type the data as Appointment[]
    queryKey: ['appointments', formattedClinicianId, fromUTCISO, toUTCISO],
    queryFn: async (): Promise<Appointment[]> => {
      if (!formattedClinicianId) {
        console.log('[useAppointments] Skipping fetch: no clinicianId provided.');
        return [];
      }

      console.log('[useAppointments] Fetching for clinician:', formattedClinicianId, { from: fromUTCISO, to: toUTCISO });

      let query = supabase
        .from('appointments') // Assuming your table is named 'appointments' and has UTC start_at/end_at
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
        .eq('status', 'scheduled'); // Adjust status filter as needed

      if (fromUTCISO) {
        query = query.gte('start_at', fromUTCISO);
      }
      if (toUTCISO) {
        // For 'to' date, we usually want to include appointments that start *before or on* this day's end.
        // If toUTCISO represents the end of the target day, lte('start_at', toUTCISO) is appropriate.
        query = query.lte('start_at', toUTCISO);
      }

      query = query.order('start_at', { ascending: true });

      const { data: rawData, error: queryError } = await query.returns<RawSupabaseAppointment[]>();

      if (queryError) {
        console.error('[useAppointments] Error fetching appointments:', queryError);
        throw new Error(queryError.message);
      }

      console.log(`[useAppointments] Fetched ${rawData?.length || 0} raw appointments.`);
      if (rawData && rawData.length > 0) {
        console.log('[useAppointments] Sample raw appointment from Supabase:', JSON.stringify(rawData[0], null, 2));
        console.log('[useAppointments] Sample raw appointment.clients:', JSON.stringify(rawData[0].clients, null, 2));
      }

      // Transform raw Supabase data to our frontend Appointment type
      const formattedResult = (rawData || []).map((rawAppt: RawSupabaseAppointment): Appointment => {
        // 'rawAppt.clients' is the OBJECT (or null) from Supabase join
        const clientDataFromQuery = rawAppt.clients; 
        
        // Destructure to separate raw 'clients' object from other fields
        // This prevents the raw 'clients' (plural) from Supabase being spread into formattedAppointment
        // if our Appointment type uses 'client' (singular).
        const { clients, ...coreAppointmentFields } = rawAppt;

        return {
          ...coreAppointmentFields, // Contains id, clinician_id, client_id, start_at, end_at, type, status etc.
                                   // start_at and end_at are already UTC ISO strings, pass them directly.
          client: clientDataFromQuery ? {
            client_first_name: clientDataFromQuery.client_first_name || '',
            client_last_name: clientDataFromQuery.client_last_name || '',
            client_preferred_name: clientDataFromQuery.client_preferred_name || '',
          } : undefined,
          clientName: clientDataFromQuery ?
            `${clientDataFromQuery.client_preferred_name || clientDataFromQuery.client_first_name || ''} ${clientDataFromQuery.client_last_name || ''}`.trim() :
            'Unknown Client',
          // formattedDate, formattedStartTime, formattedEndTime are display properties.
          // It's generally better to compute them in the component or a view-specific hook
          // when the target timezone for display is known, rather than pre-populating them here
          // without that context or making this hook timezone-dependent for display.
          // However, if `convertAppointmentToTimeZone` is called later, they will be added.
        };
      });

      return formattedResult;
    },
    enabled: !!formattedClinicianId, // Query will only run if clinicianId is available
    // React Query options:
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper to add formatted display times to an appointment for a specific timezone
  // This can be called by components before rendering.
  const addDisplayFormattingToAppointment = (appointment: Appointment, displayTimeZone: string): Appointment => {
    const safeDisplayZone = TimeZoneService.ensureIANATimeZone(displayTimeZone);
    let formattedDate, formattedStartTime, formattedEndTime;

    if (appointment.start_at) {
      try {
        const startLocal = TimeZoneService.convertUTCToLocal(appointment.start_at, safeDisplayZone);
        formattedStartTime = TimeZoneService.formatTime(startLocal); // e.g., "h:mm a"
        formattedDate = TimeZoneService.formatDate(startLocal, 'yyyy-MM-dd'); // Or your preferred date format
      } catch (e) {
        console.error("Error formatting start_at:", e, appointment.start_at);
        formattedStartTime = "Error";
        formattedDate = "Error";
      }
    }
    if (appointment.end_at) {
      try {
        const endLocal = TimeZoneService.convertUTCToLocal(appointment.end_at, safeDisplayZone);
        formattedEndTime = TimeZoneService.formatTime(endLocal);
      } catch (e) {
        console.error("Error formatting end_at:", e, appointment.end_at);
        formattedEndTime = "Error";
      }
    }
    return {
      ...appointment,
      formattedDate,
      formattedStartTime,
      formattedEndTime,
    };
  };

  const isAppointmentToday = (appointment: Appointment): boolean => {
    if (!appointment?.start_at) return false;
    try {
      // 'safeUserTimeZone' is the timezone used for interpreting 'fromDate' and 'toDate'
      // and for general display context if not overridden.
      const startDateTimeLocal = TimeZoneService.convertUTCToLocal(appointment.start_at, safeUserTimeZone);
      const todayLocal = TimeZoneService.today(safeUserTimeZone);
      return TimeZoneService.isSameDay(startDateTimeLocal, todayLocal);
    } catch (e) {
      console.error("Error in isAppointmentToday:", e);
      return false;
    }
  };

  const startSession = async (appointment: Appointment) => {
    try {
      setCurrentAppointment(appointment); // This should be the full Appointment object
      setIsLoadingClientDataForSession(true);

      // The main appointment object should already have client data if fetched correctly
      if (appointment.client) {
        setClientDataForSession(appointment.client);
      } else if (appointment.client_id) {
        // Fallback: Fetch client data if not already joined (should be rare if select is correct)
        console.warn(`[useAppointments] Client data not pre-joined for appointment ${appointment.id}. Fetching separately.`);
        const { data: clientInfo, error: clientError } = await supabase
          .from('clients')
          .select('client_first_name, client_last_name, client_preferred_name') // Select only needed fields
          .eq('id', appointment.client_id)
          .single();
        if (clientError) console.error('[useAppointments] Error fetching client data for session:', clientError);
        else setClientDataForSession(clientInfo);
      }

      if (appointment.video_room_url) {
        setCurrentVideoUrl(appointment.video_room_url);
        setIsVideoOpen(true);
      } else {
        const result = await getOrCreateVideoRoom(appointment.id.toString());
        if (result.success && result.url) {
          setCurrentVideoUrl(result.url);
          setIsVideoOpen(true);
          // Optionally update the appointment in DB with this new video_room_url
          // await supabase.from('appointments').update({ video_room_url: result.url }).eq('id', appointment.id);
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

  // Processed appointments with display formatting for the hook's primary timezone
  // Components can re-format if they need a different timezone
  const appointmentsWithDisplayFormatting = useMemo(() => {
    return fetchedAppointments.map(appt => addDisplayFormattingToAppointment(appt, safeUserTimeZone));
  }, [fetchedAppointments, safeUserTimeZone]);

  const todayAppointments = useMemo(() => {
    return appointmentsWithDisplayFormatting.filter(isAppointmentToday);
  }, [appointmentsWithDisplayFormatting, isAppointmentToday]); // isAppointmentToday dependency might need memoization if complex

  const upcomingAppointments = useMemo(() => {
    const now = DateTime.now().setZone(safeUserTimeZone);
    return appointmentsWithDisplayFormatting.filter(app => {
      if (!app.start_at) return false;
      try {
        const startTimeLocal = TimeZoneService.convertUTCToLocal(app.start_at, safeUserTimeZone);
        return startTimeLocal > now && !isAppointmentToday(app); // Make sure isAppointmentToday is also considering safeUserTimeZone
      } catch { return false; }
    });
  }, [appointmentsWithDisplayFormatting, safeUserTimeZone, isAppointmentToday]);

  const pastAppointments = useMemo(() => {
    const now = DateTime.now().setZone(safeUserTimeZone);
    return appointmentsWithDisplayFormatting.filter(app => {
      if (!app.end_at) return false;
      try {
        const endTimeLocal = TimeZoneService.convertUTCToLocal(app.end_at, safeUserTimeZone);
        return endTimeLocal < now && app.status === 'scheduled'; // Example: Needs documentation
      } catch { return false; }
    });
  }, [appointmentsWithDisplayFormatting, safeUserTimeZone]);


  return {
    appointments: appointmentsWithDisplayFormatting, // These have formatting for safeUserTimeZone
    todayAppointments,
    upcomingAppointments,
    pastAppointments,
    isLoading,
    error,
    refetchAppointments: refetch, // Renamed for clarity
    startSession,
    documentSession,
    isVideoOpen,
    closeVideoSession,
    closeSessionTemplate,
    currentVideoUrl,
    currentAppointment, // This is the full Appointment object
    showSessionTemplate,
    setShowSessionTemplate, // If needed by consuming components
    // clientDataForSession and isLoadingClientDataForSession are more specific to the modal/session context
    sessionClientData: clientDataForSession, 
    isLoadingSessionClientData: isLoadingClientDataForSession,
    // If components need to re-format for a *different* timezone, they can use this function:
    addDisplayFormattingToAppointment,
  };
};

// Default export is not conventional for hooks, but if your project uses it:
// export default useAppointments;
