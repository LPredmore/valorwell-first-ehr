
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, PlusIcon } from 'lucide-react';
import { TimeZoneService } from '@/utils/timezone';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  status: string;
}

interface PatientAppointmentsProps {
  patientId: string;
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({ patientId }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const userTimezone = TimeZoneService.getLocalTimeZone();
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('calendar_events') // Adjust table name if needed
          .select('id, start_time, end_time, title, status')
          .eq('client_id', patientId)
          .eq('event_type', 'appointment')
          .order('start_time', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setAppointments(data || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [patientId]);
  
  const handleSchedule = () => {
    navigate(`/calendar?patientId=${patientId}`);
  };
  
  const handleViewAppointment = (appointmentId: string) => {
    navigate(`/appointments/${appointmentId}`);
  };
  
  const getAppointmentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return <LoadingSkeleton count={3} height="100px" />;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <Button onClick={handleSchedule}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </div>
      
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No appointments scheduled for this patient.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const startDate = TimeZoneService.fromUTC(appointment.start_time, userTimezone);
            const endDate = TimeZoneService.fromUTC(appointment.end_time, userTimezone);
            
            return (
              <Card 
                key={appointment.id} 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => handleViewAppointment(appointment.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{appointment.title}</CardTitle>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getAppointmentStatusColor(appointment.status)}`}>
                      {appointment.status || 'Scheduled'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>
                    {TimeZoneService.formatDateTime(startDate, 'EEE, MMM d, yyyy')} • {' '}
                    {TimeZoneService.formatDateTime(startDate, 'h:mm a')} - {' '}
                    {TimeZoneService.formatDateTime(endDate, 'h:mm a')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
