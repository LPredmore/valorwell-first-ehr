
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddClinicianDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onClinicianAdded?: (clinician: any) => void;
}

const AddClinicianDialog: React.FC<AddClinicianDialogProps> = ({ isOpen, onClose, onClinicianAdded }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Clinician</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a placeholder for the Add Clinician Dialog.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClinicianDialog;
