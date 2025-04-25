
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import VideoChat from '@/components/video/VideoChat';
import { AppointmentsList } from '@/components/dashboard/AppointmentsList';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import { useAppointments } from '@/hooks/useAppointments';
import { SessionDidNotOccurDialog } from '@/components/dashboard/SessionDidNotOccurDialog';
import { useTimeZone } from '@/context/TimeZoneContext';
import { Skeleton } from '@/components/ui/skeleton';
import GoogleCalendarIntegration from '@/components/calendar/GoogleCalendarIntegration';
import { TimeZoneService } from '@/utils/timeZoneService';

const ClinicianDashboard: React.FC = () => {
  const { userRole, userId } = useUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { userTimeZone, isLoading: isLoadingTimeZone } = useTimeZone();
  const timeZoneDisplay = TimeZoneService.formatTimeZoneDisplay(userTimeZone);
  const [showSessionDidNotOccurDialog, setShowSessionDidNotOccurDialog] = useState(false);
  const [selectedAppointmentForNoShow, setSelectedAppointmentForNoShow] = useState<any>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    fetchUserId();
  }, []);

  const {
    todayAppointments,
    upcomingAppointments,
    pastAppointments,
    isLoading,
    error,
    refetch,
    currentAppointment,
    isVideoOpen,
    currentVideoUrl,
    showSessionTemplate,
    clientData,
    isLoadingClientData,
    startVideoSession,
    openSessionTemplate,
    closeSessionTemplate,
    closeVideoSession
  } = useAppointments(currentUserId);

  const handleSessionDidNotOccur = (appointment: any) => {
    setSelectedAppointmentForNoShow(appointment);
    setShowSessionDidNotOccurDialog(true);
  };

  const closeSessionDidNotOccurDialog = () => {
    setShowSessionDidNotOccurDialog(false);
    setSelectedAppointmentForNoShow(null);
  };

  if (showSessionTemplate && currentAppointment) {
    return (
      <Layout>
        <SessionNoteTemplate 
          onClose={closeSessionTemplate}
          appointment={currentAppointment}
          clinicianName={userId}
          clientData={clientData}
        />
      </Layout>
    );
  }

  // Show loading state while time zone is loading
  if (isLoadingTimeZone) {
    return (
      <Layout>
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Clinician Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center mb-4">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-[200px] w-full" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Clinician Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Today's Appointments */}
          <div>
            <AppointmentsList
              title="Today's Appointments"
              icon={<Calendar className="h-5 w-5 mr-2" />}
              appointments={todayAppointments}
              isLoading={isLoading}
              error={error}
              emptyMessage="No appointments scheduled for today."
              timeZoneDisplay={timeZoneDisplay}
              userTimeZone={userTimeZone}
              showStartButton={true}
              onStartSession={startVideoSession}
            />
          </div>
          
          {/* Outstanding Documentation */}
          <div>
            <AppointmentsList
              title="Outstanding Documentation"
              icon={<AlertCircle className="h-5 w-5 mr-2" />}
              appointments={pastAppointments}
              isLoading={isLoading || isLoadingClientData}
              error={error}
              emptyMessage="No outstanding documentation."
              timeZoneDisplay={timeZoneDisplay}
              userTimeZone={userTimeZone}
              onDocumentSession={openSessionTemplate}
              onSessionDidNotOccur={handleSessionDidNotOccur}
            />
          </div>
          
          {/* Upcoming Appointments */}
          <div>
            <AppointmentsList
              title="Upcoming Appointments"
              icon={<Calendar className="h-5 w-5 mr-2" />}
              appointments={upcomingAppointments}
              isLoading={isLoading}
              error={error}
              emptyMessage="No upcoming appointments scheduled."
              timeZoneDisplay={timeZoneDisplay}
              userTimeZone={userTimeZone}
              showViewAllButton={true}
            />
          </div>
        </div>
        
        {/* Google Calendar Integration */}
        {currentUserId && (
          <div className="mb-6">
            <GoogleCalendarIntegration 
              clinicianId={currentUserId} 
              userTimeZone={userTimeZone}
              onSyncComplete={refetch}
            />
          </div>
        )}
      </div>
      
      {/* Video Chat Component */}
      {isVideoOpen && (
        <VideoChat
          roomUrl={currentVideoUrl}
          isOpen={isVideoOpen}
          onClose={closeVideoSession}
        />
      )}

      {/* Session Did Not Occur Dialog */}
      {showSessionDidNotOccurDialog && selectedAppointmentForNoShow && (
        <SessionDidNotOccurDialog
          isOpen={showSessionDidNotOccurDialog}
          onClose={closeSessionDidNotOccurDialog}
          appointmentId={selectedAppointmentForNoShow.id}
          onStatusUpdate={refetch}
        />
      )}
    </Layout>
  );
};

export default ClinicianDashboard;
