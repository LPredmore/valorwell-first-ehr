import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/packages/api/client';
import { format, parseISO, startOfToday, isToday } from 'date-fns';
import { formatTimeZoneDisplay, ensureIANATimeZone, getUserTimeZone } from '@/utils/timeZoneUtils';
import AppointmentBookingDialog from '@/components/patient/AppointmentBookingDialog';
import PHQ9Template from '@/packages/forms/components/templates/PHQ9Template';
import VideoChat from '@/components/video/VideoChat';
import { getOrCreateVideoRoom, checkPHQ9ForAppointment } from '@/packages/api/client';
import TodayAppointments from './TodayAppointments';
import TherapistCard from './TherapistCard';
import UpcomingAppointments from './UpcomingAppointments';
import { 
  formatTimeInUserTimeZone, 
  formatTime12Hour, 
  ensureIANATimeZone as ensureIANATimeZoneCore 
} from '@/utils/timeZoneUtils';

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
  const {
    toast
  } = useToast();

  const clientTimeZone = ensureIANATimeZone(clientData?.client_time_zone || getUserTimeZone());
  
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
    
    try {
      console.log(`Checking for existing PHQ-9 assessment for appointment: ${appointmentId}`);
      const { exists: phq9Exists, error } = await checkPHQ9ForAppointment(appointmentId.toString());
      
      if (error) {
        console.error('Error checking for PHQ-9 assessment:', error);
        toast({
          title: "Note",
          description: "We'll start with a quick PHQ-9 assessment before your session."
        });
        setShowPHQ9(true);
        return;
      }
      
      if (phq9Exists) {
        console.log('PHQ-9 assessment already exists for appointment:', appointmentId);
        handlePHQ9Complete();
      } else {
        console.log('No PHQ-9 assessment found, showing assessment form');
        setShowPHQ9(true);
      }
    } catch (error) {
      console.error('Error in handleStartSession:', error);
      setShowPHQ9(true);
    }
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
          description: "We couldn't start the video session. Please try again or contact support.",
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
    setVideoRoomUrl(null);
  };

  const timeZoneDisplay = formatTimeZoneDisplay(clientTimeZone);
  const todayAppointments = upcomingAppointments.filter(appointment => isAppointmentToday(appointment.rawDate));
  const futureAppointments = upcomingAppointments.filter(appointment => !isAppointmentToday(appointment.rawDate));
  const showBookingButtons = clientData?.client_status !== 'Profile Complete' || !hasAssignedDocuments;

  return (
    <div className="grid grid-cols-1 gap-6">
      <TodayAppointments
        appointments={todayAppointments}
        timeZoneDisplay={timeZoneDisplay}
        showBookingButtons={showBookingButtons}
        hasAssignedDocuments={hasAssignedDocuments}
        isLoadingVideoSession={isLoadingVideoSession}
        onStartSession={handleStartSession}
        onBookAppointment={() => setIsBookingOpen(true)}
      />

      <TherapistCard
        clinicianData={clinicianData}
        clinicianName={clinicianName}
        showBookingButtons={showBookingButtons}
        onBookAppointment={() => setIsBookingOpen(true)}
      />

      <UpcomingAppointments
        appointments={futureAppointments}
        timeZoneDisplay={timeZoneDisplay}
        showBookingButtons={showBookingButtons}
        onBookAppointment={() => setIsBookingOpen(true)}
      />

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
