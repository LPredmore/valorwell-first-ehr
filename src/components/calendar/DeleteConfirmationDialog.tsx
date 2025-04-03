
import React, { useState } from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
  const [deleteOption, setDeleteOption] = useState<'single' | 'series'>('single');
  
  if (!specificDate) return null;

  // Format the date properly for display
  const formattedDate = formatInTimeZone(
    specificDate,
    ensureIANATimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone),
    'EEEE, MMMM d, yyyy'
  );
  
  const handleConfirm = () => {
    confirmDelete();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Availability</AlertDialogTitle>
          <AlertDialogDescription>
            {isRecurring ? (
              <div className="space-y-4">
                <p>This is part of a recurring availability pattern. Do you want to cancel just this occurrence or all occurrences?</p>
                
                <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as 'single' | 'series')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single">Cancel only this occurrence ({formattedDate})</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="series" id="series" />
                    <Label htmlFor="series">Cancel all occurrences in this series</Label>
                  </div>
                </RadioGroup>
              </div>
            ) : (
              <p>Are you sure you want to cancel your availability for {formattedDate}?</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? "Processing..." : "Yes, Cancel Availability"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
