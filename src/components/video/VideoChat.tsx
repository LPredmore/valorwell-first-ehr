
/**
 * @component VideoChat
 * @description A component for embedding a video chat session using Daily.co.
 * Provides a modal dialog with an embedded iframe for video conferencing,
 * along with controls for toggling audio/video and ending the call.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * @interface VideoChatProps
 * @description Props for the VideoChat component
 */
interface VideoChatProps {
  /**
   * The URL of the Daily.co room to connect to
   */
  roomUrl: string;
  
  /**
   * Whether the video chat dialog is open
   */
  isOpen: boolean;
  
  /**
   * Function to call when the dialog is closed
   */
  onClose: () => void;
}

/**
 * VideoChat component for embedding a Daily.co video chat session in a dialog.
 *
 * @param props - The component props
 * @param props.roomUrl - The URL of the Daily.co room to connect to
 * @param props.isOpen - Whether the video chat dialog is open
 * @param props.onClose - Function to call when the dialog is closed
 *
 * @example
 * // Basic usage
 * <VideoChat
 *   roomUrl="https://valorwell.daily.co/room-name"
 *   isOpen={isVideoSessionOpen}
 *   onClose={() => setIsVideoSessionOpen(false)}
 * />
 */
const VideoChat: React.FC<VideoChatProps> = ({ roomUrl, isOpen, onClose }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Reset loading state when the component opens
  useEffect(() => {
    if (!isOpen) return;
    
    console.log('VideoChat opened, resetting state');
    setIsLoading(true);
    setError(null);
    
    if (!roomUrl) {
      console.error('No room URL provided');
      setError('No video room URL provided');
      setIsLoading(false);
      return;
    }
    
    // Force hide loading spinner after 8 seconds
    // This ensures the UI is usable even if load events don't fire correctly
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Video chat load timeout reached, forcing spinner to hide');
        setIsLoading(false);
      }
    }, 8000);
    
    return () => {
      console.log('Cleaning up VideoChat effects');
      clearTimeout(timeoutId);
    };
  }, [isOpen, roomUrl]);

  // Handle iframe loading
  useEffect(() => {
    if (!roomUrl || !isOpen) return;

    console.log('Setting up iframe load handlers');
    
    // Use multiple methods to detect when the iframe is loaded
    const handleIframeLoad = () => {
      console.log('Video iframe loaded via addEventListener');
      setIsLoading(false);
    };

    const handleIframeMessage = (event: MessageEvent) => {
      // Listen for messages from Daily.co iframe that might indicate it's ready
      if (event.origin.includes('daily.co') && event.data) {
        console.log('Received message from Daily.co iframe', typeof event.data);
        // After receiving any message from daily.co, consider it loaded
        setIsLoading(false);
      }
    };

    // Add event listeners
    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
      window.addEventListener('message', handleIframeMessage);
    }

    return () => {
      // Clean up event listeners
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
      }
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [roomUrl, isOpen]);

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
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 pointer-events-none">
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
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full border-0"
            onLoad={() => {
              console.log('Iframe onLoad event fired directly');
              setIsLoading(false);
            }}
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
        <DialogTitle className="sr-only">Video Session</DialogTitle>
        <DialogDescription className="sr-only">Video call session interface</DialogDescription>
        {renderVideoChatCard()}
      </DialogContent>
    </Dialog>
  );
};

export default VideoChat;
