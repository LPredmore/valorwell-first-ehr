
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicianId: string;
  clinicianName: string;
  clientId: string;
  onAppointmentBooked: () => void;
  timeZone?: string; // Used in DialogManager
  userTimeZone?: string; // Added for consistency with other components
  disabled?: boolean; // Added the disabled prop
}

const AppointmentBookingDialog: React.FC<AppointmentBookingDialogProps> = ({
  open,
  onOpenChange,
  clinicianId,
  clinicianName,
  clientId,
  onAppointmentBooked,
  timeZone,
  userTimeZone,
  disabled
}) => {
  // Use either timeZone or userTimeZone, with timeZone taking precedence
  const actualTimeZone = timeZone || userTimeZone;
  
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
          {actualTimeZone && <p>Using time zone: {actualTimeZone}</p>}
          {disabled && <p className="text-red-500">Booking is currently disabled. Please complete required documents first.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;
