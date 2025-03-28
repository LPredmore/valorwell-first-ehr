
import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Camera, CameraOff, Monitor, PhoneOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VideoChatProps {
  isOpen: boolean;
  onClose: () => void;
  meetingUrl: string | null;
  appointmentId: string | number;
}

const VideoChat: React.FC<VideoChatProps> = ({
  isOpen,
  onClose,
  meetingUrl,
  appointmentId
}) => {
  const { toast } = useToast();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIframeLoaded(false);
      setError(null);
      
      // Check if we have a valid meeting URL
      if (!meetingUrl) {
        setError('Could not load the video session. Please try again.');
        toast({
          title: "Error",
          description: "Failed to start video session",
          variant: "destructive"
        });
      }
    }
  }, [isOpen, meetingUrl, toast]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handleIframeError = () => {
    setError('Failed to load the video session.');
    toast({
      title: "Connection Error",
      description: "Failed to connect to the video session",
      variant: "destructive"
    });
  };

  const handleEndCall = () => {
    onClose();
    toast({
      title: "Call Ended",
      description: "You have left the video session"
    });
  };

  if (!meetingUrl) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between border-b">
          <DialogTitle>Video Session</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 relative bg-slate-900">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center p-6 max-w-md">
                <p className="mb-4">{error}</p>
                <Button onClick={onClose}>Close</Button>
              </div>
            </div>
          ) : (
            <iframe
              src={meetingUrl}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className={`w-full h-full border-0 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
          
          {!iframeLoaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-white text-center">
                <p>Connecting to video session...</p>
                <p className="text-sm mt-2">This may take a few moments</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-center">
          <Button 
            variant="destructive" 
            onClick={handleEndCall}
            className="px-6"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoChat;
