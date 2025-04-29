
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ViewAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicianId: string;
  clinicianName: string;
  timeZone?: string; // Used in DialogManager
  userTimeZone?: string; // Added for consistency
}

const ViewAvailabilityDialog: React.FC<ViewAvailabilityDialogProps> = ({
  open,
  onOpenChange,
  clinicianId,
  clinicianName,
  timeZone,
  userTimeZone
}) => {
  // Use either timeZone or userTimeZone, with timeZone taking precedence
  const actualTimeZone = timeZone || userTimeZone;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View {clinicianName}'s Availability</DialogTitle>
        </DialogHeader>
        <div>
          {/* Content */}
          <p>Viewing availability for clinician ID: {clinicianId}</p>
          {actualTimeZone && <p>Using time zone: {actualTimeZone}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAvailabilityDialog;
