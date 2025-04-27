
import React, { useCallback, useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useCalendarState } from '../hooks/useCalendarState';
import AppointmentDialog from '../components/calendar/AppointmentDialog';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import CalendarLoading from '@/components/calendar/CalendarLoading';
import CalendarAuthError from '@/components/calendar/CalendarAuthError';
import AvailabilitySettingsDialog from '../components/calendar/AvailabilitySettingsDialog';
import WeeklyAvailabilityDialog from '../components/calendar/WeeklyAvailabilityDialog';
import SingleAvailabilityDialog from '../components/calendar/SingleAvailabilityDialog';
import CalendarDiagnosticDialog from '../components/calendar/CalendarDiagnosticDialog';
import { getWeekdayName } from '@/utils/dateFormatUtils';
import { DateTime } from 'luxon';
import { useCalendarAuth } from '@/hooks/useCalendarAuth';
import { useCalendarDialogs } from '@/hooks/useCalendarDialogs';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarViewManager from '@/components/calendar/CalendarViewManager';
import { useTimeZoneSync } from '@/hooks/useTimeZoneSync';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { authDebugUtils } from '@/utils/authDebugUtils';
import { calendarPermissionDebug } from '@/utils/calendarPermissionDebug';
import { Button } from '@/components/ui/button';

const CalendarPage: React.FC = () => {
  const {
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    timeZone
  } = useCalendarState();

  const { userRole, isLoading: isUserLoading, userId } = useUser();
  const { isAuthenticated, isLoading: isAuthLoading, currentUserId } = useCalendarAuth();
  const { timeZone: syncedTimeZone, isLoading: isTimeZoneLoading } = useTimeZoneSync({ userId });
  
  const [showAvailability, setShowAvailability] = useState(true);
  const [calendarKey, setCalendarKey] = useState<number>(0);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const [permissionLevel, setPermissionLevel] = useState<'full' | 'limited' | 'none'>('none');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const { toast } = useToast();

  const {
    isAppointmentDialogOpen,
    isAvailabilitySettingsOpen, 
    isWeeklyAvailabilityOpen,
    isSingleAvailabilityOpen,
    selectedAvailabilityDate,
    openAppointmentDialog,
    closeAppointmentDialog,
    openAvailabilitySettings,
    closeAvailabilitySettings,
    openWeeklyAvailability,
    closeWeeklyAvailability,
    openSingleAvailability,
    closeSingleAvailability
  } = useCalendarDialogs();

  // Verify permission to manage the selected clinician's calendar
  useEffect(() => {
    const checkPermissions = async () => {
      if (!selectedClinicianId || !currentUserId) {
        setPermissionWarning(null);
        setPermissionLevel('none');
        return;
      }

      console.log('[Calendar] Checking calendar permissions:', {
        currentUserId,
        selectedClinicianId,
        userRole,
        userId
      });
      
      // Reset warning first
      setPermissionWarning(null);
      
      // If viewing own calendar, should have full permissions
      if (selectedClinicianId === currentUserId) {
        console.log('[Calendar] User is viewing their own calendar - full permissions granted');
        setPermissionLevel('full');
        return;
      }
      
      // If admin, should have full permissions for all clinicians
      if (userRole === 'admin') {
        console.log('[Calendar] User is admin - full permissions granted');
        setPermissionLevel('full');
        return;
      }
      
      // Run diagnostic check
      try {
        const diagnosticResults = await calendarPermissionDebug.runDiagnostic(
          currentUserId,
          selectedClinicianId
        );
        
        if (diagnosticResults.success) {
          // Check calendar permissions
          if (diagnosticResults.tests.calendarPermissions?.success) {
            console.log('[Calendar] User has at least limited permissions for this calendar');
            setPermissionLevel('limited');
          } else {
            console.log('[Calendar] User lacks permissions for this calendar');
            setPermissionLevel('none');
            setPermissionWarning("You don't have permission to edit this clinician's calendar.");
          }
        } else {
          console.warn('[Calendar] Permission diagnostic failed:', diagnosticResults.summary);
          setPermissionLevel('limited');
          setPermissionWarning("Unable to verify calendar permissions. Some features may be unavailable.");
        }
      } catch (error) {
        console.error('[Calendar] Error in permission diagnostic:', error);
        setPermissionLevel('limited');
        setPermissionWarning("Unable to verify calendar permissions. Some features may be unavailable.");
      }
    };
    
    checkPermissions();
  }, [selectedClinicianId, currentUserId, userRole, userId]);

  const handleCalendarRefresh = useCallback(() => {
    console.log('[Calendar] Refreshing calendar with new key');
    setCalendarKey(prev => prev + 1);
  }, []);

  const handleAvailabilityClick = useCallback((event: any) => {
    if (!event || !event.start) {
      console.error('[Calendar] Invalid event data in availability click handler', event);
      return;
    }
    
    try {
      const eventStart = event.start;
      let dayOfWeek: string;
      let specificDate: string | null = null;
      
      if (eventStart instanceof DateTime) {
        dayOfWeek = eventStart.weekdayLong.toLowerCase();
        specificDate = eventStart.toISODate();
      } 
      else if (eventStart instanceof Date) {
        const dateTime = DateTime.fromJSDate(eventStart).setZone(syncedTimeZone);
        dayOfWeek = dateTime.weekdayLong.toLowerCase();
        specificDate = dateTime.toISODate();
      } 
      else {
        dayOfWeek = getWeekdayName(eventStart);
        try {
          const parsed = DateTime.fromISO(eventStart);
          if (parsed.isValid) {
            specificDate = parsed.toISODate();
          }
        } catch (err) {
          console.log('[Calendar] Could not parse specific date from event start:', eventStart);
        }
      }
      
      const slotId = event.extendedProps?.id;
      
      console.log('[Calendar] Availability click handler:', {
        date: event.start,
        dayOfWeek,
        specificDate,
        slotId,
        eventData: event,
        permissionLevel
      });
      
      if (permissionLevel === 'none') {
        toast({
          title: 'Permission Denied',
          description: 'You do not have permission to manage this calendar.',
          variant: 'destructive',
        });
        return;
      }
      
      if (slotId) {
        localStorage.setItem('selectedAvailabilitySlotId', slotId);
      }
      
      if (specificDate) {
        localStorage.setItem('selectedAvailabilityDate', specificDate);
      }
      
      openWeeklyAvailability(dayOfWeek);
    } catch (error) {
      console.error('[Calendar] Error in availability click handler:', error);
      toast({
        title: 'Error',
        description: 'Could not process availability slot. Please try again.',
        variant: 'destructive',
      });
    }
  }, [syncedTimeZone, toast, openWeeklyAvailability, permissionLevel]);

  if (isUserLoading || isAuthLoading || isTimeZoneLoading) {
    return (
      <Layout>
        <CalendarLoading />
      </Layout>
    );
  }

  if (!isAuthenticated || !userId) {
    return (
      <Layout>
        <CalendarAuthError />
      </Layout>
    );
  }

  const canSelectDifferentClinician = userRole === 'admin';
  const canManageAvailability = permissionLevel !== 'none';

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-4">
          <CalendarHeader 
            clinicians={clinicians}
            selectedClinicianId={selectedClinicianId}
            loadingClinicians={loadingClinicians}
            canSelectDifferentClinician={canSelectDifferentClinician}
            canManageAvailability={canManageAvailability}
            timeZone={syncedTimeZone}
            onClinicianSelect={setSelectedClinicianId}
            onNewAppointment={openAppointmentDialog}
            onRefresh={handleCalendarRefresh}
            onSettingsClick={openAvailabilitySettings}
            onWeeklyScheduleClick={() => openWeeklyAvailability()}
            onSingleDayClick={openSingleAvailability}
          />

          {permissionWarning && (
            <Alert variant="warning" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{permissionWarning}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsDiagnosticOpen(true)}
                >
                  Troubleshoot
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {selectedClinicianId && currentUserId && selectedClinicianId !== currentUserId && permissionLevel === 'full' && (
            <Alert variant="default" className="mt-2 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You are viewing another clinician's calendar with admin access.
              </AlertDescription>
            </Alert>
          )}

          <CalendarViewManager
            key={calendarKey}
            clinicianId={selectedClinicianId}
            timeZone={syncedTimeZone}
            showAvailability={showAvailability}
            onAvailabilityClick={handleAvailabilityClick}
          />
        </div>
      </div>

      <AppointmentDialog 
        isOpen={isAppointmentDialogOpen} 
        onClose={closeAppointmentDialog} 
        clients={clients} 
        loadingClients={loadingClients} 
        selectedClinicianId={selectedClinicianId} 
        onAppointmentCreated={handleCalendarRefresh} 
      />

      {canManageAvailability && selectedClinicianId && (
        <>
          <WeeklyAvailabilityDialog 
            isOpen={isWeeklyAvailabilityOpen} 
            onClose={closeWeeklyAvailability}
            clinicianId={selectedClinicianId} 
            onAvailabilityUpdated={handleCalendarRefresh}
            initialActiveTab={selectedAvailabilityDate || 'monday'}
            permissionLevel={permissionLevel}
          />
          
          <AvailabilitySettingsDialog 
            isOpen={isAvailabilitySettingsOpen} 
            onClose={closeAvailabilitySettings} 
            clinicianId={selectedClinicianId} 
            onSettingsSaved={handleCalendarRefresh} 
            permissionLevel={permissionLevel}
          />

          <SingleAvailabilityDialog
            isOpen={isSingleAvailabilityOpen}
            onClose={closeSingleAvailability}
            clinicianId={selectedClinicianId}
            userTimeZone={syncedTimeZone}
            onAvailabilityCreated={handleCalendarRefresh}
            permissionLevel={permissionLevel}
          />
        </>
      )}
      
      <CalendarDiagnosticDialog 
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        selectedClinicianId={selectedClinicianId}
      />
    </Layout>
  );
};

export default CalendarPage;
