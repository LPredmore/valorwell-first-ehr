
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/packages/ui';

const AddClinicianDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Clinician</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Clinician</DialogTitle>
        </DialogHeader>
        {/* Form implementation */}
      </DialogContent>
    </Dialog>
  );
};

export default AddClinicianDialog;
