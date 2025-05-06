
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfToday } from 'date-fns';
import { 
  getUserTimeZone, 
  formatTime12Hour, 
  formatTimeZoneDisplay,
  formatWithTimeZone,
  formatTimeInUserTimeZone,
  ensureIANATimeZone,
  getTimeZoneDisplayName
} from '@/utils/timeZoneUtils';
import { useToast } from '@/hooks/use-toast';
import { TimeZoneService } from '@/utils/timeZoneService';

interface PastAppointment {
  id: string | number;
  date: string;
  time: string;
  type: string;
  therapist: string;
  rawDate?: string;
  status?: string;
  start_at?: string;
  end_at?: string;
}

interface MyAppointmentsProps {
  pastAppointments?: PastAppointment[];
}

const ErrorBoundaryFallback = ({ error }: { error: Error }) => (
  <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700">
    <h3 className="font-medium">Something went wrong loading appointments</h3>
    <p className="text-sm mt-2">Please try again later or contact support if the issue persists.</p>
    <details className="mt-2 text-xs">
      <summary>Technical Details</summary>
      <pre className="mt-1 p-2 bg-white rounded overflow-x-auto">{error.message}</pre>
    </details>
  </div>
);

const MyAppointments: React.FC<MyAppointmentsProps> = ({ pastAppointments: initialPastAppointments }) => {
  const [loading, setLoading] = useState(false);
  const [pastAppointments, setPastAppointments] = useState<PastAppointment[]>([]);
  const [clinicianName, setClinicianName] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Default to browser timezone if client timezone is not available
  const [clientTimeZone, setClientTimeZone] = useState<string>(TimeZoneService.DEFAULT_TIMEZONE);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error getting current user:', userError);
          return;
        }
        
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (clientError) {
          console.error('Error getting client data:', clientError);
          return;
        }
        
        console.log('Client data retrieved:', client);
        setClientData(client);
        
        // Safely set the client timezone with fallback
        if (client?.client_time_zone) {
          const safeTimezone = TimeZoneService.ensureIANATimeZone(client.client_time_zone);
          console.log(`Setting client timezone from database: ${client.client_time_zone} → ${safeTimezone}`);
          setClientTimeZone(safeTimezone);
        } else {
          const browserTimezone = getUserTimeZone();
          console.log(`No client timezone found, using browser timezone: ${browserTimezone}`);
          setClientTimeZone(browserTimezone);
        }
        
        if (client?.client_assigned_therapist) {
          const { data: clinician, error: clinicianError } = await supabase
            .from('clinicians')
            .select('clinician_professional_name')
            .eq('id', client.client_assigned_therapist)
            .single();
            
          if (clinicianError) {
            console.error('Error getting clinician name:', clinicianError);
            return;
          }
          
          setClinicianName(clinician?.clinician_professional_name || null);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch client data'));
      }
    };
    
    fetchClientData();
  }, []);

  useEffect(() => {
    const fetchPastAppointments = async () => {
      if (!clientData?.id) return;
      
      setLoading(true);
      try {
        const today = startOfToday();
        const todayStr = format(today, 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientData.id)
          .lt('date', todayStr)
          .neq('status', 'scheduled')
          .neq('status', 'cancelled')
          .order('date', { ascending: false })
          .order('start_time', { ascending: false });

        if (error) {
          console.error('Error fetching past appointments:', error);
          toast({
            title: "Error",
            description: "Failed to load appointment history",
            variant: "destructive"
          });
          setError(new Error(`Failed to fetch past appointments: ${error.message}`));
          return;
        }

        if (data && data.length > 0) {
          console.log("Past appointments data:", data);
          console.log("Using client time zone:", clientTimeZone);
          
          const formattedAppointments = data.map(appointment => {
            try {
              // Format date safely
              let formattedDate = 'Date unavailable';
              try {
                formattedDate = format(parseISO(appointment.date), 'MMMM d, yyyy');
              } catch (dateError) {
                console.error('Error parsing appointment date:', dateError, { date: appointment.date });
              }
              
              // Format time safely, preferring UTC timestamps if available
              let formattedTime = 'Time unavailable';
              try {
                if (appointment.start_at) {
                  // Use the UTC timestamp for most accurate timezone conversion
                  const startDateTime = TimeZoneService.fromUTC(appointment.start_at, clientTimeZone);
                  formattedTime = TimeZoneService.formatTime(startDateTime);
                  console.log(`Formatted UTC time for appointment ${appointment.id}: ${formattedTime}`);
                } else if (appointment.start_time) {
                  formattedTime = formatTimeInUserTimeZone(
                    appointment.start_time,
                    clientTimeZone,
                    'h:mm a',
                    appointment.date // Pass the appointment date
                  );
                  console.log(`Formatted time for appointment ${appointment.id}: ${formattedTime}`);
                }
              } catch (timeError) {
                console.error('Error formatting time:', timeError, {
                  appointment,
                  timezone: clientTimeZone
                });
                // Fallback to simple formatting
                formattedTime = appointment.start_time ? 
                  formatTime12Hour(appointment.start_time) : 'Time unavailable';
              }
              
              return {
                id: appointment.id,
                date: formattedDate,
                time: formattedTime,
                type: appointment.type || 'Appointment',
                therapist: clinicianName || 'Your Therapist',
                rawDate: appointment.date,
                rawTime: appointment.start_time,
                status: appointment.status,
                start_at: appointment.start_at,
                end_at: appointment.end_at
              };
            } catch (error) {
              console.error('Error processing appointment:', error, appointment);
              return {
                id: appointment.id || 'unknown-id',
                date: 'Date unavailable',
                time: 'Time unavailable',
                type: appointment.type || 'Appointment',
                therapist: clinicianName || 'Your Therapist',
                rawDate: null
              };
            }
          });
          
          console.log("Formatted past appointments:", formattedAppointments);
          setPastAppointments(formattedAppointments);
        } else {
          console.log("No past appointments found");
          setPastAppointments([]);
        }
      } catch (error) {
        console.error('Error in fetchPastAppointments:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch past appointments'));
        toast({
          title: "Error",
          description: "Failed to load your appointment history",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPastAppointments();
  }, [clientData, clinicianName, clientTimeZone, toast]);

  // Safely get timezone display with error handling
  const timeZoneDisplay = (() => {
    try {
      const display = formatTimeZoneDisplay(clientTimeZone);
      console.log(`Formatted timezone display: ${clientTimeZone} → ${display}`);
      return display;
    } catch (error) {
      console.error('Error formatting timezone display:', error);
      return 'local time';
    }
  })();

  // If there's an error, show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Past Appointments</CardTitle>
          <CardDescription>View your appointment history</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorBoundaryFallback error={error} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Appointments</CardTitle>
        <CardDescription>View your appointment history</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-6 text-center">Loading past appointments...</div>
        ) : pastAppointments.length > 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">All times shown in {TimeZoneService.getTimeZoneDisplayName(clientTimeZone)} ({timeZoneDisplay})</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Therapist</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>{appointment.therapist}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium">No past appointments</h3>
            <p className="text-sm text-gray-500 mt-1">Your appointment history will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyAppointments;
