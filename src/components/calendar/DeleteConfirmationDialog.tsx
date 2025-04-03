
import React from 'react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { DeleteDialogProps } from './availability-edit/types';

const DeleteConfirmationDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  setIsOpen,
  specificDate,
  confirmDelete,
  isLoading,
  isRecurring
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Availability</AlertDialogTitle>
          <AlertDialogDescription>
            {isRecurring ? (
              <>
                <p className="mb-2">
                  You are about to cancel your availability for <strong>{format(specificDate, 'EEEE, MMMM d, yyyy')}</strong>.
                </p>
                <p className="p-2 bg-amber-50 text-amber-800 rounded border border-amber-200 mb-2">
                  This will only remove your availability for this specific date. Your recurring weekly schedule will remain unchanged.
                </p>
              </>
            ) : (
              <>
                <p className="mb-2">
                  You are about to delete your availability for <strong>{format(specificDate, 'EEEE, MMMM d, yyyy')}</strong>.
                </p>
                <p className="p-2 bg-amber-50 text-amber-800 rounded border border-amber-200 mb-2">
                  This will permanently remove this availability block.
                </p>
              </>
            )}
            <p>Are you sure you want to continue?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
            {isLoading ? "Deleting..." : "Delete Availability"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
