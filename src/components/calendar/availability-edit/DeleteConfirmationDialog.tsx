
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DeleteConfirmationDialogProps } from './types';

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  setIsOpen,
  specificDate,
  confirmDelete,
  isLoading,
  isRecurring
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Availability</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to cancel your availability on {format(specificDate, 'EEEE, MMMM d, yyyy')}?
          </p>
          
          {isRecurring && (
            <div className="mt-4 p-3 bg-amber-50 text-sm rounded-md border border-amber-100">
              <p className="text-amber-800">
                This will only affect your availability for {format(specificDate, 'MMMM d, yyyy')}. Your regular weekly schedule will remain unchanged.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? "Cancelling..." : "Yes, Cancel Availability"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
