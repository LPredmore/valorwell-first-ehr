
import React from 'react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { DeleteDialogProps } from './types';

const DeleteConfirmationDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  setIsOpen,
  specificDate,
  confirmDelete,
  isLoading,
  isRecurring
}) => {
  if (!specificDate) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Availability</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your availability for {format(specificDate, 'EEEE, MMMM d, yyyy')}?
            {isRecurring && " This will not affect your regular weekly schedule."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? "Processing..." : "Yes, Cancel Availability"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
