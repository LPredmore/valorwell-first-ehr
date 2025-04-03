
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AvailabilityEditDialogProps } from './availability-edit/types';
import TimeInput from './availability-edit/TimeInput';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import EditChoiceDialog from './EditChoiceDialog';
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
  confirmDelete,
  isRecurring,
  isException,
  isStandalone,
  isEditChoiceDialogOpen,
  setIsEditChoiceDialogOpen,
  handleEditChoice,
  editMode
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

const getEditDescription = () => {
  if (isStandalone || isException) {
    return "This will modify your availability for " + format(specificDate, 'MMMM d, yyyy') + ".";
  }
  
  if (isRecurring && !isException) {
    if (editMode === 'single') {
      return "This will only modify your availability for " + format(specificDate, 'MMMM d, yyyy') + ". Your regular weekly schedule will remain unchanged.";
    } else if (editMode === 'all') {
      return "This will update this time slot for all future weeks.";
    } else {
      return "Please select whether to edit just this occurrence or the entire series.";
    }
  }
  
  return "This will modify your availability for " + format(specificDate, 'MMMM d, yyyy') + ".";
};

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

<div className="mt-2 p-3 bg-blue-50 text-sm rounded-md border border-blue-100">
<div className="font-medium text-blue-700 mb-1">
  {isRecurring && !isException && !editMode ? "Choose Edit Type" : "One-time Change"}
</div>
<p className="text-blue-600">
  {getEditDescription()}
</p>
</div>
</div>

<DialogFooter className="flex justify-between">
<Button variant="destructive" onClick={handleDeleteClick} disabled={isLoading}>
Cancel Availability
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
isRecurring={isRecurring}
/>

<EditChoiceDialog
isOpen={isEditChoiceDialogOpen}
onClose={() => setIsEditChoiceDialogOpen(false)}
onEditSingle={() => handleEditChoice('single')}
onEditAll={() => handleEditChoice('all')}
date={specificDate}
isRecurring={isRecurring && !isException}
/>
</>
);
};

export default AvailabilityEditDialog;
