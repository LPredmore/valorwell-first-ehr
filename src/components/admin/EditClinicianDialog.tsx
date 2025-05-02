
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditClinicianDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinician?: any;
  onClinicianUpdated?: (clinician: any) => void;
}

const EditClinicianDialog: React.FC<EditClinicianDialogProps> = ({ 
  isOpen, 
  onClose, 
  clinician, 
  onClinicianUpdated 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Clinician</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a placeholder for the Edit Clinician Dialog.</p>
          {clinician && (
            <p>Editing: {clinician.id}</p>
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

export default EditClinicianDialog;
