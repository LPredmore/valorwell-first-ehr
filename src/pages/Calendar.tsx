import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, Users2Icon, ChevronDown } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import FullCalendarView from '@/components/calendar/FullCalendarView';
import { useCalendarState } from '@/hooks/useCalendarState';
import { TimeZoneService } from '@/utils/timezone';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { useDialogs } from '@/context/DialogContext';
import { CalendarViewType } from '@/types/calendar';

const Calendar = () => {
  const navigate = useNavigate();
  const { userId, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();
  const { openDialog } = useDialogs();
  
  const {
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    timeZone,
  } = useCalendarState();

  const [view, setView] = useState<CalendarViewType>('timeGridWeek');
  const [showAvailability, setShowAvailability] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !userId) {
      toast({
        title: "Access restricted",
        description: "Please sign in to view the calendar",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [userId, isUserLoading, navigate, toast]);

  if (isUserLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const handleClinicianChange = (clinicianId: string) => {
    setSelectedClinicianId(clinicianId);
  };

  const handleViewChange = (newView: CalendarViewType) => {
    setView(newView);
  };

  const handleAvailabilityClick = (event: any) => {
    openDialog('singleAvailability', {
      clinicianId: selectedClinicianId,
      date: event.start,
    });
  };

  const handleAddAvailability = () => {
    openDialog('weeklyAvailability', {
      clinicianId: selectedClinicianId,
    });
  };

  const handleAddAppointment = () => {
    openDialog('appointment', {
      clinicianId: selectedClinicianId,
    });
  };

  const handleAddTimeOff = () => {
    openDialog('timeOff', {
      clinicianId: selectedClinicianId,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Calendar</h1>
            <p className="text-muted-foreground">
              Manage appointments, availability, and time off
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Clinician Selector */}
            <div className="w-full sm:w-64">
              <Select
                value={selectedClinicianId || ''}
                onValueChange={handleClinicianChange}
                disabled={loadingClinicians}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select clinician" />
                </SelectTrigger>
                <SelectContent>
                  {clinicians.map((clinician) => (
                    <SelectItem key={clinician.id} value={clinician.id}>
                      {clinician.clinician_professional_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Add Event Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto">
                  Add Event <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddAppointment}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Add Appointment</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddAvailability}>
                  <ClockIcon className="mr-2 h-4 w-4" />
                  <span>Set Availability</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddTimeOff}>
                  <Users2Icon className="mr-2 h-4 w-4" />
                  <span>Add Time Off</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Calendar View Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Tabs 
            defaultValue={view} 
            onValueChange={(value) => handleViewChange(value as CalendarViewType)}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="dayGridMonth">Month</TabsTrigger>
              <TabsTrigger value="timeGridWeek">Week</TabsTrigger>
              <TabsTrigger value="timeGridDay">Day</TabsTrigger>
              <TabsTrigger value="listWeek">List</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showAvailability}
                onChange={(e) => setShowAvailability(e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium">Show Availability</span>
            </label>
          </div>
        </div>
        
        {/* Calendar Component */}
        <div className="bg-white p-4 rounded-lg shadow">
          {selectedClinicianId ? (
            <FullCalendarView
              clinicianId={selectedClinicianId}
              userTimeZone={timeZone}
              view={view}
              showAvailability={showAvailability}
              onAvailabilityClick={handleAvailabilityClick}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-96">
              <CalendarIcon className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No clinician selected</h3>
              <p className="text-muted-foreground text-center">
                Please select a clinician to view their calendar
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Calendar;
