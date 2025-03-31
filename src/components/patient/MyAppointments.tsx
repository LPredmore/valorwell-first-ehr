
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { useToast } from '@/components/ui/use-toast';

interface PastAppointment {
  id: string | number;
  date: string;
  time: string;
  type: string;
  therapist: string;
  rawDate?: string;
}

interface MyAppointmentsProps {
  pastAppointments?: PastAppointment[];
}

const MyAppointments: React.FC<MyAppointmentsProps> = ({ pastAppointments: initialPastAppointments }) => {
  const [loading, setLoading] = useState(false);
  const [pastAppointments, setPastAppointments] = useState<PastAppointment[]>([]);
  const [clinicianName, setClinicianName] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const { toast } = useToast();
  const clientTimeZone = clientData?.client_time_zone || getUserTimeZone();

  useEffect(() => {
    // Get the current user data from local storage
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
        
        setClientData(client);
        
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
      }
    };
    
    fetchClientData();
  }, []);

  useEffect(() => {
    const fetchPastAppointments = async () => {
      if (!clientData?.id) return;
      
      setLoading(true);
      try {
        // Get today's date
        const today = startOfToday();
        const todayStr = format(today, 'yyyy-MM-dd');
        
        // Fetch only appointments with date before today
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientData.id)
          .lt('date', todayStr) // Only get appointments before today
          .order('date', { ascending: false }) // Most recent first
          .order('start_time', { ascending: false });

        if (error) {
          console.error('Error fetching past appointments:', error);
          toast({
            title: "Error",
            description: "Failed to load appointment history",
            variant: "destructive"
          });
          return;
        }

        if (data && data.length > 0) {
          console.log("Past appointments data:", data);
          const formattedAppointments = data.map(appointment => {
            try {
              const formattedDate = format(parseISO(appointment.date), 'MMMM d, yyyy');
              
              // Format time with proper error handling
              let formattedTime = '';
              try {
                if (appointment.start_time) {
                  const dateTimeString = `${appointment.date}T${appointment.start_time}`;
                  formattedTime = formatInTimeZone(
                    parseISO(dateTimeString), 
                    clientTimeZone, 
                    'h:mm a'
                  );
                } else {
                  formattedTime = 'Time unavailable';
                }
              } catch (error) {
                console.error('Error formatting time:', error, appointment);
                formattedTime = appointment.start_time || 'Time unavailable';
              }
              
              return {
                id: appointment.id,
                date: formattedDate,
                time: formattedTime,
                type: appointment.type || 'Appointment',
                therapist: clinicianName || 'Your Therapist',
                rawDate: appointment.date
              };
            } catch (error) {
              console.error('Error processing appointment:', error, appointment);
              // Return a fallback object to prevent breaking the UI
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time <span className="text-xs text-gray-500">({clientTimeZone.split('/').pop()?.replace('_', ' ')})</span></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.date}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.type}</TableCell>
                  <TableCell>{appointment.therapist}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
