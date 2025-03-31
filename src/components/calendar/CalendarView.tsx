import React, { useState, useEffect } from 'react';
import {
format,
startOfWeek,
endOfWeek,
eachDayOfInterval,
startOfMonth,
endOfMonth,
isSameMonth,
isSameDay,
addMonths,
subMonths,
addWeeks,
subWeeks,
addDays,
subDays,
parseISO
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
ChevronLeft,
ChevronRight,
Clock,
Calendar as CalendarIcon,
Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import AvailabilityPanel from './AvailabilityPanel';
import AppointmentDetailsDialog from './AppointmentDetailsDialog';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';

interface CalendarViewProps {
  view: 'day' | 'week' | 'month';
  showAvailability: boolean;
  clinicianId: string | null;
  userTimeZone?: string;
  refreshTrigger?: number;
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

const CalendarView: React.FC<CalendarViewProps> = ({ 
  view, 
  showAvailability, 
  clinicianId,
  userTimeZone: propTimeZone,
  refreshTrigger = 0
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityRefreshTrigger, setAvailabilityRefreshTrigger] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, any>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment & { clientName?: string } | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const userTimeZone = propTimeZone || getUserTimeZone();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!clinicianId) return;

      try {
        let startDate, endDate;
        if (view === 'day') {
          startDate = format(currentDate, 'yyyy-MM-dd');
          endDate = startDate;
        } else if (view === 'week') {
          const start = startOfWeek(currentDate, { weekStartsOn: 0 });
          const end = endOfWeek(currentDate, { weekStartsOn: 0 });
          startDate = format(start, 'yyyy-MM-dd');
          endDate = format(end, 'yyyy-MM-dd');
        } else if (view === 'month') {
          const start = startOfMonth(currentDate);
          const end = endOfMonth(currentDate);
          startDate = format(start, 'yyyy-MM-dd');
          endDate = format(end, 'yyyy-MM-dd');
        }

        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('clinician_id', clinicianId)
          .gte('date', startDate)
          .lte('date', endDate)
          .eq('status', 'scheduled');

        if (error) {
          console.error('Error fetching appointments:', error);
        } else {
          setAppointments(data || []);
          
          if (data && data.length > 0) {
            const clientIds = [...new Set(data.map(app => app.client_id))];
            const { data: clientsData, error: clientsError } = await supabase
              .from('clients')
              .select('id, client_first_name, client_last_name, client_preferred_name, client_time_zone')
              .in('id', clientIds);
              
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
    setAvailabilityRefreshTrigger(prev => prev + 1);
  };

  const getHeaderText = () => {
    if (view === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });

      if (format(start, 'MMM') === format(end, 'MMM')) {
        return `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`;
      } else {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
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

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">{getHeaderText()}</h2>
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="flex gap-4">
        <div className={cn("flex-1", showAvailability ? "w-3/4" : "w-full")}>
          {view === 'day' && (
            <DayView 
              currentDate={currentDate} 
              clinicianId={clinicianId} 
              refreshTrigger={availabilityRefreshTrigger}
              appointments={appointments.filter(app => 
                app.date === format(currentDate, 'yyyy-MM-dd')
              )}
              getClientName={getClientName}
              onAppointmentClick={handleAppointmentClick}
              userTimeZone={userTimeZone}
            />
          )}
          {view === 'week' && (
            <WeekView 
              currentDate={currentDate} 
              clinicianId={clinicianId} 
              refreshTrigger={availabilityRefreshTrigger}
              appointments={appointments}
              getClientName={getClientName}
              onAppointmentClick={handleAppointmentClick}
              userTimeZone={userTimeZone}
            />
          )}
          {view === 'month' && (
            <MonthView 
              currentDate={currentDate} 
              clinicianId={clinicianId} 
              refreshTrigger={availabilityRefreshTrigger}
              appointments={appointments}
              getClientName={getClientName}
              onAppointmentClick={handleAppointmentClick}
              userTimeZone={userTimeZone}
            />
          )}
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
      </div>

      <AppointmentDetailsDialog 
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        appointment={selectedAppointment}
        onAppointmentUpdated={handleAppointmentUpdated}
        userTimeZone={userTimeZone}
        clientTimeZone={selectedAppointment ? getClientTimeZone(selectedAppointment.client_id) : ''}
      />
    </div>
  );
};

export default CalendarView;
