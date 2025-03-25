
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type StaffProfileEditProps = {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
};

const StaffProfileEdit = ({ isOpen, onClose }: StaffProfileEditProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Staff Profile Functionality Removed</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <p className="text-center text-gray-600">
            Staff profile creation and editing functionality has been removed.
          </p>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffProfileEdit;
