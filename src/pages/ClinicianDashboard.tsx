
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import { useUser } from '@/context/UserContext';
import { useClinicianData } from '@/hooks/useClinicianData';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useClientData } from '@/hooks/useClientData';
import AppointmentsList from '@/components/dashboard/AppointmentsList';
import DocumentSessionDialog from '@/components/dashboard/DocumentSessionDialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import VideoSessionManager, { VideoSessionManagerRef } from '@/components/dashboard/VideoSessionManager';

const ClinicianDashboard = () => {
  const { toast } = useToast();
  const { userRole, userId } = useUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [showSessionTemplate, setShowSessionTemplate] = useState(false);
  const { clinicianData } = useClinicianData();
  const videoSessionManagerRef = useRef<VideoSessionManagerRef>(null);

  // Setup user ID from Supabase auth
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    fetchUserId();
  }, []);

  // Get appointments data
  const { 
    todayAppointments, 
    upcomingAppointments, 
    pastAppointments,
    isLoading: isLoadingAppointments, 
    error, 
    refetch 
  } = useAppointments(currentUserId);

  // Get client data for selected appointment
  const { 
    clientData, 
    isLoading: isLoadingClientData 
  } = useClientData(currentAppointment?.client_id || null);

  // Handler for starting a video session
  const startVideoSession = async (appointment: Appointment) => {
    if (videoSessionManagerRef.current) {
      await videoSessionManagerRef.current.startVideoSession(appointment);
    }
  };

  // Open document dialog for an appointment
  const openDocumentDialog = (appointment: Appointment) => {
    console.log("Opening document dialog for appointment:", appointment);
    setCurrentAppointment(appointment);
    setIsDocumentDialogOpen(true);
    setSelectedStatus(undefined);
  };

  // Handle status change in document dialog
  const handleStatusChange = (value: string) => {
    console.log("Status changed to:", value);
    setSelectedStatus(value);
    if (value === 'occurred') {
      setIsDocumentDialogOpen(false);
      setShowSessionTemplate(true);
    }
  };

  // Provide documentation for an appointment
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

  // Close session template
  const closeSessionTemplate = () => {
    console.log("Closing session template");
    setShowSessionTemplate(false);
    setSelectedStatus(undefined);
    setCurrentAppointment(null);
    refetch(); // Refresh appointments after closing template
  };

  // Show loading indicator while everything is loading
  const isLoading = isLoadingAppointments || (showSessionTemplate && isLoadingClientData);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">
            {showSessionTemplate ? "Loading client data..." : "Loading appointments..."}
          </p>
        </div>
      </Layout>
    );
  }
  
  // Show session template if it's active and client data is loaded
  if (showSessionTemplate && currentAppointment && clientData) {
    return (
      <Layout>
        <SessionNoteTemplate 
          onClose={closeSessionTemplate}
          clinicianName={clinicianData?.clinician_professional_name || ''}
          clinicianNameInsurance={clinicianData?.clinician_nameinsurance || ''}
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
          {/* Today's Appointments */}
          <div>
            <AppointmentsList
              title={<><Calendar className="h-5 w-5 mr-2" />Today's Appointments</>}
              appointments={todayAppointments}
              isLoading={isLoadingAppointments}
              error={error}
              emptyMessage="No appointments scheduled for today."
              showStartButton={true}
              onStartSession={startVideoSession}
            />
          </div>
          
          {/* Outstanding Documentation */}
          <div>
            <AppointmentsList
              title={<><AlertCircle className="h-5 w-5 mr-2" />Outstanding Documentation</>}
              appointments={pastAppointments}
              isLoading={isLoadingAppointments}
              error={error}
              emptyMessage="No outstanding documentation."
              onDocumentSession={openDocumentDialog}
            />
          </div>
          
          {/* Upcoming Appointments */}
          <div>
            <AppointmentsList
              title={<><Calendar className="h-5 w-5 mr-2" />Upcoming Appointments</>}
              appointments={upcomingAppointments}
              isLoading={isLoadingAppointments}
              error={error}
              emptyMessage="No upcoming appointments scheduled."
              limit={5}
              showViewMore={true}
              viewMoreCount={upcomingAppointments.length}
              onViewMore={() => console.log("View all upcoming appointments")}
            />
          </div>
        </div>
      </div>
      
      {/* Document Session Dialog */}
      <DocumentSessionDialog
        isOpen={isDocumentDialogOpen}
        onOpenChange={setIsDocumentDialogOpen}
        selectedAppointment={currentAppointment}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        onSubmit={handleProvideDocumentation}
      />
      
      {/* Video Session Manager */}
      <VideoSessionManager 
        ref={videoSessionManagerRef}
        onRefetchAppointments={refetch}
      />
    </Layout>
  );
};

export default ClinicianDashboard;
