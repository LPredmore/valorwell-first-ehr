
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SingleAvailabilityDialogProps {
  clinicianId?: string;
  date?: Date;
  userTimeZone?: string;
  onAvailabilityCreated?: (availability: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const SingleAvailabilityDialog: React.FC<SingleAvailabilityDialogProps> = ({
  clinicianId,
  date,
  userTimeZone,
  onAvailabilityCreated,
  isOpen = false,
  onClose = () => {}
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Availability</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a placeholder for the Single Availability Dialog.</p>
          {clinicianId && (
            <p>For clinician: {clinicianId}</p>
          )}
          {date && (
            <p>For date: {date.toLocaleDateString()}</p>
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

export default SingleAvailabilityDialog;
