
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, MapPin, AlertTriangle, MoreVertical, Trash, X, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import EditAppointmentDialog from './EditAppointmentDialog';

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any | null;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'single' | 'series'>('single');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    // Check if appointment is part of a recurring series
    if (appointment?.recurring_group_id) {
      setIsRecurring(true);
    } else {
      setIsRecurring(false);
    }
  }, [appointment]);

  if (!appointment) return null;

  const appointmentDate = appointment.date ? new Date(appointment.date) : new Date();
  const formattedDate = format(appointmentDate, 'EEEE, MMMM d, yyyy');

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const handleDeleteAppointment = async () => {
    setIsLoading(true);
    try {
      if (isRecurring && deleteOption === 'series') {
        // Delete all future appointments in the series
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('recurring_group_id', appointment.recurring_group_id)
          .gte('date', appointment.date);

        if (error) throw error;

        toast({
          title: "Success",
          description: "All future recurring appointments have been deleted.",
        });
      } else {
        // Delete only this specific appointment
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', appointment.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "The appointment has been deleted.",
        });
      }

      setIsDeleteDialogOpen(false);
      onClose();
      onAppointmentUpdated();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete the appointment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecurrenceText = () => {
    switch (appointment.appointment_recurring) {
      case 'weekly':
        return 'Repeats weekly';
      case 'biweekly':
        return 'Repeats every 2 weeks';
      case 'monthly':
        return 'Repeats every 4 weeks';
      default:
        return '';
    }
  };

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{appointment.clientName || 'Unknown Client'}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditClick}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Appointment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Appointment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
              </div>

              {isRecurring && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50">
                    <Calendar className="h-3 w-3 mr-1" />
                    {getRecurrenceText()}
                  </Badge>
                </div>
              )}

              <div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {appointment.status || 'Scheduled'}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment{isRecurring ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRecurring ? (
                <div className="space-y-4">
                  <p>This is a recurring appointment. Would you like to delete just this appointment or all future appointments in this series?</p>

                  <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as 'single' | 'series')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="single" />
                      <Label htmlFor="single">Delete only this appointment</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="series" id="series" />
                      <Label htmlFor="series">Delete this and all future appointments in the series</Label>
                    </div>
                  </RadioGroup>
                </div>
              ) : (
                "Are you sure you want to delete this appointment? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {appointment && (
        <EditAppointmentDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          appointment={appointment}
          onAppointmentUpdated={onAppointmentUpdated}
        />
      )}
    </>
  );
};

export default AppointmentDetailsDialog;
