
import React from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { DeleteDialogProps } from './availability-edit/types';
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';

const DeleteConfirmationDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  setIsOpen,
  specificDate,
  confirmDelete,
  isLoading,
  isRecurring
}) => {
  if (!specificDate) return null;

  // Format the date properly for display
  const formattedDate = formatInTimeZone(
    specificDate,
    ensureIANATimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone),
    'EEEE, MMMM d, yyyy'
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Availability</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your availability for {formattedDate}?
            {isRecurring && " This will only affect this single occurrence and not your recurring weekly schedule."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, Keep Availability</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? "Processing..." : "Yes, Cancel Availability"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
