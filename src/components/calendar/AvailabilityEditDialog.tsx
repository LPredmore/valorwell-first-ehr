
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AvailabilityEditDialogProps } from './availability-edit/types';
import TimeInput from './availability-edit/TimeInput';
import DeleteConfirmationDialog from './availability-edit/DeleteConfirmationDialog';
import { useAvailabilityEdit } from './availability-edit/useAvailabilityEdit';

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
confirmDelete
} = useAvailabilityEdit(
isOpen,
onClose,
availabilityBlock,
specificDate,
clinicianId,
onAvailabilityUpdated
);

// Add logging for component render
React.useEffect(() => {
  if (isOpen) {
    console.log('AvailabilityEditDialog opened with props:', {
      availabilityBlock: availabilityBlock ? {
        id: availabilityBlock.id,
        day_of_week: availabilityBlock.day_of_week,
        start_time: availabilityBlock.start_time,
        end_time: availabilityBlock.end_time,
        isException: availabilityBlock.isException,
        isStandalone: availabilityBlock.isStandalone,
        originalAvailabilityId: availabilityBlock.originalAvailabilityId
      } : null,
      specificDate: specificDate ? format(specificDate, 'yyyy-MM-dd') : null,
      clinicianId
    });
  }
}, [isOpen, availabilityBlock, specificDate, clinicianId]);

// Safety check for necessary data
if (!availabilityBlock || !specificDate) {
  console.error('AvailabilityEditDialog: Missing required data', { 
    hasAvailabilityBlock: !!availabilityBlock,
    hasSpecificDate: !!specificDate
  });
  return null;
}

// Determine what type of availability we're editing for the UI messaging
const getAvailabilityTypeMessage = () => {
  if (availabilityBlock.isStandalone) {
    return "This is a one-time availability slot specifically for this date.";
  } else if (availabilityBlock.isException) {
    return "This is a modification to your regular weekly schedule for this date only.";
  } else {
    return "This will only modify your availability for this date. Your regular weekly schedule will remain unchanged.";
  }
};

return (
<>
<Dialog open={isOpen} onOpenChange={(open) => {
  console.log('Dialog onOpenChange:', open);
  if (!open) onClose();
}}>
<DialogContent className="sm:max-w-[500px]">
<DialogHeader>
<DialogTitle>Edit Availability for {format(specificDate, 'EEEE, MMMM d, yyyy')}</DialogTitle>
</DialogHeader>

<div className="grid gap-4 py-4">
<TimeInput
id="startTime"
label="Start Time"
value={startTime}
onChange={(value) => {
  console.log('Start time changed:', value);
  setStartTime(value);
}}
timeOptions={timeOptions}
/>

<TimeInput
id="endTime"
label="End Time"
value={endTime}
onChange={(value) => {
  console.log('End time changed:', value);
  setEndTime(value);
}}
timeOptions={timeOptions}
/>

<div className="mt-2 p-3 bg-blue-50 text-sm rounded-md border border-blue-100">
<div className="font-medium text-blue-700 mb-1">One-time Change</div>
<p className="text-blue-600">
{getAvailabilityTypeMessage()}
</p>
</div>
</div>

<DialogFooter className="flex justify-between">
<Button 
  variant="destructive" 
  onClick={handleDeleteClick} 
  disabled={isLoading}
>
  {availabilityBlock.isStandalone ? "Delete Availability" : "Cancel Availability"}
</Button>
<div className="flex gap-2">
<Button variant="outline" onClick={onClose} disabled={isLoading}>
Close
</Button>
<Button type="button" onClick={handleSaveClick} disabled={isLoading}>
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
/>
</>
);
};

export default AvailabilityEditDialog;
