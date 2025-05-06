
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { TimeZoneService } from '@/utils/timeZoneService';

interface PastAppointment {
  id: string | number;
  formattedDate: string;
  formattedTime: string;
  type: string;
  therapist: string;
  status?: string;
  start_at: string;
  end_at: string;
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
  
  // Get client timezone from database or browser
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
          setClientTimeZone(TimeZoneService.ensureIANATimeZone(browserTimezone));
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
        // Get the current time in UTC
        const nowUTC = TimeZoneService.now().toUTC().toISO();
        
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientData.id)
          .lt('end_at', nowUTC)  // Use end_at to find completed appointments
          .neq('status', 'cancelled')
          .order('start_at', { ascending: false });

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
              // Format using TimeZoneService for consistency
              const startDateTime = TimeZoneService.fromUTC(appointment.start_at, clientTimeZone);
              
              return {
                id: appointment.id,
                formattedDate: startDateTime.toFormat('MMMM d, yyyy'),
                formattedTime: startDateTime.toFormat('h:mm a'),
                type: appointment.type || 'Appointment',
                therapist: clinicianName || 'Your Therapist',
                status: appointment.status,
                start_at: appointment.start_at,
                end_at: appointment.end_at
              };
            } catch (error) {
              console.error('Error processing appointment:', error, appointment);
              return {
                id: appointment.id || 'unknown-id',
                formattedDate: 'Date unavailable',
                formattedTime: 'Time unavailable',
                type: appointment.type || 'Appointment',
                therapist: clinicianName || 'Your Therapist',
                start_at: appointment.start_at || '',
                end_at: appointment.end_at || ''
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
  const timeZoneDisplay = TimeZoneService.getTimeZoneDisplayName(clientTimeZone);

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
            <p className="text-sm text-gray-500 mb-2">All times shown in {timeZoneDisplay}</p>
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
                    <TableCell>{appointment.formattedDate}</TableCell>
                    <TableCell>{appointment.formattedTime}</TableCell>
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
