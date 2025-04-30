
import React, { useState, useCallback, useEffect } from 'react';
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
import {
  logCalendarState,
  diagnoseCalendarIssues,
  trackCalendarInitialization,
  logDetailedCalendarState,
  logCalendarEvents,
  trackClinicianSelection,
  debugUuidValidation
} from '@/utils/calendarDebugUtils';
import { formatAsUUID } from '@/utils/validation/uuidUtils';

const CalendarPage: React.FC = () => {
  const { userRole, isLoading: isUserLoading, userId } = useUser();
  const { isAuthenticated, isLoading: isAuthLoading, currentUserId } = useCalendarAuth();
  
  // Track initialization start
  useEffect(() => {
    trackCalendarInitialization('start', { userId, isUserLoading });
    console.log('[CalendarPage] Calendar page initialization', {
      userId,
      isUserLoading,
      currentUserId,
      isAuthLoading
    });
  }, []);
  
  // Pass the currentUserId as the initialClinicianId to useCalendarState
  const {
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    timeZone
  } = useCalendarState(currentUserId);
  const { timeZone: syncedTimeZone, isLoading: isTimeZoneLoading } = useTimeZoneSync({ userId });
  const {
    checkPermissionLevel,
    permissionLevel,
    permissionError,
    isCheckingPermission
  } = usePermissions();
  
  // Track auth loaded state
  useEffect(() => {
    if (!isAuthLoading && !isUserLoading) {
      trackCalendarInitialization('auth-loaded', {
        currentUserId,
        userId,
        isAuthenticated,
        userRole
      });
    }
  }, [isAuthLoading, isUserLoading, currentUserId, userId, isAuthenticated, userRole]);
  
  const [showAvailability, setShowAvailability] = useState(true);
  
  // Debug the different IDs to spot data type or format issues
  useEffect(() => {
    debugUuidValidation(currentUserId, 'CalendarPage: currentUserId');
    debugUuidValidation(selectedClinicianId, 'CalendarPage: selectedClinicianId');
    debugUuidValidation(userId, 'CalendarPage: userId');
    
    console.log('[CalendarPage] ID comparison', {
      currentUserId: {
        value: currentUserId,
        type: typeof currentUserId,
        formatted: currentUserId ? formatAsUUID(currentUserId) : null
      },
      selectedClinicianId: {
        value: selectedClinicianId,
        type: typeof selectedClinicianId,
        formatted: selectedClinicianId ? formatAsUUID(selectedClinicianId) : null
      },
      userId: {
        value: userId,
        type: typeof userId,
        formatted: userId ? formatAsUUID(userId) : null
      }
    });
  }, [currentUserId, selectedClinicianId, userId]);
  
  // Ensure selectedClinicianId is set to currentUserId when it becomes available
  useEffect(() => {
    if (currentUserId && !selectedClinicianId) {
      // Track before setting
      trackClinicianSelection('auto-select', {
        source: 'currentUserId',
        selectedClinicianId: null,
        previousClinicianId: selectedClinicianId,
        userId: currentUserId,
        availableClinicians: clinicians?.map(c => ({
          id: c.id,
          name: c.clinician_professional_name
        }))
      });
      
      console.log('[Calendar] Setting selectedClinicianId to currentUserId:', currentUserId);
      const formattedId = formatAsUUID(currentUserId);
      console.log(`[Calendar] Using formatted ID: "${currentUserId}" → "${formattedId}"`);
      
      setSelectedClinicianId(formattedId);
      trackCalendarInitialization('clinician-selected', {
        selectedClinicianId: formattedId,
        originalId: currentUserId,
        source: 'auto-selection'
      });
      
      // Track after setting
      trackClinicianSelection('applied', {
        source: 'currentUserId',
        selectedClinicianId: formattedId,
        previousClinicianId: selectedClinicianId,
        userId: currentUserId
      });
    } else if (currentUserId && selectedClinicianId && currentUserId !== selectedClinicianId) {
      console.log('[Calendar] Note: currentUserId and selectedClinicianId differ:', {
        currentUserId,
        selectedClinicianId,
        userRole,
        formattedCurrentUserId: formatAsUUID(currentUserId),
        formattedSelectedClinicianId: formatAsUUID(selectedClinicianId)
      });
      
      // Check if the IDs might be the same but in different formats
      const formattedCurrentUserId = formatAsUUID(currentUserId);
      const formattedSelectedClinicianId = formatAsUUID(selectedClinicianId);
      
      if (formattedCurrentUserId === formattedSelectedClinicianId) {
        console.log('[Calendar] IDs are the same after formatting, updating selectedClinicianId');
        setSelectedClinicianId(formattedCurrentUserId);
      }
      
      // Diagnose potential issues
      const { hasIssues, issues } = diagnoseCalendarIssues(
        currentUserId,
        selectedClinicianId,
        userRole,
        permissionLevel
      );
      
      if (hasIssues) {
        console.warn('[Calendar] Potential issues detected:', issues);
      }
    } else if (!currentUserId) {
      console.log('[Calendar] Waiting for currentUserId to become available');
    }
  }, [currentUserId, selectedClinicianId, setSelectedClinicianId, userRole, permissionLevel, clinicians]);
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
  }, [syncedTimeZone, toast, openDialog, permissionLevel, selectedClinicianId, handleCalendarRefresh]);

  // Log detailed calendar state when all data is loaded
  useEffect(() => {
    if (!isUserLoading && !isAuthLoading && !isTimeZoneLoading && !loadingClinicians) {
      trackCalendarInitialization('complete', {
        selectedClinicianId,
        currentUserId,
        timeZone: syncedTimeZone
      });
      
      // Add detailed state debugging info
      logDetailedCalendarState({
        currentUserId,
        userRole,
        isAuthenticated,
        selectedClinicianId,
        clinicians: clinicians?.length,
        permissionLevel,
        permissionError,
        canManageAvailability: permissionLevel !== 'none',
        timeZone: syncedTimeZone,
        formattedClinicianId: selectedClinicianId ? formatAsUUID(selectedClinicianId) : null,
        firstClinicianId: clinicians?.[0]?.id || 'none'
      });
    }
  }, [
    isUserLoading, isAuthLoading, isTimeZoneLoading, loadingClinicians,
    selectedClinicianId, currentUserId, syncedTimeZone, userRole,
    isAuthenticated, clinicians, permissionLevel, permissionError
  ]);

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
            onClinicianSelect={(id) => {
              trackClinicianSelection('user-select', {
                source: 'dropdown',
                selectedClinicianId: id,
                previousClinicianId: selectedClinicianId,
                userId
              });
              setSelectedClinicianId(id);
            }}
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
          
          {/* Debug information panel */}
          <Alert variant="default" className="mt-2 bg-gray-50 border-gray-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center text-xs">
              <div>
                <strong>Debug:</strong> Clinician ID: {selectedClinicianId || 'none'} |
                User ID: {userId || 'none'} |
                Current User ID: {currentUserId || 'none'}
              </div>
            </AlertDescription>
          </Alert>

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
