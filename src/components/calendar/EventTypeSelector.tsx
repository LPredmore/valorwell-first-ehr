
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDialogs } from '@/context/DialogContext';
import { CalendarPlus, Clock, AlertTriangle } from 'lucide-react';
import { TimeZoneService } from '@/utils/timezone';
import { DateTime } from 'luxon';

interface EventTypeSelectorProps {
  clinicianId?: string | null;
  startTime?: Date | string;
  endTime?: Date | string;
  allDay?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onEventCreated?: (event: any) => void;
}

/**
 * EventTypeSelector Dialog
 * Allows the user to choose what type of event to create when selecting a time slot on the calendar
 */
const EventTypeSelector: React.FC<EventTypeSelectorProps> = ({ 
  clinicianId = null, 
  startTime, 
  endTime, 
  allDay = false,
  isOpen: propIsOpen,
  onClose: propOnClose,
  onEventCreated
}) => {
  const { state, closeDialog, openDialog } = useDialogs();
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>('');
  
  // Use either the prop-based isOpen or the dialog state
  const isOpen = propIsOpen !== undefined ? propIsOpen : state.type === 'eventTypeSelector';
  
  useEffect(() => {
    // Get the current timezone
    const timezone = TimeZoneService.getUserTimeZone();
    setSelectedTimeZone(timezone);
  }, []);
  
  // Format the selected time range
  const formatTimeRange = () => {
    if (!startTime || !endTime) return 'No time selected';
    
    try {
      // Convert to Date objects if strings
      const startDate = startTime instanceof Date ? startTime : new Date(startTime);
      const endDate = endTime instanceof Date ? endTime : new Date(endTime);
      
      // Use TimeZoneService to format the dates
      const formattedDate = DateTime.fromJSDate(startDate).toFormat('ccc, LLL d');
      
      if (allDay) {
        return `${formattedDate} (All day)`;
      }
      
      const formattedStartTime = DateTime.fromJSDate(startDate).toFormat('h:mm a');
      const formattedEndTime = DateTime.fromJSDate(endDate).toFormat('h:mm a');
      
      return `${formattedDate}, ${formattedStartTime} - ${formattedEndTime}`;
    } catch (err) {
      console.error('Error formatting time range:', err);
      return 'Invalid time selection';
    }
  };
  
  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      closeDialog();
    }
  };
  
  const handleCreateAppointment = () => {
    handleClose();
    
    // Wait a moment to allow the previous dialog to close
    setTimeout(() => {
      openDialog('appointment', {
        clinicianId,
        startTime,
        endTime,
        allDay,
        onAppointmentCreated: onEventCreated || state.props?.onEventCreated
      });
    }, 100);
  };
  
  const handleCreateTimeOff = () => {
    handleClose();
    
    // Wait a moment to allow the previous dialog to close
    setTimeout(() => {
      openDialog('timeOff', {
        clinicianId,
        startTime,
        endTime,
        allDay,
        onTimeOffCreated: onEventCreated || state.props?.onEventCreated
      });
    }, 100);
  };
  
  const handleCreateAvailability = () => {
    handleClose();
    
    // Wait a moment to allow the previous dialog to close
    setTimeout(() => {
      openDialog('singleAvailability', {
        clinicianId,
        date: startTime instanceof Date ? startTime : new Date(startTime),
        userTimeZone: selectedTimeZone,
        onAvailabilityCreated: onEventCreated || state.props?.onEventCreated
      });
    }, 100);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-muted-foreground mb-4">
            Selected time: <span className="font-medium text-foreground">{formatTimeRange()}</span>
          </p>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-4 hover:bg-blue-50"
              onClick={handleCreateAppointment}
            >
              <div className="flex items-start">
                <CalendarPlus className="h-5 w-5 mr-2 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">New Appointment</div>
                  <div className="text-sm text-muted-foreground">Schedule a client session</div>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-4 hover:bg-amber-50"
              onClick={handleCreateTimeOff}
            >
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                <div className="text-left">
                  <div className="font-medium">Time Off</div>
                  <div className="text-sm text-muted-foreground">Mark as unavailable</div>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-4 hover:bg-green-50"
              onClick={handleCreateAvailability}
            >
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Add Availability</div>
                  <div className="text-sm text-muted-foreground">Mark as available for bookings</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventTypeSelector;
