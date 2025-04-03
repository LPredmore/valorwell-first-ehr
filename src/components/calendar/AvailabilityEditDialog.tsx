
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
  // Log the availability block data to help with debugging
  React.useEffect(() => {
    if (isOpen && availabilityBlock) {
      console.log('AvailabilityEditDialog received block:', {
        id: availabilityBlock.id,
        start_time: availabilityBlock.start_time,
        end_time: availabilityBlock.end_time,
        isException: availabilityBlock.isException,
        isStandalone: availabilityBlock.isStandalone
      });
    }
  }, [isOpen, availabilityBlock]);

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

  // Guard clause - show error if missing key data
  if (!isOpen) return null;
  
  if (!availabilityBlock || !specificDate) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-red-500">
            Missing availability data. Please try again.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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
              <div className="font-medium text-blue-700 mb-1">One-time Change</div>
              <p className="text-blue-600">
                This will only modify your availability for {format(specificDate, 'MMMM d, yyyy')}.
                Your regular weekly schedule will remain unchanged.
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
      />
    </>
  );
};

export default AvailabilityEditDialog;
