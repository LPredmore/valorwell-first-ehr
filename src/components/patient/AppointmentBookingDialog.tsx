
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicianId: string;
  clinicianName: string;
  clientId: string;
  onAppointmentBooked: () => void;
  timeZone?: string; // Added to match DialogManager usage
}

const AppointmentBookingDialog: React.FC<AppointmentBookingDialogProps> = ({
  open,
  onOpenChange,
  clinicianId,
  clinicianName,
  clientId,
  onAppointmentBooked,
  timeZone
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment with {clinicianName}</DialogTitle>
        </DialogHeader>
        <div>
          {/* Content */}
          <p>Booking appointment with clinician ID: {clinicianId}</p>
          <p>For client ID: {clientId}</p>
          {timeZone && <p>Using time zone: {timeZone}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;
