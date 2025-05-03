
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Settings, Clock, Plus } from 'lucide-react';
import SingleAvailabilityDialog from './SingleAvailabilityDialog';
import WeeklyAvailabilityDialog from './WeeklyAvailabilityDialog';
import AvailabilitySettingsDialog from './AvailabilitySettingsDialog';
import { useTimeZone } from '@/context/TimeZoneContext';

interface AvailabilityManagementProps {
  clinicianId?: string;
  onAvailabilityUpdated?: () => void;
}

const AvailabilityManagement: React.FC<AvailabilityManagementProps> = ({
  clinicianId,
  onAvailabilityUpdated
}) => {
  const { userTimeZone } = useTimeZone();
  
  // Dialog state
  const [isSingleAvailabilityOpen, setSingleAvailabilityOpen] = useState(false);
  const [isWeeklyAvailabilityOpen, setWeeklyAvailabilityOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  
  // Selected date for single availability
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const handleSingleAvailability = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setSingleAvailabilityOpen(true);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="mr-2 h-5 w-5" />
              Single Day
            </CardTitle>
            <CardDescription>
              Add availability for a specific date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Create availability slots for a specific date. Useful for unusual schedules or exceptions.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleSingleAvailability()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Single Day
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5" />
              Weekly Hours
            </CardTitle>
            <CardDescription>
              Set your recurring weekly schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Configure your regular weekly availability pattern. These will appear every week on your calendar.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setWeeklyAvailabilityOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Manage Weekly Hours
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Configure availability settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Set default appointment duration, booking notice periods, and timezone preferences.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Dialogs */}
      <SingleAvailabilityDialog 
        clinicianId={clinicianId}
        date={selectedDate}
        userTimeZone={userTimeZone}
        isOpen={isSingleAvailabilityOpen}
        onClose={() => {
          setSingleAvailabilityOpen(false);
          if (onAvailabilityUpdated) onAvailabilityUpdated();
        }}
      />
      
      <WeeklyAvailabilityDialog 
        clinicianId={clinicianId}
        isOpen={isWeeklyAvailabilityOpen}
        onClose={() => {
          setWeeklyAvailabilityOpen(false);
          if (onAvailabilityUpdated) onAvailabilityUpdated();
        }}
      />
      
      <AvailabilitySettingsDialog 
        clinicianId={clinicianId}
        isOpen={isSettingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          if (onAvailabilityUpdated) onAvailabilityUpdated();
        }}
      />
    </>
  );
};

export default AvailabilityManagement;
