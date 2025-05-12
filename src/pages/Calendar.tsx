
import React, { useEffect } from "react";
import Layout from "../components/layout/Layout";
import CalendarView from "../components/calendar/CalendarView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { useCalendarState } from "../hooks/useCalendarState";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarViewControls from "../components/calendar/CalendarViewControls";
import AppointmentDialog from "../components/calendar/AppointmentDialog";
import { useUser } from "@/context/UserContext";
import { useAppointments } from "@/hooks/useAppointments";

const CalendarPage = () => {
  // Get the logged-in user's ID
  const { userId } = useUser();

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
  } = useCalendarState(userId);
  
  // Fetch appointments with better date range
  const {
    appointments,
    isLoading: isLoadingAppointments,
    error: appointmentsError,
  } = useAppointments(
    selectedClinicianId,
    // Start date for fetch range - 1 month before current date
    subMonths(currentDate, 1),
    // End date for fetch range - 2 months after current date
    addMonths(currentDate, 2),
    userTimeZone
  );

  // Log key information for debugging
  useEffect(() => {
    console.log("[CalendarPage] Calendar initialized:", {
      userTimeZone,
      currentDate: currentDate.toISOString(),
      selectedClinicianId,
      appointmentsCount: appointments?.length || 0,
      viewMode: view
    });
    
    // Log first few appointments for verification
    if (appointments && appointments.length > 0) {
      console.log("[CalendarPage] Sample appointments:", 
        appointments.slice(0, 3).map(a => ({
          id: a.id,
          clientName: a.clientName,
          start_at: a.start_at,
          end_at: a.end_at
        }))
      );
    }
  }, [appointments, userTimeZone, currentDate, selectedClinicianId, view]);

  const navigatePrevious = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (newView: "week" | "month") => {
    setView(newView);
  };

  const toggleAvailability = () => {
    setShowAvailability(!showAvailability);
  };

  const handleAppointmentCreated = () => {
    setAppointmentRefreshTrigger((prev) => prev + 1);
  };

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

              <div className="hidden md:block">
                <Select
                  value={selectedClinicianId || undefined}
                  onValueChange={(value) => setSelectedClinicianId(value)}
                >
                  <SelectTrigger className="w-[200px]">
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
            currentDate={currentDate}
            userTimeZone={userTimeZone}
            refreshTrigger={appointmentRefreshTrigger}
            appointments={appointments}
            isLoading={isLoadingAppointments}
            error={appointmentsError}
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
