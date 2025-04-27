
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, RefreshCcw, Settings, Clock } from 'lucide-react';

interface CalendarControlsProps {
  clinicians: Array<{ id: string; clinician_professional_name: string }>;
  selectedClinicianId: string | null;
  loadingClinicians: boolean;
  canSelectDifferentClinician: boolean;
  canManageAvailability: boolean;
  onClinicianSelect: (id: string) => void;
  onNewAppointment: () => void;
  onRefresh: () => void;
  onSettingsClick: () => void;
  onWeeklyScheduleClick: () => void;
  onSingleDayClick: () => void;
}

const CalendarControls: React.FC<CalendarControlsProps> = ({
  clinicians,
  selectedClinicianId,
  loadingClinicians,
  canSelectDifferentClinician,
  canManageAvailability,
  onClinicianSelect,
  onNewAppointment,
  onRefresh,
  onSettingsClick,
  onWeeklyScheduleClick,
  onSingleDayClick,
}) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
      <div className="flex items-center gap-2">
        {canManageAvailability && selectedClinicianId && (
          <div className="flex items-center gap-2 mr-2">
            <Button 
              variant="outline" 
              onClick={onSettingsClick}
              className="flex items-center gap-2" 
              title="Availability Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Settings</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onWeeklyScheduleClick}
              className="flex items-center gap-2" 
              title="Manage Weekly Availability"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden md:inline">Weekly Schedule</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={onSingleDayClick}
              className="flex items-center gap-2" 
              title="Add Single Day Availability"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden md:inline">Single Day</span>
            </Button>
          </div>
        )}
        
        <Button onClick={onNewAppointment}>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>

        <Button variant="ghost" onClick={onRefresh} title="Refresh Calendar">
          <RefreshCcw className="h-4 w-4" />
        </Button>

        {clinicians.length > 1 && canSelectDifferentClinician && (
          <div className="min-w-[200px]">
            <Select value={selectedClinicianId || undefined} onValueChange={onClinicianSelect}>
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
                  clinicians.map(clinician => (
                    <SelectItem key={clinician.id} value={clinician.id}>
                      {clinician.clinician_professional_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarControls;
