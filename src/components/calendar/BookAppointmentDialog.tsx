
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface BookAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData: any;
  clinicianId: string;
  clientId: string;
  onAppointmentBooked: () => void;
}

const BookAppointmentDialog: React.FC<BookAppointmentDialogProps> = ({
  isOpen,
  onClose,
  appointmentData,
  clinicianId,
  clientId,
  onAppointmentBooked
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        <div>
          {/* Content */}
          <p>Book appointment with clinician ID: {clinicianId}</p>
          <p>For client ID: {clientId}</p>
          <p>Appointment data: {JSON.stringify(appointmentData)}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookAppointmentDialog;
