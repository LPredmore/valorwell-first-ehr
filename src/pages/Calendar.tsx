import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import CalendarView from '../components/calendar/CalendarView';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { useCalendarState } from '../hooks/useCalendarState';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarViewControls from '../components/calendar/CalendarViewControls';
import AppointmentDialog from '../components/calendar/AppointmentDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CalendarPage = () => {
  const {
    showAvailability,
    setShowAvailability,
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    currentDate,
    setCurrentDate,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    setAppointmentRefreshTrigger,
    isDialogOpen,
    setIsDialogOpen,
    userTimeZone,
    isLoadingTimeZone,
  } = useCalendarState();

  // Use only the month view mode state
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week'>('month');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  // Add logging for current user
  useEffect(() => {
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
          
          // Fetch user role
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('[Calendar] Error fetching user role:', profileError);
          } else if (profileData) {
            setUserRole(profileData.role);
            console.log('[Calendar] User role:', profileData.role);
          }
          
          // If we have a user email but no selectedClinicianId, try to find the clinician
          if (data.user.email && !selectedClinicianId) {
            // Updated: Use case-insensitive comparison with ILIKE
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
              // Potential UI feedback could go here
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
  }, []);

  // Log key state changes
  useEffect(() => {
    console.log(`[Calendar] Selected clinicianId: "${selectedClinicianId}"`);
  }, [selectedClinicianId]);

  useEffect(() => {
    console.log(`[Calendar] Calendar view mode changed to: ${calendarViewMode}`);
  }, [calendarViewMode]);

  useEffect(() => {
    console.log(`[Calendar] Current date changed to: ${currentDate.toISOString()}`);
  }, [currentDate]);

  useEffect(() => {
    console.log(`[Calendar] Available clinicians loaded: ${clinicians.length}`);
    if (clinicians.length > 0) {
      clinicians.forEach(c => console.log(`  - Clinician: ${c.clinician_professional_name} (ID: ${c.id})`));
    }
  }, [clinicians]);

  const navigatePrevious = () => {
    if (calendarViewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (calendarViewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const toggleAvailability = () => {
    setShowAvailability(!showAvailability);
  };

  const handleAppointmentCreated = () => {
    console.log('[Calendar] Appointment created, triggering refresh');
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

  // Determine if user is allowed to change clinician selection
  // Only allow admin or non-clinician users to change clinician selection
  const canSelectDifferentClinician = userRole !== 'clinician';

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center gap-4">
              <Tabs value={calendarViewMode} onValueChange={(value) => setCalendarViewMode(value as 'month' | 'week')}>
                <TabsList>
                  <TabsTrigger value="month">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="week">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Weekly
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant={showAvailability ? "default" : "outline"}
                onClick={toggleAvailability}
              >
                <Clock className="mr-2 h-4 w-4" />
                Availability
              </Button>

              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>

              {clinicians.length > 1 && canSelectDifferentClinician && (
                <div className="min-w-[200px]">
                  <Select
                    value={selectedClinicianId || undefined}
                    onValueChange={(value) => {
                      console.log(`[Calendar] Selected clinician changed to: ${value}`);
                      setSelectedClinicianId(value);
                    }}
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

          <CalendarHeader
            currentDate={currentDate}
            view={calendarViewMode}
            userTimeZone={userTimeZone}
            isLoadingTimeZone={isLoadingTimeZone}
            onNavigatePrevious={navigatePrevious}
            onNavigateNext={navigateNext}
            onNavigateToday={navigateToday}
          />

          <CalendarView
            view="month"
            showAvailability={showAvailability}
            clinicianId={selectedClinicianId}
            userTimeZone={userTimeZone}
            refreshTrigger={appointmentRefreshTrigger}
            monthViewMode={calendarViewMode}
            currentDate={currentDate}
          />
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
