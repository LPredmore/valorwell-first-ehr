
import React, { useCallback, useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useCalendarState } from '../hooks/useCalendarState';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import CalendarLoading from '@/components/calendar/CalendarLoading';
import CalendarAuthError from '@/components/calendar/CalendarAuthError';
import DialogManager from '@/components/common/DialogManager';
import { getWeekdayName } from '@/utils/dateFormatUtils';
import { DateTime } from 'luxon';
import { useCalendarAuth } from '@/hooks/useCalendarAuth';
import { useDialogs } from '@/context/DialogContext';
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
  const {
    checkPermissionLevel,
    permissionLevel,
    permissionError,
    isCheckingPermission
  } = usePermissions();
  
  const [showAvailability, setShowAvailability] = useState(true);
  const [calendarKey, setCalendarKey] = useState<number>(0);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    openDialog,
    openAppointmentDialog,
    openAvailabilitySettings,
    openWeeklyAvailability,
    openSingleAvailability,
    openDiagnosticDialog
  } = useDialogs();

  // Verify permission to manage the selected clinician's calendar
  useEffect(() => {
    const checkPermissions = async () => {
      if (!selectedClinicianId || !currentUserId) {
        setPermissionWarning(null);
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
      
      // Use the centralized permission service to check permission level
      await checkPermissionLevel('calendar', selectedClinicianId);
      
      // Set warning based on permission level and any errors
      if (permissionLevel === 'none') {
        setPermissionWarning("You don't have permission to view this clinician's calendar.");
      } else if (permissionLevel === 'limited') {
        setPermissionWarning("You have limited access to this calendar. Some features may be unavailable.");
      } else if (permissionError) {
        setPermissionWarning("Unable to verify full calendar permissions. Some features may be unavailable.");
      }
    };
    
    checkPermissions();
  }, [selectedClinicianId, currentUserId, userRole, userId, checkPermissionLevel, permissionLevel, permissionError]);

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
      
      openDialog('weeklyAvailability', {
        clinicianId: selectedClinicianId,
        onAvailabilityUpdated: handleCalendarRefresh,
        permissionLevel: permissionLevel,
        selectedDate: dayOfWeek
      });
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
            onNewAppointment={() => openDialog('appointment', {
              clients,
              loadingClients,
              selectedClinicianId,
              onAppointmentCreated: handleCalendarRefresh
            })}
            onRefresh={handleCalendarRefresh}
            onSettingsClick={() => openDialog('availabilitySettings', {
              clinicianId: selectedClinicianId,
              onSettingsSaved: handleCalendarRefresh,
              permissionLevel
            })}
            onWeeklyScheduleClick={() => openDialog('weeklyAvailability', {
              clinicianId: selectedClinicianId,
              onAvailabilityUpdated: handleCalendarRefresh,
              permissionLevel
            })}
            onSingleDayClick={() => openDialog('singleAvailability', {
              clinicianId: selectedClinicianId,
              userTimeZone: syncedTimeZone,
              onAvailabilityCreated: handleCalendarRefresh,
              permissionLevel
            })}
          />

          {permissionWarning && (
            <Alert variant="warning" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{permissionWarning}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog('diagnostic', {
                    selectedClinicianId
                  })}
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

      {/* Use the centralized DialogManager to handle all dialogs */}
      <DialogManager />
    </Layout>
  );
};

export default CalendarPage;
