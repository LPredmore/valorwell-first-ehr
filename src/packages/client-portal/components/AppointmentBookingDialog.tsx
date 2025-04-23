
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button
} from '@/packages/ui';

const AppointmentBookingDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Book Appointment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
        </DialogHeader>
        {/* Booking form implementation */}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingDialog;
