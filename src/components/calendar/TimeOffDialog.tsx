
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TimeZoneService } from '@/utils/timezone';

interface TimeOffDetails {
  clinicianId?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  allDay?: boolean;
  title?: string;
  description?: string;
  id?: string;
}

export interface TimeOffDialogProps {
  timeOff?: TimeOffDetails;
  onTimeOffCreated?: (timeOff: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const TimeOffDialog: React.FC<TimeOffDialogProps> = ({ 
  timeOff,
  onTimeOffCreated,
  isOpen = false,
  onClose = () => {}
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real implementation, this would save the time off request
    const updatedTimeOff = {
      ...timeOff,
      id: timeOff?.id || `new-${Date.now()}`,
      title: "Time Off",
      start: timeOff?.startTime,
      end: timeOff?.endTime
    };
    
    // Convert times to UTC if needed
    if (timeOff?.startTime && timeOff?.endTime) {
      const timezone = TimeZoneService.getLocalTimeZone();
      
      // Convert to DateTime first and then to JSDate to ensure proper type handling
      const startDateTime = TimeZoneService.toUTC(timeOff.startTime instanceof Date ? 
        timeOff.startTime : new Date(timeOff.startTime)).toJSDate();
      
      const endDateTime = TimeZoneService.toUTC(timeOff.endTime instanceof Date ? 
        timeOff.endTime : new Date(timeOff.endTime)).toJSDate();
      
      updatedTimeOff.start = startDateTime;
      updatedTimeOff.end = endDateTime;
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
            {timeOff && (
              <>
                <p>Time off for clinician: {timeOff.clinicianId}</p>
                <p>Start: {String(timeOff.startTime)}</p>
                <p>End: {String(timeOff.endTime)}</p>
                <p>All day: {timeOff.allDay ? 'Yes' : 'No'}</p>
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
