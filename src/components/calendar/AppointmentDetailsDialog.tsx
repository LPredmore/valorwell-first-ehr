
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { CalendarClock, User, Clock } from 'lucide-react';

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    client_id: string;
    date: string;
    start_time: string;
    end_time: string;
    type: string;
    status: string;
    clientName?: string;
  } | null;
}

const AppointmentDetailsDialog: React.FC<AppointmentDetailsDialogProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>
            View details for this appointment
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="font-medium">Client</div>
                <div className="text-sm text-gray-600">{appointment.clientName || 'Unknown Client'}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CalendarClock className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="font-medium">Date</div>
                <div className="text-sm text-gray-600">
                  {format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="font-medium">Time</div>
                <div className="text-sm text-gray-600">
                  {format(parseISO(`2000-01-01T${appointment.start_time}`), 'h:mm a')} - 
                  {format(parseISO(`2000-01-01T${appointment.end_time}`), 'h:mm a')}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 flex items-center justify-center text-gray-500 mt-0.5">
                <div className={`h-3 w-3 rounded-full ${appointment.status === 'scheduled' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>
              <div>
                <div className="font-medium">Status</div>
                <div className="text-sm text-gray-600 capitalize">{appointment.status}</div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            Start Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsDialog;
