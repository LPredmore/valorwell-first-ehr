import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CalendarIcon, PlusCircle } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppointmentBookingDialog from './AppointmentBookingDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  getUserTimeZone, 
  formatTimeZoneDisplay 
} from '@/utils/timeZoneUtils';
import { format, parseISO, startOfToday, isToday } from 'date-fns';

// Import helpers from the API package
import { getOrCreateVideoRoom, checkPHQ9ForAppointment } from '@/packages/api/client';

// Mock component for PHQ9Template until properly created
const PHQ9Template = ({ onClose, clinicianName, clientData, appointmentId, onComplete }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">PHQ-9 Assessment</h2>
      <p className="mb-6">Please complete this assessment before your session.</p>
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onComplete}>Complete</Button>
      </div>
    </div>
  </div>
);

// Mock component for VideoChat until properly created
const VideoChat = ({ roomUrl, isOpen, onClose }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-4xl w-full">
      <h2 className="text-xl font-bold mb-4">Video Session</h2>
      <p className="mb-6">Connected to: {roomUrl}</p>
      <div className="flex justify-end">
        <Button onClick={onClose}>End Session</Button>
      </div>
    </div>
  </div>
);

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
  const [hasAssignedDocuments, setHasAssignedDocuments] = useState<boolean>(false);

  // Ensure we have a valid timezone
  const clientTimeZone = clientData?.client_time_zone || getUserTimeZone();
  
  useEffect(() => {
    const fetchAssignedDocuments = async () => {
      if (!clientData?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('document_assignments')
          .select('*')
          .eq('client_id', clientData.id)
          .eq('status', 'not_started');
          
        if (error) {
          console.error('Error fetching document assignments:', error);
          return;
        }
        
        setHasAssignedDocuments(data && data.length > 0);
        console.log('Assigned documents found:', data?.length || 0);
      } catch (error) {
        console.error('Error checking assigned documents:', error);
      }
    };
    
    fetchAssignedDocuments();
  }, [clientData]);

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
        toast.error("Failed to load your appointments. Please try again later.");
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
    toast.success("Your appointment has been scheduled successfully!");
  };

  const handleStartSession = async (appointmentId: string | number) => {
    setPendingAppointmentId(appointmentId);
    handlePHQ9Complete();
  };

  const handlePHQ9Complete = async () => {
    setShowPHQ9(false);
    if (pendingAppointmentId) {
      setIsLoadingVideoSession(true);
      try {
        const result = await getOrCreateVideoRoom(pendingAppointmentId.toString());
        setVideoRoomUrl(result.url || null);
        setIsVideoSessionOpen(true);
        toast.success("You are entering the video session now.");
      } catch (error) {
        toast.error("We couldn't start the video session. Please try again or contact support.");
      } finally {
        setIsLoadingVideoSession(false);
        setPendingAppointmentId(null);
      }
    }
  };

  const handleCloseVideoSession = () => {
    setIsVideoSessionOpen(false);
    setVideoRoomUrl(null);
  };

  const timeZoneDisplay = formatTimeZoneDisplay(clientTimeZone);
  const todayAppointments = upcomingAppointments.filter(appointment => isAppointmentToday(appointment.rawDate));
  const futureAppointments = upcomingAppointments.filter(appointment => !isAppointmentToday(appointment.rawDate));

  const showBookingButtons = clientData?.client_status !== 'Profile Complete' || !hasAssignedDocuments;
  
  // Helper function to format times
  const formatTimeInUserTimeZone = (time: string, timeZone: string, format: string = 'h:mm a') => {
    try {
      // Simple formatting fallback
      if (!time) return 'Time not available';
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return time;
    }
  };
  
  const formatTime12Hour = (time: string) => {
    if (!time) return null;
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return time;
    }
  };
  
  const isAppointmentToday = (rawDate: string | undefined | null): boolean => {
    if (!rawDate) return false;
    try {
      return isToday(parseISO(rawDate));
    } catch (error) {
      return false;
    }
  };
  
  const handleBookingComplete = () => {
    setRefreshAppointments(prev => prev + 1);
    toast.success("Your appointment has been scheduled successfully!");
  };
  
  const handleStartSession = async (appointmentId: string | number) => {
    setPendingAppointmentId(appointmentId);
    handlePHQ9Complete();
  };
  
  const handlePHQ9Complete = async () => {
    setShowPHQ9(false);
    if (pendingAppointmentId) {
      setIsLoadingVideoSession(true);
      try {
        const result = await getOrCreateVideoRoom(pendingAppointmentId.toString());
        setVideoRoomUrl(result.url || null);
        setIsVideoSessionOpen(true);
        toast.success("You are entering the video session now.");
      } catch (error) {
        toast.error("We couldn't start the video session. Please try again or contact support.");
      } finally {
        setIsLoadingVideoSession(false);
        setPendingAppointmentId(null);
      }
    }
  };
  
  const handleCloseVideoSession = () => {
    setIsVideoSessionOpen(false);
    setVideoRoomUrl(null);
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Today's Appointments Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>Sessions scheduled for today</CardDescription>
          </div>
          {showBookingButtons && (
            <Button variant="outline" size="sm" onClick={() => setIsBookingOpen(true)}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Book New Appointment
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!showBookingButtons && hasAssignedDocuments && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You still need to complete the Assigned Documents before you can schedule your appointment.
              </AlertDescription>
            </Alert>
          )}
          
          {todayAppointments.length > 0 ? (
            <Table>
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
                {todayAppointments.map(appointment => (
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
                        disabled={isLoadingVideoSession}
                      >
                        {isLoadingVideoSession ? "Loading..." : "Start Session"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No appointments today</h3>
              <p className="text-sm text-gray-500 mt-1">Check your upcoming appointments below</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Therapist Card - simplified */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Therapist</CardTitle>
          {showBookingButtons && (
            <Button variant="outline" size="sm" onClick={() => setIsBookingOpen(true)}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Book New Appointment
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium">Therapist Information</h3>
            <p className="text-sm text-gray-500 mt-1">{clinicianName || 'No assigned therapist'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled sessions</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {futureAppointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time <span className="text-xs text-gray-500">({timeZoneDisplay})</span></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Therapist</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {futureAppointments.map(appointment => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>{appointment.therapist}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No upcoming appointments</h3>
              <p className="text-sm text-gray-500 mt-1">Schedule a session with your therapist</p>
              {showBookingButtons && (
                <Button className="mt-4" onClick={() => setIsBookingOpen(true)}>
                  Book Appointment
                </Button>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {/* Footer content if needed */}
        </CardFooter>
      </Card>

      {/* Dialogs */}
      <AppointmentBookingDialog 
        open={isBookingOpen} 
        onOpenChange={setIsBookingOpen} 
        clinicianId={clientData?.client_assigned_therapist || null} 
        clinicianName={clinicianName} 
        clientId={clientData?.id || null} 
        onAppointmentBooked={handleBookingComplete}
        userTimeZone={clientTimeZone}
        disabled={!showBookingButtons}
      />

      {showPHQ9 && (
        <PHQ9Template 
          onClose={() => setShowPHQ9(false)} 
          clinicianName={clinicianName || "Your Therapist"} 
          clientData={clientData}
          appointmentId={pendingAppointmentId}
          onComplete={handlePHQ9Complete} 
        />
      )}

      {videoRoomUrl && (
        <VideoChat 
          roomUrl={videoRoomUrl} 
          isOpen={isVideoSessionOpen} 
          onClose={handleCloseVideoSession} 
        />
      )}
    </div>
  );
};

export default MyPortal;
