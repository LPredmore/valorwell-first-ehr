import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card';
import MonthView from './MonthView';
import AvailabilityPanel from './AvailabilityPanel';
import AppointmentDetailsDialog from './AppointmentDetailsDialog';
import AvailabilityEditDialog from './AvailabilityEditDialog';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';

interface CalendarViewProps {
  view: 'week' | 'month';  // Keeping for backward compatibility
  showAvailability: boolean;
  clinicianId: string | null;
  userTimeZone?: string;
  refreshTrigger?: number;
  monthViewMode?: 'month' | 'week';
  currentDate?: Date; // Add currentDate prop
}

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
}

interface AvailabilityBlock {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  isException?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  showAvailability,
  clinicianId,
  userTimeZone: propTimeZone,
  refreshTrigger = 0,
  monthViewMode = 'month',
  currentDate: propCurrentDate
}) => {
  // Use provided currentDate or default to today
  const [currentDate, setCurrentDate] = useState(propCurrentDate || new Date());
  
  // Update currentDate when propCurrentDate changes
  useEffect(() => {
    if (propCurrentDate) {
      setCurrentDate(propCurrentDate);
    }
  }, [propCurrentDate]);

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

  useEffect(() => {
    console.log('[CalendarView] Component initialized with:', {
      clinicianId,
      monthViewMode,
      showAvailability,
      refreshTrigger,
      currentDate: currentDate?.toISOString()
    });
  }, []);

  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (clinicianId) {
        setIsLoadingTimeZone(true);
        try {
          const timeZone = await getClinicianTimeZone(clinicianId);
          console.log("[CalendarView] Fetched clinician timezone:", timeZone);
          setClinicianTimeZone(timeZone);
        } catch (error) {
          console.error("[CalendarView] Error fetching clinician timezone:", error);
        } finally {
          setIsLoadingTimeZone(false);
        }
      }
    };
    
    fetchClinicianTimeZone();
  }, [clinicianId]);

  const userTimeZone = propTimeZone || (isLoadingTimeZone ? getUserTimeZone() : clinicianTimeZone);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!clinicianId) {
        console.log("[CalendarView] No clinicianId provided, skipping appointments fetch");
        return;
      }
      
      try {
        let startDate, endDate;
        
        if (monthViewMode === 'week') {
          const start = startOfWeek(currentDate, { weekStartsOn: 0 });
          const end = endOfWeek(currentDate, { weekStartsOn: 0 });
          startDate = format(start, 'yyyy-MM-dd');
          endDate = format(end, 'yyyy-MM-dd');
        } else {
          const start = startOfMonth(currentDate);
          const end = endOfMonth(currentDate);
          startDate = format(start, 'yyyy-MM-dd');
          endDate = format(end, 'yyyy-MM-dd');
        }
        
        console.log(`[CalendarView] Fetching appointments from ${startDate} to ${endDate} for clinicianId: "${clinicianId}"`);
        
        const { data: authData } = await supabase.auth.getUser();
        console.log(`[CalendarView] Current authenticated user ID: "${authData?.user?.id}"`);
        console.log(`[CalendarView] Using clinicianId for query: "${clinicianId}"`);
        
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            clients:client_id (
              client_assigned_therapist
            )
          `)
          .eq('clinician_id', clinicianId)
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('status', 'scheduled');
          
        if (error) {
          console.error('[CalendarView] Error fetching appointments:', error);
        } else {
          console.log(`[CalendarView] Fetched ${data?.length || 0} appointments:`, data);
          
          const appointmentsData = data || [];
          console.log(`[CalendarView] Appointment data after RLS (no filtering): ${appointmentsData.length} appointments`);
          
          setAppointments(appointmentsData);
          
          if (appointmentsData.length > 0) {
            const clientIds = [...new Set(appointmentsData.map(app => app.client_id))];
            console.log(`[CalendarView] Fetching details for ${clientIds.length} unique clients`);
            
            const { data: clientsData, error: clientsError } = await supabase
              .from('clients')
              .select('id, client_first_name, client_last_name, client_preferred_name, client_time_zone')
              .in('id', clientIds);
              
            if (clientsError) {
              console.error('[CalendarView] Error fetching clients:', clientsError);
            } else if (clientsData) {
              const clientsMapData: Record<string, any> = {};
              clientsData.forEach(client => {
                clientsMapData[client.id] = client;
              });
              console.log(`[CalendarView] Built clients map with ${Object.keys(clientsMapData).length} clients`);
              setClientsMap(clientsMapData);
            }
          }
        }
      } catch (error) {
        console.error('[CalendarView] Exception in appointment fetching:', error);
      }
    };
    
    fetchAppointments();
  }, [clinicianId, currentDate, monthViewMode, availabilityRefreshTrigger, appointmentRefreshTrigger, refreshTrigger]);

  useEffect(() => {
    console.log(`[CalendarView] Appointments list updated. Count: ${appointments.length}`);
  }, [appointments]);

  const handleAvailabilityUpdated = () => {
    console.log("Availability updated - refreshing calendar view");
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
  
  return (
    <div className="flex gap-4">
      <div className={`flex-1 ${showAvailability ? "w-3/4" : "w-full"}`}>
        <MonthView 
          currentDate={currentDate} 
          clinicianId={clinicianId} 
          refreshTrigger={availabilityRefreshTrigger} 
          appointments={appointments} 
          getClientName={getClientName} 
          onAppointmentClick={handleAppointmentClick} 
          onAvailabilityClick={handleAvailabilityClick}
          userTimeZone={userTimeZone}
          weekViewMode={monthViewMode === 'week'} 
        />
      </div>

      {showAvailability && (
        <div className="w-1/4">
          <AvailabilityPanel 
            clinicianId={clinicianId} 
            onAvailabilityUpdated={handleAvailabilityUpdated} 
            userTimeZone={userTimeZone} 
          />
        </div>
      )}

      <AppointmentDetailsDialog 
        isOpen={isDetailsDialogOpen} 
        onClose={() => setIsDetailsDialogOpen(false)} 
        appointment={selectedAppointment} 
        onAppointmentUpdated={handleAppointmentUpdated} 
        userTimeZone={userTimeZone} 
        clientTimeZone={selectedAppointment ? getClientTimeZone(selectedAppointment.client_id) : ''} 
      />

      <AvailabilityEditDialog
        isOpen={isAvailabilityDialogOpen}
        onClose={() => setIsAvailabilityDialogOpen(false)}
        availabilityBlock={selectedAvailability}
        specificDate={selectedAvailabilityDate}
        clinicianId={clinicianId}
        onAvailabilityUpdated={handleAvailabilityUpdated}
      />
    </div>
  );
};

export default CalendarView;
