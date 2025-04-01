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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import { useUser } from '@/context/UserContext';
import { formatTime12Hour, getUserTimeZone, formatTimeZoneDisplay } from '@/utils/timeZoneUtils';
import { useClinicianData } from '@/hooks/useClinicianData';
import { ClientDetails } from '@/types/client';

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
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const [clientData, setClientData] = useState<ClientDetails | null>(null);
  const { clinicianData } = useClinicianData();
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

  useEffect(() => {
    const fetchClientData = async () => {
      if (currentAppointment && currentAppointment.client_id) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', currentAppointment.client_id)
            .single();
          
          if (error) {
            console.error('Error fetching client data:', error);
            return;
          }
          
          setClientData(data as ClientDetails);
        } catch (error) {
          console.error('Error in fetchClientData:', error);
        }
      }
    };
    
    if (currentAppointment) {
      fetchClientData();
    }
  }, [currentAppointment]);

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

  const openDocumentDialog = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setIsDocumentDialogOpen(true);
    setSelectedStatus(undefined);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    if (value === 'occurred') {
      setIsDocumentDialogOpen(false);
      setShowSessionTemplate(true);
    }
  };

  const handleProvideDocumentation = async () => {
    if (!currentAppointment || !selectedStatus || selectedStatus === 'occurred') return;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'Documented',
          type: selectedStatus === 'no-show' ? 'Late Cancel/No Show' : 'Cancelled'
        })
        .eq('id', currentAppointment.id);
      
      if (error) {
        console.error('Error updating appointment:', error);
        toast({
          title: 'Error',
          description: 'Could not update appointment status. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'Appointment has been documented successfully.',
      });
      
      setIsDocumentDialogOpen(false);
      setSelectedStatus(undefined);
      refetch();
      
    } catch (error) {
      console.error('Error in handleProvideDocumentation:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const closeSessionTemplate = () => {
    setShowSessionTemplate(false);
    setSelectedStatus(undefined);
  };

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
          onClick={() => openDocumentDialog(appointment)}
        >
          <FileText className="h-4 w-4 mr-2" />
          Document Session
        </Button>
      </CardFooter>
    </Card>
  );

  if (showSessionTemplate && currentAppointment) {
    return (
      <Layout>
        <SessionNoteTemplate 
          onClose={closeSessionTemplate}
          clinicianName={clinicianData?.clinician_name || ''}
          clientData={clientData}
          appointmentDate={currentAppointment.date}
        />
      </Layout>
    );
  }

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

      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Document Session</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={handleStatusChange} value={selectedStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occurred">Session Occurred</SelectItem>
                <SelectItem value="no-show">Late Cancel/No Show</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={handleProvideDocumentation}
              disabled={!selectedStatus || selectedStatus === 'occurred'}
            >
              Provide Documentation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ClinicianDashboard;
