
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Video, VideoOff, Mic, MicOff, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import DailyIframe dynamically to prevent build issues
let DailyIframe: any = null;

interface VideoChatProps {
  roomUrl: string;
  onClose: () => void;
}

const VideoChat: React.FC<VideoChatProps> = ({ roomUrl, onClose }) => {
  const { toast } = useToast();
  const [callObject, setCallObject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const frameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import the Daily.co library
    import('@daily-co/daily-js').then((Daily) => {
      DailyIframe = Daily.default;
      initializeCall();
    }).catch(error => {
      console.error('Failed to load Daily.co library:', error);
      toast({
        title: 'Failed to load video chat',
        description: 'Could not initialize the video chat. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
    });

    return () => {
      // Clean up the call object when the component unmounts
      if (callObject) {
        callObject.destroy();
      }
    };
  }, []);

  const initializeCall = async () => {
    if (!DailyIframe) return;

    try {
      // Create a new call object
      const newCallObject = DailyIframe.createFrame({
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '8px',
        },
        showLeaveButton: false,
        showFullscreenButton: true,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        }
      });

      setCallObject(newCallObject);

      // Add the call frame to the DOM
      if (frameContainerRef.current) {
        frameContainerRef.current.appendChild(newCallObject.iframe);
      }

      // Set up event listeners
      newCallObject.on('loaded', () => {
        console.log('Daily.co iframe loaded');
      });

      newCallObject.on('joining-meeting', () => {
        console.log('Joining meeting...');
      });

      newCallObject.on('joined-meeting', () => {
        console.log('Joined meeting');
        setIsLoading(false);
      });

      newCallObject.on('participant-joined', (event: any) => {
        console.log('Participant joined:', event.participant);
        updateParticipants(newCallObject);
      });

      newCallObject.on('participant-left', (event: any) => {
        console.log('Participant left:', event.participant);
        updateParticipants(newCallObject);
      });

      newCallObject.on('participant-updated', (event: any) => {
        updateParticipants(newCallObject);
      });

      newCallObject.on('error', (error: any) => {
        console.error('Daily.co error:', error);
        toast({
          title: 'Video chat error',
          description: error.errorMsg || 'An error occurred with the video chat',
          variant: 'destructive'
        });
      });

      // Join the room
      await newCallObject.join({ url: roomUrl });
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: 'Failed to join video session',
        description: 'An error occurred while trying to join the video session. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const updateParticipants = (call: any) => {
    const participantsObj = call.participants();
    if (participantsObj) {
      const participantsArray = Object.values(participantsObj);
      setParticipants(participantsArray);
    }
  };

  const toggleCamera = () => {
    if (callObject) {
      const newState = !isCameraOn;
      callObject.setLocalVideo(newState);
      setIsCameraOn(newState);
    }
  };

  const toggleMic = () => {
    if (callObject) {
      const newState = !isMicOn;
      callObject.setLocalAudio(newState);
      setIsMicOn(newState);
    }
  };

  const leaveCall = () => {
    if (callObject) {
      callObject.destroy();
      setCallObject(null);
    }
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative" style={{ minHeight: '70vh' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-gray-700">Connecting to video session...</p>
            </div>
          </div>
        )}
        <div 
          ref={frameContainerRef} 
          className="w-full h-full rounded-lg overflow-hidden bg-gray-900"
        ></div>
      </div>

      <div className="flex justify-center space-x-4 mt-4 p-4 bg-gray-100 rounded-lg">
        <Button 
          onClick={toggleCamera} 
          variant={isCameraOn ? "default" : "outline"}
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          {isCameraOn ? <Video /> : <VideoOff />}
        </Button>
        <Button 
          onClick={toggleMic} 
          variant={isMicOn ? "default" : "outline"}
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </Button>
        <Button 
          onClick={leaveCall} 
          variant="destructive"
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <Phone className="rotate-135" />
        </Button>
      </div>
    </div>
  );
};

export default VideoChat;
