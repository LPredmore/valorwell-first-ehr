
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useCalendarState } from '@/hooks/useCalendarState';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import usePermissions from '@/hooks/usePermissions';
import CalendarLoading from '@/components/calendar/CalendarLoading';
import CalendarAuthError from '@/components/calendar/CalendarAuthError';
import DialogManager from '@/components/common/DialogManager';
import { useCalendarAuth } from '@/hooks/useCalendarAuth';
import { useDialogs } from '@/context/DialogContext';
import { useTimeZoneSync } from '@/hooks/useTimeZoneSync';
import { formatAsUUID } from '@/utils/validation/uuidUtils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarViewType } from '@/types/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, List, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timezone';

/**
 * Redesigned Calendar Page
 * 
 * A modern, user-friendly implementation of the calendar functionality
 * with improved component hierarchy and visual design.
 */
const CalendarPage: React.FC = () => {
  // Core hooks for calendar functionality
  const { userId, isLoading: isUserLoading, isClinician } = useUser();
  const { isAuthenticated, isLoading: isAuthLoading, currentUserId } = useCalendarAuth();
  
  // Calendar state management
  const {
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    clients,
    loadingClients,
    timeZone: calendarTimeZone
  } = useCalendarState(isClinician ? currentUserId : null);
  
  // Get user timezone
  const { timeZone: syncedTimeZone, isLoading: isTimeZoneLoading } = useTimeZoneSync({ userId });
  
  // Permission management
  const {
    permissionLevel,
    permissionError,
    isCheckingPermission
  } = usePermissions();
  
  // UI state
  const [activeView, setActiveView] = useState<CalendarViewType>('timeGridWeek');
  const [showAvailability, setShowAvailability] = useState(true);
  const [showAppointments, setShowAppointments] = useState(true);
  const [showTimeOff, setShowTimeOff] = useState(true);
  const [calendarKey, setCalendarKey] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<DateTime>(DateTime.now());
  
  // Dialog management
  const { toast } = useToast();
  const { openDialog } = useDialogs();

  // Format clinician ID to ensure consistent UUID format
  const formattedClinicianId = selectedClinicianId ? formatAsUUID(selectedClinicianId) : null;

  // Calculate the calendar title based on current view and date
  const getCalendarTitle = () => {
    switch(activeView) {
      case 'dayGridMonth':
        return currentDate.toFormat('MMMM yyyy');
      case 'timeGridWeek': {
        const weekStart = currentDate.startOf('week');
        const weekEnd = currentDate.endOf('week');
        return `${weekStart.toFormat('MMM d')} - ${weekEnd.toFormat('d, yyyy')}`;
      }
      case 'timeGridDay':
        return currentDate.toFormat('EEEE, MMMM d, yyyy');
      default:
        return currentDate.toFormat('MMMM yyyy');
    }
  };

  // Navigation functions
  const goToNextPeriod = () => {
    switch(activeView) {
      case 'dayGridMonth':
        setCurrentDate(currentDate.plus({ months: 1 }));
        break;
      case 'timeGridWeek':
        setCurrentDate(currentDate.plus({ weeks: 1 }));
        break;
      case 'timeGridDay':
        setCurrentDate(currentDate.plus({ days: 1 }));
        break;
    }
    setCalendarKey(prev => prev + 1);
  };

  const goToPreviousPeriod = () => {
    switch(activeView) {
      case 'dayGridMonth':
        setCurrentDate(currentDate.minus({ months: 1 }));
        break;
      case 'timeGridWeek':
        setCurrentDate(currentDate.minus({ weeks: 1 }));
        break;
      case 'timeGridDay':
        setCurrentDate(currentDate.minus({ days: 1 }));
        break;
    }
    setCalendarKey(prev => prev + 1);
  };

  const goToToday = () => {
    setCurrentDate(DateTime.now());
    setCalendarKey(prev => prev + 1);
  };

  // Handle calendar refresh
  const handleCalendarRefresh = () => {
    setCalendarKey(prev => prev + 1);
  };

  // Loading state
  if (isUserLoading || isAuthLoading || isTimeZoneLoading) {
    return (
      <Layout>
        <CalendarLoading />
      </Layout>
    );
  }

  // Authentication error state
  if (!isAuthenticated || !userId) {
    return (
      <Layout>
        <CalendarAuthError />
      </Layout>
    );
  }

  const canSelectDifferentClinician = permissionLevel === 'admin' || !isClinician;
  const canManageAvailability = isClinician || permissionLevel !== 'none';
  const timezone = TimeZoneService.ensureIANATimeZone(syncedTimeZone || 'UTC');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        {/* Top controls section with clinician selector and action buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex flex-col w-full md:w-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Calendar</h1>
            <p className="text-sm text-gray-500">
              {TimeZoneService.formatTimeZoneDisplay(timezone)}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Clinician selector */}
            {canSelectDifferentClinician && (
              <Select
                disabled={loadingClinicians}
                value={selectedClinicianId || ''}
                onValueChange={(value) => setSelectedClinicianId(value)}
              >
                <SelectTrigger className="w-full md:w-[240px] bg-white">
                  <SelectValue placeholder="Select a clinician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Clinicians</SelectLabel>
                    {clinicians.map((clinician) => (
                      <SelectItem key={clinician.id} value={clinician.id}>
                        {clinician.clinician_professional_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => openDialog('appointment', {
                  clients,
                  loadingClients,
                  selectedClinicianId: formattedClinicianId,
                  onAppointmentCreated: handleCalendarRefresh
                })}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Appointment
              </Button>
              
              {canManageAvailability && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openDialog('weeklyAvailability', {
                    clinicianId: formattedClinicianId,
                    onAvailabilityUpdated: handleCalendarRefresh,
                    permissionLevel
                  })}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              )}
              
              {canManageAvailability && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openDialog('availabilitySettings', {
                    clinicianId: formattedClinicianId,
                    onSettingsSaved: handleCalendarRefresh,
                    permissionLevel
                  })}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Calendar navigation controls */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousPeriod}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToToday}
              >
                Today
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPeriod}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <h2 className="text-lg font-medium ml-2">{getCalendarTitle()}</h2>
            </div>
            
            {/* View selection tabs */}
            <div className="flex rounded-lg border bg-white">
              <Button
                variant={activeView === 'dayGridMonth' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('dayGridMonth')}
                className="rounded-r-none"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Month
              </Button>
              
              <Button
                variant={activeView === 'timeGridWeek' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('timeGridWeek')}
                className="rounded-none border-x"
              >
                <List className="h-4 w-4 mr-1" />
                Week
              </Button>
              
              <Button
                variant={activeView === 'timeGridDay' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('timeGridDay')}
                className="rounded-l-none"
              >
                <Clock className="h-4 w-4 mr-1" />
                Day
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Calendar display area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with filters */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-medium text-lg mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center">
                    <div className="h-3 w-3 bg-green-300 rounded-full mr-2"></div>
                    Availability
                  </label>
                  <input
                    type="checkbox"
                    checked={showAvailability}
                    onChange={(e) => setShowAvailability(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center">
                    <div className="h-3 w-3 bg-blue-300 rounded-full mr-2"></div>
                    Appointments
                  </label>
                  <input
                    type="checkbox"
                    checked={showAppointments}
                    onChange={(e) => setShowAppointments(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center">
                    <div className="h-3 w-3 bg-amber-300 rounded-full mr-2"></div>
                    Time Off
                  </label>
                  <input
                    type="checkbox"
                    checked={showTimeOff}
                    onChange={(e) => setShowTimeOff(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                  />
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium text-lg mb-3">Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="h-3 w-3 bg-green-300 rounded-full mr-2"></div>
                    <span>Available Time Slots</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="h-3 w-3 bg-blue-300 rounded-full mr-2"></div>
                    <span>Scheduled Appointments</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="h-3 w-3 bg-amber-300 rounded-full mr-2"></div>
                    <span>Time Off</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="h-3 w-3 bg-red-300 rounded-full mr-2"></div>
                    <span>Cancelled</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <Button 
                  className="w-full" 
                  variant="outline" 
                  size="sm"
                  onClick={handleCalendarRefresh}
                >
                  Refresh Calendar
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Main calendar */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              {!formattedClinicianId ? (
                <div className="text-center py-10 text-gray-500">
                  {loadingClinicians ? (
                    <p>Loading clinician data...</p>
                  ) : (
                    <p>Please select a clinician to view their calendar</p>
                  )}
                </div>
              ) : (
                <div className="min-h-[700px]">
                  <import fullCalendarView from '@/components/calendar/FullCalendarView' />
                  <FullCalendarView
                    key={calendarKey}
                    clinicianId={formattedClinicianId}
                    userTimeZone={timezone}
                    view={activeView}
                    height="700px"
                    showAvailability={showAvailability}
                    onAvailabilityClick={(event) => {
                      const dayOfWeek = DateTime.fromJSDate(event.start).weekdayLong.toLowerCase();
                      
                      openDialog('weeklyAvailability', {
                        clinicianId: formattedClinicianId,
                        onAvailabilityUpdated: handleCalendarRefresh,
                        selectedDate: dayOfWeek,
                        availabilityId: event.id
                      });
                    }}
                  />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      {/* Dialog manager for all calendar-related dialogs */}
      <DialogManager />
    </Layout>
  );
};

export default CalendarPage;
