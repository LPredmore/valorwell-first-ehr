
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WeeklyAvailabilityDialogProps {
  clinicianId?: string;
  onAvailabilityUpdated?: (availability: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const WeeklyAvailabilityDialog: React.FC<WeeklyAvailabilityDialogProps> = ({
  clinicianId,
  onAvailabilityUpdated,
  isOpen = false,
  onClose = () => {}
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Weekly Availability</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a placeholder for the Weekly Availability Dialog.</p>
          {clinicianId && (
            <p>For clinician: {clinicianId}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyAvailabilityDialog;
