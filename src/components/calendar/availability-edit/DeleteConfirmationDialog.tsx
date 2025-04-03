
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  specificDate: Date;
  confirmDelete: () => void;
  isLoading: boolean;
  isRecurring?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  setIsOpen,
  specificDate,
  confirmDelete,
  isLoading,
  isRecurring = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isRecurring ? "Cancel this availability occurrence?" : "Delete this availability?"}
          </DialogTitle>
          <DialogDescription>
            {isRecurring ? 
              `This will cancel your availability on ${format(specificDate, 'EEEE, MMMM d, yyyy')} only. 
              Your recurring schedule for other dates will remain unchanged.` :
              `This will permanently remove this availability block on ${format(specificDate, 'EEEE, MMMM d, yyyy')}.`
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isRecurring ? "Cancel This Occurrence" : "Delete Availability"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
