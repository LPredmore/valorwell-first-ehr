import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CalendarIcon, PlusCircle } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WeekView from '@/components/calendar/WeekView';
import AppointmentBookingDialog from './AppointmentBookingDialog';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfToday, isBefore, isToday } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import VideoChat from '@/components/video/VideoChat';
import { getUserTimeZone, formatTimeZoneDisplay, formatTimeInUserTimeZone, formatTime12Hour, ensureIANATimeZone } from '@/utils/timeZoneUtils';
import PHQ9Template from '@/components/templates/PHQ9Template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Appointment {
  id: number;
  date: string;
  time: string;
  type: string;
  therapist: string;
  rawDate?: string;
}

interface MyPortalProps {
  upcomingAppointments: Appointment[];
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
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>(initialAppointments);
  const [refreshAppointments, setRefreshAppointments] = useState(0);
  const [isVideoSessionOpen, setIsVideoSessionOpen] = useState(false);
  const [videoRoomUrl, setVideoRoomUrl] = useState<string | null>(null);
  const [isLoadingVideoSession, setIsLoadingVideoSession] = useState(false);
  const [showPHQ9, setShowPHQ9] = useState(false);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | number | null>(null);
  const [clinicianData, setClinicianData] = useState<any>(null);
  const {
    toast
  } = useToast();

  const clientTimeZone = ensureIANATimeZone(clientData?.client_time_zone || getUserTimeZone());

  useEffect(() => {
    const fetchClinicianData = async () => {
      if (!clientData?.client_assigned_therapist) return;
      try {
        const {
          data,
          error
        } = await supabase.from('clinicians').select('*').eq('id', clientData.client_assigned_therapist).single();
        if (error) {
          console.error('Error fetching clinician data:', error);
          return;
        }
        if (data) {
          console.log('Fetched clinician data:', data);
          setClinicianData(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchClinicianData();
  }, [clientData]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!clientData?.id) return;
      try {
        const today = startOfToday();
        const todayStr = format(today, 'yyyy-MM-dd');
        console.log("Fetching appointments for client:", clientData.id);
        console.log("Using time zone:", clientTimeZone);
        const {
          data,
          error
        } = await supabase.from('appointments').select('*').eq('client_id', clientData.id).eq('status', 'scheduled').gte('date', todayStr).order('date', {
          ascending: true
        }).order('start_time', {
          ascending: true
        });
        if (error) {
          console.error('Error fetching appointments:', error);
          return;
        }
        console.log("Appointments data from Supabase:", data);
        if (data && data.length > 0) {
          const formattedAppointments = data.map(appointment => {
            try {
              const formattedDate = format(parseISO(appointment.date), 'MMMM d, yyyy');

              let formattedTime = '';
              try {
                formattedTime = formatTimeInUserTimeZone(appointment.start_time, clientTimeZone,
                'h:mm a');
                console.log(`Formatted time for ${appointment.start_time}: ${formattedTime}`);
              } catch (error) {
                console.error('Error formatting time:', error, {
                  time: appointment.start_time,
                  timezone: clientTimeZone
                });
                formattedTime = formatTime12Hour(appointment.start_time) || 'Time unavailable';
              }
              return {
                id: appointment.id,
                date: formattedDate,
                time: formattedTime,
                type: appointment.type,
                therapist: clinicianName || 'Your Therapist',
                rawDate: appointment.date,
                rawTime: appointment.start_time
              };
            } catch (error) {
              console.error('Error processing appointment:', error, appointment);
              return {
                id: appointment.id,
                date: 'Date processing error',
                time: 'Time processing error',
                type: appointment.type || 'Unknown',
                therapist: clinicianName || 'Your Therapist',
                rawDate: null
              };
            }
          });
          console.log("Formatted appointments:", formattedAppointments);
          setUpcomingAppointments(formattedAppointments);
        } else {
          console.log("No appointments found or empty data array");
          setUpcomingAppointments([]);
        }
      } catch (error) {
        console.error('Error in fetchAppointments:', error);
        toast({
          title: "Error",
          description: "Failed to load your appointments. Please try again later.",
          variant: "destructive"
        });
      }
    };
    fetchAppointments();
  }, [clientData, clinicianName, refreshAppointments, clientTimeZone, toast]);

  const isAppointmentToday = (rawDate: string | undefined | null): boolean => {
    if (!rawDate) return false;
    try {
      return isToday(parseISO(rawDate));
    } catch (error) {
      console.error('Error in isAppointmentToday:', error);
      return false;
    }
  };

  const handleBookingComplete = () => {
    setRefreshAppointments(prev => prev + 1);
    toast({
      title: "Appointment Booked",
      description: "Your appointment has been scheduled successfully!"
    });
  };

  const handleStartSession = async (appointmentId: string | number) => {
    setPendingAppointmentId(appointmentId);
    setShowPHQ9(true);
  };

  const handlePHQ9Complete = async () => {
    setShowPHQ9(false);
    if (pendingAppointmentId) {
      setIsLoadingVideoSession(true);
      try {
        console.log('Starting session for appointment:', pendingAppointmentId);
        const result = await getOrCreateVideoRoom(pendingAppointmentId.toString());
        if (!result.success || !result.url) {
          console.error('Error result from getOrCreateVideoRoom:', result);
          throw new Error(result.error?.message || result.error || 'Failed to create video room');
        }
        console.log('Video room URL obtained:', result.url);
        setVideoRoomUrl(result.url);
        setIsVideoSessionOpen(true);
        toast({
          title: "Video Session Ready",
          description: "You are entering the video session now."
        });
      } catch (error) {
        console.error('Error starting video session:', error);
        toast({
          title: "Error",
          description: error?.message || "Failed to start the video session. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingVideoSession(false);
        setPendingAppointmentId(null);
      }
    }
  };

  const handleCloseVideoSession = () => {
    setIsVideoSessionOpen(false);
  };

  const timeZoneDisplay = formatTimeZoneDisplay(clientTimeZone);
  const todayAppointments = upcomingAppointments.filter(appointment => isAppointmentToday(appointment.rawDate));
  const futureAppointments = upcomingAppointments.filter(appointment => !isAppointmentToday(appointment.rawDate));

  return <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>Sessions scheduled for today</CardDescription>
          </div>
          
        </CardHeader>
        <CardContent>
          {todayAppointments.length > 0 ? <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time <span className="text-xs text-gray-500">({timeZoneDisplay})</span></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Therapist</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAppointments.map(appointment => <TableRow key={appointment.id}>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>{appointment.therapist}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleStartSession(appointment.id)} disabled={isLoadingVideoSession}>
                        {isLoadingVideoSession ? "Loading..." : "Start Session"}
                      </Button>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table> : <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No appointments today</h3>
              <p className="text-sm text-gray-500 mt-1">Check your upcoming appointments below</p>
            </div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Therapist</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsBookingOpen(true)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Book New Appointment
          </Button>
        </CardHeader>
        <CardContent>
          {clientData && clientData.client_assigned_therapist && clinicianData ? <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="flex flex-row gap-6 items-start">
                <Avatar className="h-48 w-48 border-2 border-white shadow-md rounded-md flex-shrink-0">
                  {clinicianData.clinician_image_url ? <AvatarImage src={clinicianData.clinician_image_url} alt={clinicianName || 'Therapist'} className="object-cover h-full w-full" /> : <AvatarFallback className="text-4xl font-medium bg-valorwell-100 text-valorwell-700 h-full w-full">
                      {clinicianData.clinician_first_name?.[0] || ''}{clinicianData.clinician_last_name?.[0] || ''}
                    </AvatarFallback>}
                </Avatar>
                
                <div className="flex-1">
                  {clinicianData.clinician_bio && <>
                      <h4 className="font-medium text-lg mb-2">About {clinicianName}</h4>
                      <p className="text-gray-700 text-sm whitespace-pre-line">{clinicianData.clinician_bio}</p>
                    </>}
                </div>
              </div>
            </div> : <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No Assigned Therapist</h3>
              <p className="text-sm text-gray-500 mt-1">
                You don't have an assigned therapist yet. Please contact the clinic for assistance.
              </p>
            </div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled sessions</CardDescription>
          </div>
          
        </CardHeader>
        <CardContent>
          {futureAppointments.length > 0 ? <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time <span className="text-xs text-gray-500">({timeZoneDisplay})</span></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Therapist</TableHead>
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {futureAppointments.map(appointment => <TableRow key={appointment.id}>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>{appointment.therapist}</TableCell>
                    
                  </TableRow>)}
              </TableBody>
            </Table> : <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No upcoming appointments</h3>
              <p className="text-sm text-gray-500 mt-1">Schedule a session with your therapist</p>
              <Button className="mt-4" onClick={() => setIsBookingOpen(true)}>
                Book Appointment
              </Button>
            </div>}
        </CardContent>
        <CardFooter className="flex justify-between">
          
        </CardFooter>
      </Card>

      <AppointmentBookingDialog open={isBookingOpen} onOpenChange={setIsBookingOpen} clinicianId={clientData?.client_assigned_therapist || null} clinicianName={clinicianName} clientId={clientData?.id || null} onAppointmentBooked={handleBookingComplete} />

      {showPHQ9 && <PHQ9Template onClose={() => setShowPHQ9(false)} clinicianName={clinicianName || "Your Therapist"} clientData={clientData} onComplete={handlePHQ9Complete} />}

      {videoRoomUrl && <VideoChat roomUrl={videoRoomUrl} isOpen={isVideoSessionOpen} onClose={handleCloseVideoSession} />}
    </div>;
};

export default MyPortal;
