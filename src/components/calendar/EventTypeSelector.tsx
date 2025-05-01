import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, UserPlus, CalendarX } from 'lucide-react';
import { useDialogs, DialogType } from '@/context/DialogContext';

interface EventTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date;
  endTime: Date;
  clinicianId: string;
  allDay?: boolean;
  onEventCreated?: () => void;
}

const EventTypeSelector: React.FC<EventTypeSelectorProps> = ({
  isOpen,
  onClose,
  startTime,
  endTime,
  clinicianId,
  allDay = false,
  onEventCreated,
}) => {
  const { openDialog } = useDialogs();

  const handleAppointmentClick = () => {
    onClose();
    openDialog('appointment', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      clinicianId,
      onAppointmentCreated: onEventCreated
    });
  };

  const handleAvailabilityClick = () => {
    onClose();
    openDialog('singleAvailability', {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      clinicianId,
      onAvailabilityCreated: onEventCreated
    });
  };

  const handleTimeOffClick = () => {
    onClose();
    openDialog('timeOff', {
      startTime,
      endTime,
      clinicianId,
      allDay,
      onTimeOffCreated: onEventCreated
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-4">
          <p className="text-sm text-gray-500 mb-2">
            Select the type of event you want to create:
          </p>

          <Button
            variant="outline"
            className="flex justify-start items-center h-16"
            onClick={handleAppointmentClick}
          >
            <UserPlus className="h-5 w-5 mr-3 text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Appointment</div>
              <div className="text-xs text-gray-500">Schedule a client appointment</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex justify-start items-center h-16"
            onClick={handleAvailabilityClick}
          >
            <Calendar className="h-5 w-5 mr-3 text-green-500" />
            <div className="text-left">
              <div className="font-medium">Availability</div>
              <div className="text-xs text-gray-500">Set available time for appointments</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex justify-start items-center h-16"
            onClick={handleTimeOffClick}
          >
            <CalendarX className="h-5 w-5 mr-3 text-amber-500" />
            <div className="text-left">
              <div className="font-medium">Time Off</div>
              <div className="text-xs text-gray-500">Block time for vacation or personal time</div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventTypeSelector;