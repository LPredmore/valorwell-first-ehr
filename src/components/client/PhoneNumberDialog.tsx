
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PhoneNumberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPhoneNumberSaved?: (phoneNumber: string) => void;
}

const PhoneNumberDialog: React.FC<PhoneNumberDialogProps> = ({ 
  isOpen, 
  onClose, 
  onPhoneNumberSaved 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSave = () => {
    if (onPhoneNumberSaved) onPhoneNumberSaved(phoneNumber);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Phone Number</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneNumberDialog;
