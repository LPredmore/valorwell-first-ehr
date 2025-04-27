
import React, { useCallback, useState } from 'react';
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
import { getWeekdayName } from '@/utils/dateFormatUtils';
import { DateTime } from 'luxon';
import { useCalendarAuth } from '@/hooks/useCalendarAuth';
import { useCalendarDialogs } from '@/hooks/useCalendarDialogs';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarViewManager from '@/components/calendar/CalendarViewManager';
import { useTimeZoneSync } from '@/hooks/useTimeZoneSync';

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
  const { isAuthenticated, isLoading: isAuthLoading } = useCalendarAuth();
  const { timeZone: syncedTimeZone, isLoading: isTimeZoneLoading } = useTimeZoneSync({ userId });
  
  const [showAvailability, setShowAvailability] = useState(true);
  const [calendarKey, setCalendarKey] = useState<number>(0);
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
        eventData: event
      });
      
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
  }, [syncedTimeZone, toast, openWeeklyAvailability]);

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

  const canSelectDifferentClinician = userRole !== 'clinician';
  const canManageAvailability = userRole === 'clinician' || userRole === 'admin';

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
          />
          
          <AvailabilitySettingsDialog 
            isOpen={isAvailabilitySettingsOpen} 
            onClose={closeAvailabilitySettings} 
            clinicianId={selectedClinicianId} 
            onSettingsSaved={handleCalendarRefresh} 
          />

          <SingleAvailabilityDialog
            isOpen={isSingleAvailabilityOpen}
            onClose={closeSingleAvailability}
            clinicianId={selectedClinicianId}
            userTimeZone={syncedTimeZone}
            onAvailabilityCreated={handleCalendarRefresh}
          />
        </>
      )}
    </Layout>
  );
};

export default CalendarPage;
