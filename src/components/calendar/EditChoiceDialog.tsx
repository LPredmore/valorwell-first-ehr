
import React from 'react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditChoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSingle: () => void;
  onEditAll: () => void;
  date: Date | null;
  isRecurring: boolean;
}

const EditChoiceDialog: React.FC<EditChoiceDialogProps> = ({
  isOpen,
  onClose,
  onEditSingle,
  onEditAll,
  date,
  isRecurring,
}) => {
  if (!date || !isRecurring) return null;

  const formattedDate = format(date, 'EEEE, MMMM d, yyyy');

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Availability</AlertDialogTitle>
          <AlertDialogDescription>
            How would you like to edit this availability block?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="bg-slate-100 p-3 rounded-md">
              <p className="font-medium">Edit only this occurrence</p>
              <p className="text-sm text-slate-600">
                Only the availability for {formattedDate} will be modified.
              </p>
            </div>
            <div className="bg-slate-100 p-3 rounded-md">
              <p className="font-medium">Edit all recurring instances</p>
              <p className="text-sm text-slate-600">
                All occurrences of this weekly availability will be updated.
              </p>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onEditSingle}>
            Edit only this occurrence
          </AlertDialogAction>
          <AlertDialogAction onClick={onEditAll}>
            Edit all occurrences
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditChoiceDialog;
