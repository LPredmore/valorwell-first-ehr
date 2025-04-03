
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  specificDate: Date | null;
  confirmDelete: (mode: 'single' | 'series') => void;
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
  if (!specificDate) return null;

  const formattedDate = format(specificDate, 'EEEE, MMMM d, yyyy');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Availability</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to cancel availability for {formattedDate}?
          </p>

          {isRecurring && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
              <p className="text-sm text-blue-700">
                This is part of a recurring availability pattern.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          {isRecurring ? (
            <>
              <Button 
                variant="destructive" 
                onClick={() => confirmDelete('single')} 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                This Occurrence Only
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => confirmDelete('series')} 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Entire Series
              </Button>
            </>
          ) : (
            <Button 
              variant="destructive" 
              onClick={() => confirmDelete('single')} 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
