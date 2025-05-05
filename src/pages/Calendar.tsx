
import React from 'react';
import Layout from '../components/layout/Layout';
import CalendarView from '../components/calendar/CalendarView';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { useCalendarState } from '../hooks/useCalendarState';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarViewControls from '../components/calendar/CalendarViewControls';
import AppointmentDialog from '../components/calendar/AppointmentDialog';

const CalendarPage = () => {
  const {
    view,
    setView,
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

  const navigatePrevious = () => {
    if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (newView: 'week' | 'month') => {
    setView(newView);
  };

  const toggleAvailability = () => {
    setShowAvailability(!showAvailability);
  };

  const handleAppointmentCreated = () => {
    setAppointmentRefreshTrigger(prev => prev + 1);
  };

  console.log("Calendar Page - selectedClinicianId:", selectedClinicianId);
  console.log("Calendar Page - clients:", clients);
  console.log("Calendar Page - loadingClients:", loadingClients);

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center gap-4">
              <CalendarViewControls 
                view={view}
                showAvailability={showAvailability}
                onViewChange={handleViewChange}
                onToggleAvailability={toggleAvailability}
                onNewAppointment={() => setIsDialogOpen(true)}
                selectedClinicianId={selectedClinicianId}
              />

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
            view={view}
            userTimeZone={userTimeZone}
            isLoadingTimeZone={isLoadingTimeZone}
            onNavigatePrevious={navigatePrevious}
            onNavigateNext={navigateNext}
            onNavigateToday={navigateToday}
          />

          <CalendarView
            view={view}
            showAvailability={showAvailability}
            clinicianId={selectedClinicianId}
            userTimeZone={userTimeZone}
            refreshTrigger={appointmentRefreshTrigger}
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
