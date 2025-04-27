
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Settings, RefreshCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CalendarHeaderProps {
  clinicians: Array<{ id: string; clinician_professional_name: string }>;
  selectedClinicianId: string | null;
  loadingClinicians: boolean;
  canSelectDifferentClinician: boolean;
  canManageAvailability: boolean;
  timeZone: string;
  onClinicianSelect: (clinicianId: string) => void;
  onNewAppointment: () => void;
  onRefresh: () => void;
  onSettingsClick: () => void;
  onWeeklyScheduleClick: () => void;
  onSingleDayClick: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  clinicians,
  selectedClinicianId,
  loadingClinicians,
  canSelectDifferentClinician,
  canManageAvailability,
  timeZone,
  onClinicianSelect,
  onNewAppointment,
  onRefresh,
  onSettingsClick,
  onWeeklyScheduleClick,
  onSingleDayClick
}) => {
  return (
    <Card className="p-4 mb-4">
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          {canSelectDifferentClinician && (
            <div className="w-64">
              <Select
                value={selectedClinicianId || ""}
                onValueChange={onClinicianSelect}
                disabled={loadingClinicians}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingClinicians 
                      ? "Loading clinicians..." 
                      : "Select a clinician"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {clinicians.map(clinician => (
                    <SelectItem 
                      key={clinician.id} 
                      value={clinician.id}
                    >
                      {clinician.clinician_professional_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={onRefresh}
            disabled={!selectedClinicianId}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button 
            onClick={onNewAppointment}
            disabled={!selectedClinicianId}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>

        {canManageAvailability && selectedClinicianId && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onWeeklyScheduleClick}
            >
              Weekly Availability
            </Button>
            <Button 
              variant="outline" 
              onClick={onSingleDayClick}
            >
              Single Day
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={onSettingsClick}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {selectedClinicianId && (
        <div className="mt-2 text-sm text-gray-500">
          <span>Timezone: {timeZone}</span>
        </div>
      )}
    </Card>
  );
};

export default CalendarHeader;
