import React, { useState, useEffect, useCallback } from 'react';
import { CalendarViewType } from '@/types/calendar';
import Layout from '../components/layout/Layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, RefreshCcw, AlertCircle, Calendar as CalendarIcon, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalendarState } from '../hooks/useCalendarState';
import AppointmentDialog from '../components/calendar/AppointmentDialog';
import { Card } from '@/components/ui/card';
import FullCalendarView from '../components/calendar/FullCalendarView';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CalendarErrorBoundary from '../components/calendar/CalendarErrorBoundary';
import { useUser } from '@/context/UserContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import AvailabilitySettingsDialog from '../components/calendar/AvailabilitySettingsDialog';
import WeeklyAvailabilityDialog from '../components/calendar/WeeklyAvailabilityDialog';
import GoogleCalendarIntegration from '../components/calendar/GoogleCalendarIntegration';
import { getWeekdayName } from '@/utils/dateFormatUtils';
import { DateTime } from 'luxon';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
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
    showAvailability,
    setShowAvailability
  } = useCalendarState();
  const { toast } = useToast();
  const {
    userTimeZone,
    isLoading: isLoadingTimeZone,
    isAuthenticated: isTimeZoneAuthenticated
  } = useTimeZone();
  const {
    userRole,
    isLoading: isUserLoading,
    userId
  } = useUser();
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewType>('dayGridMonth');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [calendarKey, setCalendarKey] = useState<number>(0);
  const [isAvailabilitySettingsOpen, setIsAvailabilitySettingsOpen] = useState(false);
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState<string | null>(null);
  const [isWeeklyAvailabilityOpen, setIsWeeklyAvailabilityOpen] = useState(false);
  const [showGoogleCalendarSettings, setShowGoogleCalendarSettings] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !userId) {
      console.log('[Calendar] User not authenticated, redirecting to login');
      toast({
        title: "Authentication Required",
        description: "Please log in to access the calendar"
      });
      navigate('/login');
    }
  }, [isUserLoading, userId, navigate, toast]);

  useEffect(() => {
    console.log('[Calendar] Page initialized with timezone:', userTimeZone);
    if (isUserLoading || !userId) {
      return;
    }
    const fetchCurrentUser = async () => {
      try {
        const {
          data,
          error
        } = await supabase.auth.getUser();
        if (error) {
          console.error('[Calendar] Error getting current user:', error);
          toast({
            title: "Authentication Error",
            description: "Unable to verify your login status. Please try logging in again.",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }
        if (data?.user) {
          console.log('[Calendar] Current authenticated user:', {
            id: data.user.id,
            email: data.user.email
          });
          setCurrentUserId(data.user.id);
          setUserEmail(data.user.email);
          const {
            data: profileData,
            error: profileError
          } = await supabase.from('profiles').select('role, time_zone').eq('id', data.user.id).maybeSingle();
          if (profileError) {
            console.error('[Calendar] Error fetching user role:', profileError);
          } else if (profileData) {
            console.log('[Calendar] User profile data:', {
              role: profileData.role,
              timeZone: profileData.time_zone
            });
          }
          if (data.user.email && !selectedClinicianId) {
            const {
              data: clinicianData,
              error: clinicianError
            } = await supabase.from('clinicians').select('id').ilike('clinician_email', data.user.email).maybeSingle();
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
          navigate('/login');
        }
      } catch (error) {
        console.error('[Calendar] Exception in user verification:', error);
        toast({
          title: "Error",
          description: "Unable to verify your user information. Please try again.",
          variant: "destructive"
        });
      }
    };
    fetchCurrentUser();
  }, [userTimeZone, selectedClinicianId, toast, userId, isUserLoading, navigate]);

  const handleAppointmentCreated = () => {
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

  const handleCalendarRefresh = useCallback(() => {
    console.log('[Calendar] Refreshing calendar with new key');
    setCalendarKey(prev => prev + 1);
  }, []);

  const handleAvailabilityClick = useCallback((event: any) => {
    if (!event || !event.start) {
      console.error('[Calendar] Invalid event data in availability click handler', event);
      return;
    }
    
    let dayOfWeek;
    try {
      const eventStart = event.start;
      
      if (eventStart instanceof DateTime) {
        dayOfWeek = eventStart.weekdayLong.toLowerCase();
      } 
      else if (eventStart instanceof Date) {
        const dateTime = DateTime.fromJSDate(eventStart).setZone(userTimeZone);
        dayOfWeek = dateTime.weekdayLong.toLowerCase();
      } 
      else {
        dayOfWeek = getWeekdayName(eventStart);
      }
      
      const slotId = event.extendedProps?.id;
      
      console.log('[Calendar] Availability click handler:', {
        date: event.start,
        dayOfWeek,
        slotId,
        eventData: event
      });
      
      setSelectedAvailabilityDate(dayOfWeek);
      setIsWeeklyAvailabilityOpen(true);
      
      if (slotId) {
        localStorage.setItem('selectedAvailabilitySlotId', slotId);
        console.log('[Calendar] Stored availability slot ID in localStorage:', slotId);
      }
    } catch (error) {
      console.error('[Calendar] Error in availability click handler:', error);
      toast({
        title: 'Error',
        description: 'Could not process availability slot. Please try again.',
        variant: 'destructive',
      });
    }
  }, [userTimeZone, toast]);

  const canSelectDifferentClinician = userRole !== 'clinician';
  const canManageAvailability = userRole === 'clinician' || userRole === 'admin';

  if (isUserLoading || isLoadingTimeZone) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-600">Loading calendar information...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!userId) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Authentication required. Please <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/login')}>log in</Button> to access the calendar.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <CalendarErrorBoundary onRetry={handleCalendarRefresh} fallbackUI={
          <div className="p-8 text-center border rounded-lg bg-red-50 border-red-200 my-4">
            <div className="text-xl font-semibold text-red-700 mb-4">
              Something went wrong with the calendar
            </div>
            <Button onClick={handleCalendarRefresh} variant="outline">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reload Calendar
            </Button>
          </div>
        }>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
              <div className="flex items-center gap-2">
                {canManageAvailability && selectedClinicianId && (
                  <div className="flex items-center gap-2 mr-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAvailabilitySettingsOpen(true)} 
                      className="flex items-center gap-2" 
                      title="Availability Settings"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden md:inline">Settings</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        console.log('[Calendar] Opening weekly availability dialog');
                        setSelectedAvailabilityDate(null);
                        localStorage.removeItem('selectedAvailabilitySlotId');
                        setIsWeeklyAvailabilityOpen(true);
                      }} 
                      className="flex items-center gap-2" 
                      title="Manage Weekly Availability"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="hidden md:inline">Schedule Settings</span>
                    </Button>
                    
                    <Button 
                      variant={showAvailability ? "default" : "outline"} 
                      onClick={() => setShowAvailability(!showAvailability)} 
                      className="flex items-center gap-2" 
                      title={showAvailability ? "Hide Availability" : "Show Availability"}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span className="hidden md:inline">
                        {showAvailability ? "Hide" : "Show"} Availability
                      </span>
                    </Button>
                  </div>
                )}

                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>

                <Button variant="ghost" onClick={handleCalendarRefresh} title="Refresh Calendar">
                  <RefreshCcw className="h-4 w-4" />
                </Button>

                {clinicians.length > 1 && canSelectDifferentClinician && (
                  <div className="min-w-[200px]">
                    <Select value={selectedClinicianId || undefined} onValueChange={setSelectedClinicianId}>
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
                          clinicians.map(clinician => (
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

            {selectedClinicianId ? (
              <Card className="p-4">
                <FullCalendarView 
                  key={calendarKey} 
                  clinicianId={selectedClinicianId} 
                  userTimeZone={userTimeZone} 
                  view={calendarViewMode} 
                  height="700px" 
                  showAvailability={showAvailability}
                  onAvailabilityClick={handleAvailabilityClick}
                />
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">
                  {loadingClinicians ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Loading clinicians...
                    </span>
                  ) : clinicians.length === 0 ? (
                    "No clinicians available. Please add clinicians first."
                  ) : (
                    "Please select a clinician to view their calendar."
                  )}
                </p>
              </Card>
            )}
          </div>
        </CalendarErrorBoundary>
      </div>

      <AppointmentDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        clients={clients} 
        loadingClients={loadingClients} 
        selectedClinicianId={selectedClinicianId} 
        onAppointmentCreated={handleAppointmentCreated} 
      />

      {canManageAvailability && selectedClinicianId && (
        <>
          <WeeklyAvailabilityDialog 
            isOpen={isWeeklyAvailabilityOpen} 
            onClose={() => {
              console.log('[Calendar] Closing weekly availability dialog');
              setIsWeeklyAvailabilityOpen(false);
              setSelectedAvailabilityDate(null);
              localStorage.removeItem('selectedAvailabilitySlotId');
            }} 
            clinicianId={selectedClinicianId} 
            onAvailabilityUpdated={handleCalendarRefresh}
            initialActiveTab={selectedAvailabilityDate || 'monday'}
          />
          
          <AvailabilitySettingsDialog 
            isOpen={isAvailabilitySettingsOpen} 
            onClose={() => setIsAvailabilitySettingsOpen(false)} 
            clinicianId={selectedClinicianId} 
            onSettingsSaved={handleCalendarRefresh} 
          />

          {showGoogleCalendarSettings && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowGoogleCalendarSettings(!showGoogleCalendarSettings)} 
                className="mb-4"
              >
                {showGoogleCalendarSettings ? 'Hide' : 'Show'} Google Calendar Settings
              </Button>

              {showGoogleCalendarSettings && (
                <Card className="p-4 mt-4">
                  <GoogleCalendarIntegration 
                    clinicianId={selectedClinicianId} 
                    userTimeZone={userTimeZone} 
                    onSyncComplete={() => {
                      setShowGoogleCalendarSettings(false);
                      handleCalendarRefresh();
                    }} 
                  />
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default CalendarPage;
