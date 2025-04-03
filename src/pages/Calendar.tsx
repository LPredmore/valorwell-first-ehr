import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar as CalendarIcon, Plus, Settings } from 'lucide-react';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { useCalendarState } from '../hooks/useCalendarState';
import CalendarHeader from '../components/calendar/CalendarHeader';
import AppointmentDialog from '../components/calendar/AppointmentDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import FullCalendarView from '@/components/calendar/FullCalendarView';
import AvailabilitySettingsDialog from '@/components/calendar/AvailabilitySettingsDialog';
import EnhancedAvailabilityPanel from '@/components/calendar/EnhancedAvailabilityPanel';
import { useAppointments } from '@/hooks/useAppointments';

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

  const { appointments, isLoading: appointmentsLoading } = useAppointments(selectedClinicianId || null);

  const [calendarViewMode, setCalendarViewMode] = useState<'dayGridMonth' | 'timeGridWeek'>('timeGridWeek');
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [showAvailabilityPanel, setShowAvailabilityPanel] = useState(false);

  const navigatePrevious = () => {
    if (calendarViewMode === 'timeGridWeek') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (calendarViewMode === 'timeGridWeek') {
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
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

  const handleSettingsUpdated = () => {
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

  const getClientName = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId);
    return client ? `${client.client_first_name || ''} ${client.client_last_name || ''}`.trim() || 'Client' : 'Client';
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center gap-4">
              <Tabs value={calendarViewMode} onValueChange={(value) => setCalendarViewMode(value as 'dayGridMonth' | 'timeGridWeek')}>
                <TabsList>
                  <TabsTrigger value="dayGridMonth">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="timeGridWeek">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Weekly
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant={showAvailabilityPanel ? "default" : "outline"}
                onClick={() => setShowAvailabilityPanel(!showAvailabilityPanel)}
              >
                <Clock className="mr-2 h-4 w-4" />
                Availability
              </Button>

              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>

              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              <div className="hidden">
                <Select
                  value={selectedClinicianId || undefined}
                  onValueChange={(value) => setSelectedClinicianId(value)}
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
            </div>
          </div>

          <CalendarHeader
            currentDate={currentDate}
            view={calendarViewMode === "timeGridWeek" ? "week" : "month"}
            userTimeZone={userTimeZone}
            isLoadingTimeZone={isLoadingTimeZone}
            onNavigatePrevious={navigatePrevious}
            onNavigateNext={navigateNext}
            onNavigateToday={navigateToday}
          />

          <div className="flex">
            <FullCalendarView
              currentDate={currentDate}
              clinicianId={selectedClinicianId}
              userTimeZone={userTimeZone}
              refreshTrigger={appointmentRefreshTrigger}
              view={calendarViewMode}
              showAvailability={true}
              className={showAvailabilityPanel ? "w-3/4" : "w-full"}
              appointments={appointments}
              getClientName={getClientName}
            />

            {showAvailabilityPanel && (
              <div className="w-1/4 pl-4">
                <EnhancedAvailabilityPanel
                  clinicianId={selectedClinicianId}
                  onAvailabilityUpdated={() => setAppointmentRefreshTrigger(prev => prev + 1)}
                  userTimeZone={userTimeZone}
                />
              </div>
            )}
          </div>
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

      <AvailabilitySettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        clinicianId={selectedClinicianId}
        onSettingsUpdated={handleSettingsUpdated}
      />
    </Layout>
  );
};

export default CalendarPage;
