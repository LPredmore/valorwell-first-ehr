
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TimeZoneService } from '@/utils/timezone';

interface TimeOffDetails {
  clinicianId?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  allDay?: boolean;
  reason?: string;
  id?: string;
}

export interface TimeOffDialogProps {
  timeOffRequest?: TimeOffDetails;
  onTimeOffCreated?: (timeOff: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const TimeOffDialog: React.FC<TimeOffDialogProps> = ({ 
  timeOffRequest,
  onTimeOffCreated,
  isOpen = false,
  onClose = () => {}
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In the real implementation, this would save the time off request
    const updatedTimeOff = {
      ...timeOffRequest,
      id: timeOffRequest?.id || `timeoff-${Date.now()}`,
      title: "Time Off",
      start: timeOffRequest?.startTime,
      end: timeOffRequest?.endTime,
      display: 'background',
      color: '#FFB6C1',
      extendedProps: {
        eventType: 'time_off'
      }
    };
    
    // Convert times to UTC if needed
    if (timeOffRequest?.startTime && timeOffRequest?.endTime) {
      // Use toUTCTimestamp for UTC conversion
      const timezone = TimeZoneService.getLocalTimeZone();
      updatedTimeOff.start = TimeZoneService.toUTCTimestamp(timeOffRequest.startTime, timezone);
      updatedTimeOff.end = TimeZoneService.toUTCTimestamp(timeOffRequest.endTime, timezone);
    }
    
    if (onTimeOffCreated) {
      onTimeOffCreated(updatedTimeOff);
    }
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <p>This is a placeholder for the Time Off Dialog.</p>
            {timeOffRequest && (
              <>
                <p>Creating time off for clinician: {timeOffRequest.clinicianId}</p>
                <p>Start: {String(timeOffRequest.startTime)}</p>
                <p>End: {String(timeOffRequest.endTime)}</p>
                <p>All day: {timeOffRequest.allDay ? 'Yes' : 'No'}</p>
              </>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Request Time Off</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeOffDialog;
