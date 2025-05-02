
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded?: (client: any) => void;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({ isOpen, onClose, onClientAdded }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a placeholder for the Add Client Dialog.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
