
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoChatProps {
  roomUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoChat: React.FC<VideoChatProps> = ({ roomUrl, isOpen, onClose }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!roomUrl) {
      setError('No video room URL provided');
      setIsLoading(false);
      return;
    }

    // Setup iframe load handler
    const handleIframeLoad = () => {
      setIsLoading(false);
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [roomUrl]);

  const handleClose = () => {
    // Cleanup and close
    onClose();
  };

  const toggleAudio = () => {
    try {
      // This is a simple approach - in a more advanced implementation, 
      // we would use the Daily.co JavaScript API for finer control
      if (iframeRef.current && iframeRef.current.contentWindow) {
        // Send postMessage to iframe - this is just illustrative
        // A full implementation would use the Daily.co JS API
        iframeRef.current.contentWindow.postMessage(
          { action: 'toggle-audio' },
          '*'
        );
        setIsAudioEnabled(!isAudioEnabled);
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle audio',
        variant: 'destructive',
      });
    }
  };

  const toggleVideo = () => {
    try {
      // Similar to audio toggle
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { action: 'toggle-video' },
          '*'
        );
        setIsVideoEnabled(!isVideoEnabled);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle video',
        variant: 'destructive',
      });
    }
  };

  // When not using a full dialog, use this
  const renderVideoChatCard = () => (
    <Card className="w-full max-w-4xl h-[600px] mx-auto">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <h3 className="font-semibold">Video Session</h3>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 relative h-[450px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        {error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={roomUrl}
            allow="camera; microphone; fullscreen; speaker; display-capture"
            className="w-full h-full border-0"
          ></iframe>
        )}
      </CardContent>
      <CardFooter className="flex justify-center space-x-4 p-4">
        <Button
          variant={isAudioEnabled ? "default" : "outline"}
          size="icon"
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={isVideoEnabled ? "default" : "outline"}
          size="icon"
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button variant="destructive" onClick={handleClose}>
          End Call
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        {renderVideoChatCard()}
      </DialogContent>
    </Dialog>
  );
};

export default VideoChat;
