
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditTimeOffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timeOff?: any;
  onTimeOffUpdated?: (timeOff: any) => void;
}

const EditTimeOffDialog: React.FC<EditTimeOffDialogProps> = ({ 
  isOpen, 
  onClose, 
  timeOff, 
  onTimeOffUpdated 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Time Off</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a placeholder for the Edit Time Off Dialog.</p>
          {timeOff && (
            <p>Editing: {timeOff.id}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTimeOffDialog;
