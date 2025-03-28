import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CalendarIcon, PlusCircle } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WeekView from '@/components/calendar/WeekView';
import AppointmentBookingDialog from './AppointmentBookingDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface MyPortalProps {
  upcomingAppointments: Array<{
    id: number;
    date: string;
    time: string;
    type: string;
    therapist: string;
  }>;
  clientData: any | null;
  clinicianName: string | null;
  loading: boolean;
}

const MyPortal: React.FC<MyPortalProps> = ({ 
  upcomingAppointments: initialAppointments, 
  clientData, 
  clinicianName,
  loading 
}) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState(initialAppointments);
  const [refreshAppointments, setRefreshAppointments] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!clientData?.id) return;

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientData.id)
          .eq('status', 'scheduled')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
          
        if (error) {
          console.error('Error fetching appointments:', error);
          return;
        }

        if (data && data.length > 0) {
          const formattedAppointments = data.map((appointment) => ({
            id: appointment.id,
            date: format(parseISO(appointment.date), 'MMMM d, yyyy'),
            time: format(parseISO(`2000-01-01T${appointment.start_time}`), 'h:mm a'),
            type: appointment.type,
            therapist: clinicianName || 'Your Therapist'
          }));
          
          setUpcomingAppointments(formattedAppointments);
        } else {
          setUpcomingAppointments([]);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchAppointments();
  }, [clientData, clinicianName, refreshAppointments]);

  const handleBookingComplete = () => {
    setRefreshAppointments(prev => prev + 1);
    toast({
      title: "Appointment Booked",
      description: "Your appointment has been scheduled successfully!",
    });
  };

  const handleStartSession = (appointmentId: string | number) => {
    toast({
      title: "Feature Coming Soon",
      description: "Video session functionality will be available soon.",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled sessions</CardDescription>
          </div>
          <Calendar className="h-5 w-5 text-valorwell-600" />
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Therapist</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>{appointment.therapist}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStartSession(appointment.id)}
                      >
                        Start Session
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No upcoming appointments</h3>
              <p className="text-sm text-gray-500 mt-1">Schedule a session with your therapist</p>
              <Button 
                className="mt-4"
                onClick={() => setIsBookingOpen(true)}
              >
                Book Appointment
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" size="sm">View All Appointments</Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsBookingOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Book New Appointment
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Therapist Availability</CardTitle>
          <CardDescription>View your therapist's schedule</CardDescription>
        </CardHeader>
        <CardContent>
          {clientData && clientData.client_assigned_therapist ? (
            <>
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <h3 className="font-medium">Your Assigned Therapist</h3>
                <p className="text-lg mt-2">{clinicianName || 'Loading therapist information...'}</p>
              </div>

              <Tabs defaultValue="weekly">
                <TabsList className="mb-4">
                  <TabsTrigger value="weekly">Weekly View</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly View</TabsTrigger>
                </TabsList>

                <TabsContent value="weekly" className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Available Time Slots</h3>
                    <p className="text-sm text-gray-500 mb-4">Available time slots for the current week</p>

                    <WeekView currentDate={new Date()} clinicianId={clientData?.client_assigned_therapist || null} />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setIsBookingOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Book a Time Slot
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="monthly">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Monthly Availability</h3>
                    <p className="text-sm text-gray-500 mb-4">View available slots for the entire month</p>
                    <div className="flex justify-center">
                      <p className="text-gray-500">Monthly calendar view will be displayed here</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No Assigned Therapist</h3>
              <p className="text-sm text-gray-500 mt-1">
                You don't have an assigned therapist yet. Please contact the clinic for assistance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentBookingDialog
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        clinicianId={clientData?.client_assigned_therapist || null}
        clinicianName={clinicianName}
        clientId={clientData?.id || null}
        onAppointmentBooked={handleBookingComplete}
      />
    </div>
  );
};

export default MyPortal;
