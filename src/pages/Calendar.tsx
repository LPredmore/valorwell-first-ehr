
import React from 'react';
import Layout from '../components/layout/Layout';
import { Loader2 } from 'lucide-react';
import { addWeeks, subWeeks } from 'date-fns';
import { useCalendarState } from '../hooks/useCalendarState';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarViewControls from '../components/calendar/CalendarViewControls';
import AppointmentDialog from '../components/calendar/AppointmentDialog';
import MonthView from '../components/calendar/MonthView';

const CalendarPage = () => {
  const {
    view,
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
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const navigateNext = () => {
    setCurrentDate(addWeeks(currentDate, 1));
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

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center gap-4">
              <CalendarViewControls 
                view="week"
                showAvailability={showAvailability}
                onToggleAvailability={toggleAvailability}
                onNewAppointment={() => setIsDialogOpen(true)}
              />
            </div>
          </div>

          <CalendarHeader
            currentDate={currentDate}
            view="week"
            userTimeZone={userTimeZone}
            isLoadingTimeZone={isLoadingTimeZone}
            onNavigatePrevious={navigatePrevious}
            onNavigateNext={navigateNext}
            onNavigateToday={navigateToday}
          />

          <MonthView
            currentDate={currentDate}
            clinicianId={selectedClinicianId}
            refreshTrigger={appointmentRefreshTrigger}
            userTimeZone={userTimeZone}
            weekViewMode={true}
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
