
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SessionNoteTemplate from '../templates/SessionNoteTemplate';

interface SessionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

const SessionNoteModal: React.FC<SessionNoteModalProps> = ({ 
  isOpen, 
  onClose, 
  clientId 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <SessionNoteTemplate onClose={onClose} clientId={clientId} />
      </DialogContent>
    </Dialog>
  );
};

export default SessionNoteModal;
