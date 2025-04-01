
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/hooks/useAppointments';

interface DocumentSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  selectedStatus: string | undefined;
  onStatusChange: (value: string) => void;
  onSubmit: () => void;
}

const DocumentSessionDialog: React.FC<DocumentSessionDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedAppointment,
  selectedStatus,
  onStatusChange,
  onSubmit
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Document Session</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Select onValueChange={onStatusChange} value={selectedStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="occurred">Session Occurred</SelectItem>
              <SelectItem value="no-show">Late Cancel/No Show</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            onClick={onSubmit}
            disabled={!selectedStatus || selectedStatus === 'occurred'}
          >
            Provide Documentation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentSessionDialog;
