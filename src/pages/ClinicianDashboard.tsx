
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isFuture, parseISO, isAfter, isBefore } from 'date-fns';
import { AlertCircle, Calendar, Clock, UserCircle, Video, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import VideoChat from '@/components/video/VideoChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/context/UserContext';
import { formatTime12Hour, getUserTimeZone, formatTimeZoneDisplay } from '@/utils/timeZoneUtils';

type Appointment = {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  video_room_url: string | null;
  client?: {
    client_first_name: string;
    client_last_name: string;
  };
};

const ClinicianDashboard = () => {
  const { toast } = useToast();
  const { userRole, userId } = useUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const clinicianTimeZone = getUserTimeZone(); // Get clinician's timezone

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    fetchUserId();
  }, []);

  const { data: appointments, isLoading, error, refetch } = useQuery({
    queryKey: ['clinician-appointments', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      console.log('Fetching appointments for clinician:', currentUserId);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          date,
          start_time,
          end_time,
          type,
          status,
          video_room_url,
          clients (
            client_first_name,
            client_last_name
          )
        `)
        .eq('clinician_id', currentUserId)
        .order('date')
        .order('start_time');

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      return data.map((appointment: any) => ({
        ...appointment,
        client: appointment.clients
      }));
    },
    enabled: !!currentUserId
  });

  const todayAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isToday(appointmentDate);
  }) || [];

  const upcomingAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isFuture(appointmentDate) && !isToday(appointmentDate);
  }) || [];

  const pastAppointments = appointments?.filter(appointment => {
    const appointmentDate = parseISO(appointment.date);
    return isBefore(appointmentDate, new Date()) && !isToday(appointmentDate);
  }) || [];

  const canStartSession = (appointment: Appointment) => {
    return true;
  };

  const startVideoSession = async (appointment: Appointment) => {
    try {
      console.log("Starting video session for appointment:", appointment.id);
      
      if (appointment.video_room_url) {
        console.log("Using existing video room URL:", appointment.video_room_url);
        setCurrentVideoUrl(appointment.video_room_url);
        setIsVideoOpen(true);
      } else {
        console.log("Creating new video room for appointment:", appointment.id);
        const result = await getOrCreateVideoRoom(appointment.id);
        console.log("Video room creation result:", result);
        
        if (result.success && result.url) {
          setCurrentVideoUrl(result.url);
          setIsVideoOpen(true);
          refetch();
        } else {
          console.error("Failed to create video room:", result.error);
          throw new Error('Failed to create video room');
        }
      }
    } catch (error) {
      console.error('Error starting video session:', error);
      toast({
        title: 'Error',
        description: 'Could not start the video session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (timeString: string) => {
    return formatTime12Hour(timeString);
  };

  const timeZoneDisplay = formatTimeZoneDisplay(clinicianTimeZone);

  const renderAppointmentCard = (appointment: Appointment, showStartButton = false) => (
    <Card key={appointment.id} className="mb-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)} 
          <span className="text-xs text-gray-500 ml-1">({timeZoneDisplay})</span>
        </CardTitle>
        <CardDescription className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          {format(parseISO(appointment.date), 'EEEE, MMMM do, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center">
          <UserCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {appointment.client?.client_first_name} {appointment.client?.client_last_name}
          </span>
        </div>
        <div className="text-sm mt-1">{appointment.type}</div>
      </CardContent>
      {showStartButton && (
        <CardFooter>
          <Button
            variant="default"
            size="sm"
            className="w-full"
            disabled={!canStartSession(appointment)}
            onClick={() => startVideoSession(appointment)}
          >
            <Video className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        </CardFooter>
      )}
    </Card>
  );

  const renderPastAppointmentCard = (appointment: Appointment) => (
    <Card key={appointment.id} className="mb-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center">
          <UserCircle className="h-4 w-4 mr-2" />
          {appointment.client?.client_first_name} {appointment.client?.client_last_name}
        </CardTitle>
        <CardDescription className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          {format(parseISO(appointment.date), 'EEEE, MMMM do, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
          </span>
        </div>
        <div className="text-sm mt-1">{appointment.type}</div>
      </CardContent>
      <CardFooter>
        <Button
          variant="default"
          size="sm"
          className="w-full"
        >
          <FileText className="h-4 w-4 mr-2" />
          Document Session
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Clinician Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today's Appointments
            </h2>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="mb-3">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : error ? (
              <div className="text-red-500 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Error loading appointments
              </div>
            ) : todayAppointments.length === 0 ? (
              <p className="text-gray-500">No appointments scheduled for today.</p>
            ) : (
              todayAppointments.map(appointment => renderAppointmentCard(appointment, true))
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Outstanding Documentation
            </h2>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="mb-3">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                  </CardHeader>
                  <CardContent className="pb-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : error ? (
              <div className="text-red-500 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Error loading appointments
              </div>
            ) : pastAppointments.length === 0 ? (
              <p className="text-gray-500">No outstanding documentation.</p>
            ) : (
              pastAppointments.map(appointment => renderPastAppointmentCard(appointment))
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Appointments
            </h2>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="mb-3">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <div className="text-red-500 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Error loading appointments
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <p className="text-gray-500">No upcoming appointments scheduled.</p>
            ) : (
              upcomingAppointments.slice(0, 5).map(appointment => renderAppointmentCard(appointment))
            )}
            {upcomingAppointments.length > 5 && (
              <Button variant="link" className="mt-2 p-0">
                View all {upcomingAppointments.length} upcoming appointments
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {isVideoOpen && (
        <VideoChat
          roomUrl={currentVideoUrl}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </Layout>
  );
};

export default ClinicianDashboard;
