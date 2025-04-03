
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AvailabilityEditDialogProps } from './availability-edit/types';
import TimeInput from './availability-edit/TimeInput';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useAvailabilityEdit } from './availability-edit/useAvailabilityEdit';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const AvailabilityEditDialog: React.FC<AvailabilityEditDialogProps> = ({
isOpen,
onClose,
availabilityBlock,
specificDate,
clinicianId,
onAvailabilityUpdated
}) => {
const {
  isLoading,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  timeOptions,
  handleSaveClick,
  handleDeleteClick,
  confirmDelete,
  isRecurring,
  isException,
  isStandalone,
  editOption,
  setEditOption,
  isEditOptionDialogOpen, 
  setIsEditOptionDialogOpen,
  saveAvailability
} = useAvailabilityEdit(
  isOpen,
  onClose,
  availabilityBlock,
  specificDate,
  clinicianId,
  onAvailabilityUpdated
);

if (!availabilityBlock || !specificDate) {
  return null;
}

const availabilityType = isStandalone 
  ? "one-time" 
  : isException 
    ? "modified recurring" 
    : "recurring";

return (
<>
<Dialog open={isOpen} onOpenChange={onClose}>
<DialogContent className="sm:max-w-[500px]">
<DialogHeader>
<DialogTitle>Edit Availability for {format(specificDate, 'EEEE, MMMM d, yyyy')}</DialogTitle>
</DialogHeader>

<div className="grid gap-4 py-4">
<TimeInput
id="startTime"
label="Start Time"
value={startTime}
onChange={setStartTime}
timeOptions={timeOptions}
/>

<TimeInput
id="endTime"
label="End Time"
value={endTime}
onChange={setEndTime}
timeOptions={timeOptions}
/>

{isRecurring && !isException && (
  <div className="mt-2 p-3 bg-blue-50 text-sm rounded-md border border-blue-100">
    <div className="font-medium text-blue-700 mb-1">Recurring Availability</div>
    <p className="text-blue-600">
      This is part of a recurring availability pattern. When you save, you'll be asked if you want to update just this occurrence or the entire series.
    </p>
  </div>
)}

{(isException || isStandalone) && (
  <div className="mt-2 p-3 bg-blue-50 text-sm rounded-md border border-blue-100">
    <div className="font-medium text-blue-700 mb-1">One-time Change</div>
    <p className="text-blue-600">
      This will only modify your availability for {format(specificDate, 'MMMM d, yyyy')}.
    </p>
  </div>
)}
</div>

<DialogFooter className="flex justify-between">
<Button variant="destructive" onClick={handleDeleteClick} disabled={isLoading}>
  Cancel Availability
</Button>
<div className="flex gap-2">
  <Button variant="outline" onClick={onClose} disabled={isLoading}>
    Close
  </Button>
  <Button 
    type="button" 
    onClick={() => {
      if (isRecurring && !isException) {
        setIsEditOptionDialogOpen(true);
      } else {
        handleSaveClick();
      }
    }} 
    disabled={isLoading}
  >
    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
    {isLoading ? "Saving..." : "Save Changes"}
  </Button>
</div>
</DialogFooter>
</DialogContent>
</Dialog>

<DeleteConfirmationDialog
  isOpen={isDeleteDialogOpen}
  setIsOpen={setIsDeleteDialogOpen}
  specificDate={specificDate}
  confirmDelete={confirmDelete}
  isLoading={isLoading}
  isRecurring={isRecurring}
/>

{/* Edit Option Dialog for Recurring Availability */}
<AlertDialog open={isEditOptionDialogOpen} onOpenChange={setIsEditOptionDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Edit Recurring Availability</AlertDialogTitle>
      <AlertDialogDescription>
        <div className="space-y-4">
          <p>This is a recurring availability block. Would you like to edit just this occurrence or all future occurrences?</p>

          <RadioGroup value={editOption} onValueChange={(value) => setEditOption(value as 'single' | 'series')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="edit-single" />
              <Label htmlFor="edit-single">Edit only this occurrence</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="series" id="edit-series" />
              <Label htmlFor="edit-series">Edit this and all future occurrences</Label>
            </div>
          </RadioGroup>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => saveAvailability(editOption)} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Continue'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
</>
);
};

export default AvailabilityEditDialog;
