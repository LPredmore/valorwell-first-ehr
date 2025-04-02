
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';
import { getUserTimeZone } from '@/utils/timeZoneUtils';

interface UseCalendarStateProps {
  view: 'day' | 'week' | 'month';
  clinicianId: string | null;
  propTimeZone?: string;
  refreshTrigger?: number;
}

export interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
}

export interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  isException?: boolean;
}

export const useCalendarState = ({
  view,
  clinicianId,
  propTimeZone,
  refreshTrigger = 0
}: UseCalendarStateProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityRefreshTrigger, setAvailabilityRefreshTrigger] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, any>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment & {
    clientName?: string;
  } | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityBlock | null>(null);
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState<Date | null>(null);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>('America/Chicago');
  const [isLoadingTimeZone, setIsLoadingTimeZone] = useState(true);

  // Fetch the clinician's timezone
  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (clinicianId) {
        setIsLoadingTimeZone(true);
        try {
          const timeZone = await getClinicianTimeZone(clinicianId);
          console.log("Fetched clinician timezone:", timeZone);
          setClinicianTimeZone(timeZone);
        } catch (error) {
          console.error("Error fetching clinician timezone:", error);
        } finally {
          setIsLoadingTimeZone(false);
        }
      }
    };
    
    fetchClinicianTimeZone();
  }, [clinicianId]);

  // Use the clinician's timezone or fallback to props or system default
  const userTimeZone = propTimeZone || (isLoadingTimeZone ? getUserTimeZone() : clinicianTimeZone);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!clinicianId) return;
      try {
        let startDate, endDate;
        if (view === 'day') {
          startDate = format(currentDate, 'yyyy-MM-dd');
          endDate = startDate;
        } else if (view === 'week') {
          const start = startOfWeek(currentDate, {
            weekStartsOn: 0
          });
          const end = endOfWeek(currentDate, {
            weekStartsOn: 0
          });
          startDate = format(start, 'yyyy-MM-dd');
          endDate = format(end, 'yyyy-MM-dd');
        } else if (view === 'month') {
          const start = startOfMonth(currentDate);
          const end = endOfMonth(currentDate);
          startDate = format(start, 'yyyy-MM-dd');
          endDate = format(end, 'yyyy-MM-dd');
        }
        const {
          data,
          error
        } = await supabase.from('appointments').select('*').eq('clinician_id', clinicianId).gte('date', startDate).lte('date', endDate).eq('status', 'scheduled');
        if (error) {
          console.error('Error fetching appointments:', error);
        } else {
          setAppointments(data || []);
          if (data && data.length > 0) {
            const clientIds = [...new Set(data.map(app => app.client_id))];
            const {
              data: clientsData,
              error: clientsError
            } = await supabase.from('clients').select('id, client_first_name, client_last_name, client_preferred_name, client_time_zone').in('id', clientIds);
            if (clientsError) {
              console.error('Error fetching clients:', clientsError);
            } else if (clientsData) {
              const clientsMapData: Record<string, any> = {};
              clientsData.forEach(client => {
                clientsMapData[client.id] = client;
              });
              setClientsMap(clientsMapData);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchAppointments();
  }, [clinicianId, currentDate, view, availabilityRefreshTrigger, appointmentRefreshTrigger, refreshTrigger]);

  const navigatePrevious = () => {
    if (view === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const handleAvailabilityUpdated = () => {
    console.log("Availability updated - refreshing calendar view");
    // Increment the counter to trigger a refresh
    setAvailabilityRefreshTrigger(prev => prev + 1);
  };

  const getClientName = (clientId: string) => {
    const client = clientsMap[clientId];
    if (!client) return 'Unknown Client';
    const preferredName = client.client_preferred_name;
    const firstName = client.client_first_name;
    const lastName = client.client_last_name;
    const displayName = preferredName || firstName;
    return `${displayName} ${lastName}`;
  };

  const getClientTimeZone = (clientId: string): string => {
    const client = clientsMap[clientId];
    return client?.client_time_zone || getUserTimeZone();
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    const appointmentWithClientName = {
      ...appointment,
      clientName: getClientName(appointment.client_id)
    };
    setSelectedAppointment(appointmentWithClientName);
    setIsDetailsDialogOpen(true);
  };

  const handleAppointmentUpdated = () => {
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

  const handleAvailabilityClick = (date: Date, availabilityBlock: AvailabilityBlock) => {
    setSelectedAvailability(availabilityBlock);
    setSelectedAvailabilityDate(date);
    setIsAvailabilityDialogOpen(true);
  };

  return {
    currentDate,
    userTimeZone,
    isLoadingTimeZone,
    appointments,
    availabilityRefreshTrigger,
    selectedAppointment,
    isDetailsDialogOpen,
    selectedAvailability,
    selectedAvailabilityDate,
    isAvailabilityDialogOpen,
    navigatePrevious,
    navigateNext,
    navigateToday,
    getClientName,
    getClientTimeZone,
    handleAppointmentClick,
    handleAppointmentUpdated,
    handleAvailabilityClick,
    handleAvailabilityUpdated,
    setIsDetailsDialogOpen,
    setIsAvailabilityDialogOpen
  };
};
