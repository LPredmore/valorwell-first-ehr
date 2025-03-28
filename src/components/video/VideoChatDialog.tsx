
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import VideoChat from './VideoChat';
import { getOrCreateAppointmentRoom } from '@/integrations/daily/dailyService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface VideoChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
}

const VideoChatDialog: React.FC<VideoChatDialogProps> = ({ 
  isOpen, 
  onClose, 
  appointmentId 
}) => {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && appointmentId) {
      setIsLoading(true);
      setError(null);
      
      getOrCreateAppointmentRoom(appointmentId)
        .then((url) => {
          setRoomUrl(url);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error getting room URL:', err);
          setError('Failed to create video room. Please try again.');
          setIsLoading(false);
          toast({
            title: 'Error',
            description: 'Failed to create video room. Please try again.',
            variant: 'destructive'
          });
        });
    }
  }, [isOpen, appointmentId, toast]);

  const handleClose = () => {
    onClose();
    // Reset state after dialog closes
    setTimeout(() => {
      setRoomUrl(null);
      setError(null);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-700">Preparing video session...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500">{error}</p>
          </div>
        ) : roomUrl ? (
          <VideoChat roomUrl={roomUrl} onClose={handleClose} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500">Could not create video room. Please try again.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoChatDialog;
