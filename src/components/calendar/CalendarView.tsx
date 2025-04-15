import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ErrorBoundary } from 'react-error-boundary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MonthView from './MonthView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';
import { BaseAppointment } from './week-view/types';
import { Appointment } from './week-view/useWeekViewData';

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

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <Card className="p-6">
      <div className="text-center text-red-500">
        <p className="mb-2 font-medium">Error loading calendar</p>
        <p className="mb-4">{error.message || 'An unexpected error occurred'}</p>
        <Button onClick={resetErrorBoundary}>Try Again</Button>
      </div>
    </Card>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({
  showAvailability,
  clinicianId,
  userTimeZone: propTimeZone,
  refreshTrigger = 0,
  monthViewMode = 'month',
  currentDate: propCurrentDate
}) => {
  const [currentDate, setCurrentDate] = useState(propCurrentDate || new Date());
  const [availabilityRefreshTrigger, setAvailabilityRefreshTrigger] = useState(0);
  const [appointments, setAppointments] = useState<BaseAppointment[]>([]);
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (propCurrentDate) {
      setCurrentDate(propCurrentDate);
    }
  }, [propCurrentDate]);

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
    const checkUserPermissions = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        console.log('[CalendarView] Current authenticated user:', data?.user ? {
          id: data.user.id,
          email: data.user.email,
        } : 'No user');
        
        if (!data?.user) {
          setError('You must be logged in to view the calendar');
          toast({
            title: 'Authentication Error',
            description: 'You must be logged in to view the calendar',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('[CalendarView] Error checking user permissions:', error);
      }
    };
    
    checkUserPermissions();
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
          setClinicianTimeZone('America/Chicago'); // Default to Central Time
        } finally {
          setIsLoadingTimeZone(false);
        }
      }
    };
    
    fetchClinicianTimeZone();
  }, [clinicianId]);

  const effectiveTimeZone = propTimeZone || (isLoadingTimeZone ? 'America/Chicago' : clinicianTimeZone);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!clinicianId) {
        console.log("[CalendarView] No clinicianId provided, skipping appointments fetch");
        setAppointments([]);
        return;
      }
      
      try {
        setError(null);
        
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
          setError(`Error fetching appointments: ${error.message}`);
          toast({
            title: 'Error',
            description: `Failed to load appointments: ${error.message}`,
            variant: 'destructive'
          });
        } else {
          console.log(`[CalendarView] Fetched ${data?.length || 0} appointments:`, data);
          
          const appointmentsData = data || [] as BaseAppointment[];
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
              setError(`Error fetching client data: ${clientsError.message}`);
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[CalendarView] Exception in appointment fetching:', error);
        setError(`Unexpected error: ${errorMessage}`);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while loading appointments',
          variant: 'destructive'
        });
      }
    };
    
    fetchAppointments();
  }, [clinicianId, currentDate, monthViewMode, availabilityRefreshTrigger, appointmentRefreshTrigger, refreshTrigger]);

  const handleAvailabilityUpdated = () => {
    console.log("[CalendarView] Availability updated - refreshing calendar view");
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
    return client?.client_time_zone || 'America/Chicago'; // Default timezone if not found
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
  
  if (error && !clinicianId) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <p className="mb-2 font-medium">Error: {error}</p>
          <p>Please make sure you are logged in and have proper permissions.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setAvailabilityRefreshTrigger(prev => prev + 1);
        setAppointmentRefreshTrigger(prev => prev + 1);
      }}
    >
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
            userTimeZone={effectiveTimeZone}
            weekViewMode={monthViewMode === 'week'} 
          />
        </div>

        {showAvailability && (
          <div className="w-1/4">
            <AvailabilityPanel />
          </div>
        )}

        <AppointmentDetailsDialog 
          isOpen={isDetailsDialogOpen} 
          onClose={() => setIsDetailsDialogOpen(false)} 
          appointment={selectedAppointment} 
          onAppointmentUpdated={handleAppointmentUpdated} 
          userTimeZone={effectiveTimeZone} 
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
    </ErrorBoundary>
  );
};

export default CalendarView;
