
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EditAppointmentDialog from './EditAppointmentDialog';
import { Appointment } from './week-view/useWeekViewData';

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: (Appointment & { clientName?: string }) | null;
  onAppointmentUpdated: () => void;
  userTimeZone: string;
  clientTimeZone: string;
}

const AppointmentDetailsDialog: React.FC<AppointmentDetailsDialogProps> = ({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
  userTimeZone,
  clientTimeZone
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  if (!appointment) return null;

  return (
    <>
      <Dialog open={isOpen && !isEditDialogOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <p className="font-medium">Client</p>
              <p>{appointment.clientName || 'Unknown Client'}</p>
            </div>
            
            <div className="grid gap-2">
              <p className="font-medium">Date</p>
              <p>{appointment.date}</p>
            </div>
            
            <div className="grid gap-2">
              <p className="font-medium">Time</p>
              <p>{appointment.start_time} - {appointment.end_time}</p>
            </div>
            
            <div className="grid gap-2">
              <p className="font-medium">Type</p>
              <p>{appointment.type}</p>
            </div>
            
            <div className="grid gap-2">
              <p className="font-medium">Status</p>
              <p>{appointment.status}</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => setIsEditDialogOpen(true)}>
              Edit Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {appointment && isEditDialogOpen && (
        <EditAppointmentDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            onClose();
          }}
          appointment={appointment}
          onAppointmentUpdated={onAppointmentUpdated}
        />
      )}
    </>
  );
};

export default AppointmentDetailsDialog;
