import React, { useState, useEffect, useCallback } from 'react';
import { CalendarViewType } from '@/types/calendar';
import Layout from '../components/layout/Layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarState } from '../hooks/useCalendarState';
import AppointmentDialog from '../components/calendar/AppointmentDialog';
import { Card } from '@/components/ui/card';
import FullCalendarView from '../components/calendar/FullCalendarView';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AvailabilityPanel from '../components/calendar/AvailabilityPanel';

const CalendarPage: React.FC = () => {
  const {
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    setAppointmentRefreshTrigger,
    isDialogOpen,
    setIsDialogOpen,
  } = useCalendarState();

  const { toast } = useToast();
  const { userTimeZone, isLoading: isLoadingTimeZone } = useTimeZone();
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewType>('dayGridMonth');
  const [showAvailability, setShowAvailability] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAvailabilityPanel, setShowAvailabilityPanel] = useState<boolean>(false);

  useEffect(() => {
    console.log('[Calendar] Page initialized with timezone:', userTimeZone);
    const fetchCurrentUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('[Calendar] Error getting current user:', error);
          toast({
            title: "Authentication Error",
            description: "Unable to verify your login status. Please try logging in again.",
            variant: "destructive"
          });
          return;
        }
        
        if (data?.user) {
          console.log('[Calendar] Current authenticated user:', {
            id: data.user.id,
            email: data.user.email,
          });
          
          setCurrentUserId(data.user.id);
          setUserEmail(data.user.email);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role, time_zone')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('[Calendar] Error fetching user role:', profileError);
          } else if (profileData) {
            setUserRole(profileData.role);
            console.log('[Calendar] User profile data:', {
              role: profileData.role,
              timeZone: profileData.time_zone
            });
          }
          
          if (data.user.email && !selectedClinicianId) {
            const { data: clinicianData, error: clinicianError } = await supabase
              .from('clinicians')
              .select('id')
              .ilike('clinician_email', data.user.email)
              .single();
              
            if (clinicianError && clinicianError.code !== 'PGRST116') {
              console.error('[Calendar] Error finding clinician by email:', clinicianError);
            } else if (clinicianData) {
              console.log('[Calendar] Found clinician by email:', clinicianData.id);
              setSelectedClinicianId(clinicianData.id);
            } else {
              console.log('[Calendar] No clinician found for email:', data.user.email);
            }
          }
        } else {
          console.log('[Calendar] No authenticated user found');
          setCurrentUserId(null);
          setUserEmail(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('[Calendar] Exception in user verification:', error);
      }
    };
    
    fetchCurrentUser();
  }, [userTimeZone]);

  const handleAppointmentCreated = () => {
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

  const canSelectDifferentClinician = userRole !== 'clinician';
  const canManageAvailability = userRole === 'clinician' || userRole === 'admin';

  if (isLoadingTimeZone) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center gap-4">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>

              {canManageAvailability && (
                <Button 
                  variant={showAvailabilityPanel ? "secondary" : "outline"}
                  onClick={() => setShowAvailabilityPanel(prev => !prev)}
                >
                  <CalendarClock className="h-4 w-4 mr-2" />
                  {showAvailabilityPanel ? "Hide Availability" : "Manage Availability"}
                </Button>
              )}

              {clinicians.length > 1 && canSelectDifferentClinician && (
                <div className="min-w-[200px]">
                  <Select
                    value={selectedClinicianId || undefined}
                    onValueChange={setSelectedClinicianId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a clinician" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingClinicians ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : (
                        clinicians.map((clinician) => (
                          <SelectItem key={clinician.id} value={clinician.id}>
                            {clinician.clinician_professional_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {showAvailabilityPanel && selectedClinicianId && canManageAvailability ? (
            <AvailabilityPanel />
          ) : (
            <Card className="p-4">
              <FullCalendarView
                clinicianId={selectedClinicianId}
                userTimeZone={userTimeZone}
                view={calendarViewMode}
                showAvailability={true}
                height="700px"
                events={[]}
              />
            </Card>
          )}
        </div>
      </div>

      <AppointmentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        clients={clients}
        loadingClients={loadingClients}
        selectedClinicianId={selectedClinicianId}
        onAppointmentCreated={handleAppointmentCreated}
      />
    </Layout>
  );
};

export default CalendarPage;
