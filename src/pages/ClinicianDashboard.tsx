
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import VideoChat from '@/components/video/VideoChat';
import { getUserTimeZone, formatTimeZoneDisplay } from '@/utils/timeZoneUtils';
import { AppointmentsList } from '@/components/dashboard/AppointmentsList';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import { useAppointments } from '@/hooks/useAppointments';
import { getClinicianTimeZone } from '@/hooks/useClinicianData';
import { SessionDidNotOccurDialog } from '@/components/dashboard/SessionDidNotOccurDialog';
import { Appointment } from '@/types/appointment';

const ClinicianDashboard = () => {
  const { userRole, userId } = useUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>(getUserTimeZone());
  const [isLoadingTimeZone, setIsLoadingTimeZone] = useState(true);
  const timeZoneDisplay = formatTimeZoneDisplay(clinicianTimeZone);
  const [showSessionDidNotOccurDialog, setShowSessionDidNotOccurDialog] = useState(false);
  const [selectedAppointmentForNoShow, setSelectedAppointmentForNoShow] = useState<Appointment | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    fetchUserId();
  }, []);

  // Fetch clinician's timezone
  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (currentUserId) {
        setIsLoadingTimeZone(true);
        try {
          const timeZone = await getClinicianTimeZone(currentUserId);
          console.log("Fetched clinician timezone:", timeZone);
          setClinicianTimeZone(timeZone);
        } catch (error) {
          console.error("Error fetching clinician timezone:", error);
          // Fallback to system timezone
          setClinicianTimeZone(getUserTimeZone());
        } finally {
          setIsLoadingTimeZone(false);
        }
      }
    };
    
    fetchClinicianTimeZone();
  }, [currentUserId]);

  const {
    appointments,
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

  const handleSessionDidNotOccur = (appointment: Appointment) => {
    setSelectedAppointmentForNoShow(appointment);
    setShowSessionDidNotOccurDialog(true);
  };

  const closeSessionDidNotOccurDialog = () => {
    setShowSessionDidNotOccurDialog(false);
    setSelectedAppointmentForNoShow(null);
  };

  // Create a type adapter function to ensure clientData is handled properly by SessionNoteTemplate
  const prepareClientDataForTemplate = () => {
    if (!clientData) return null;
    
    // Return the data with known structure, adding any required properties for SessionNoteTemplate
    return {
      id: clientData.id,
      client_first_name: clientData.client_first_name || '',
      client_last_name: clientData.client_last_name || '',
      client_preferred_name: clientData.client_preferred_name || '',
      client_email: clientData.client_email || '',
      client_phone: clientData.client_phone || '',
      client_date_of_birth: clientData.client_date_of_birth || null,
      // Include any other required properties that SessionNoteTemplate needs
    };
  };

  if (showSessionTemplate && currentAppointment) {
    return (
      <Layout>
        <SessionNoteTemplate 
          onClose={closeSessionTemplate}
          appointment={currentAppointment}
          clinicianName={userId}
          clientData={prepareClientDataForTemplate()}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Clinician Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div>
            <AppointmentsList
              title="Today's Appointments"
              icon={<Calendar className="h-5 w-5 mr-2" />}
              appointments={todayAppointments}
              isLoading={isLoading || isLoadingTimeZone}
              error={error}
              emptyMessage="No appointments scheduled for today."
              timeZoneDisplay={timeZoneDisplay}
              userTimeZone={clinicianTimeZone}
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
              isLoading={isLoading || isLoadingTimeZone || isLoadingClientData}
              error={error}
              emptyMessage="No outstanding documentation."
              timeZoneDisplay={timeZoneDisplay}
              userTimeZone={clinicianTimeZone}
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
              isLoading={isLoading || isLoadingTimeZone}
              error={error}
              emptyMessage="No upcoming appointments scheduled."
              timeZoneDisplay={timeZoneDisplay}
              userTimeZone={clinicianTimeZone}
              showViewAllButton={true}
            />
          </div>
        </div>
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
