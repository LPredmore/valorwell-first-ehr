
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateVideoRoom } from '@/integrations/supabase/client';
import VideoChat from '@/components/video/VideoChat';
import { Appointment } from '@/hooks/useAppointments';

interface VideoSessionManagerProps {
  onRefetchAppointments: () => void;
}

const VideoSessionManager: React.FC<VideoSessionManagerProps> = ({ onRefetchAppointments }) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const { toast } = useToast();

  const startVideoSession = async (appointment: Appointment) => {
    try {
      console.log("Starting video session for appointment:", appointment.id);
      
      if (appointment.video_room_url) {
        console.log("Using existing video room URL:", appointment.video_room_url);
        setCurrentVideoUrl(appointment.video_room_url);
        setIsVideoOpen(true);
      } else {
        console.log("Creating new video room for appointment:", appointment.id);
        const result = await getOrCreateVideoRoom(appointment.id);
        console.log("Video room creation result:", result);
        
        if (result.success && result.url) {
          setCurrentVideoUrl(result.url);
          setIsVideoOpen(true);
          onRefetchAppointments();
        } else {
          console.error("Failed to create video room:", result.error);
          throw new Error('Failed to create video room');
        }
      }
    } catch (error) {
      console.error('Error starting video session:', error);
      toast({
        title: 'Error',
        description: 'Could not start the video session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {isVideoOpen && (
        <VideoChat
          roomUrl={currentVideoUrl}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
      {/* Export the startVideoSession method for use by parent components */}
      {React.createElement('div', {
        style: { display: 'none' },
        'data-start-session': JSON.stringify(startVideoSession),
      })}
    </>
  );
};

// Custom hook to use the VideoSessionManager
export const useVideoSession = () => {
  const [videoSessionRef, setVideoSessionRef] = React.useState<HTMLDivElement | null>(null);

  const startVideoSession = React.useCallback((appointment: Appointment) => {
    if (videoSessionRef) {
      const startSessionFn = JSON.parse(videoSessionRef.dataset.startSession || '');
      if (typeof startSessionFn === 'function') {
        startSessionFn(appointment);
      }
    }
  }, [videoSessionRef]);

  const VideoSessionElement = React.useCallback(({ onRefetchAppointments }: { onRefetchAppointments: () => void }) => (
    <VideoSessionManager 
      ref={setVideoSessionRef} 
      onRefetchAppointments={onRefetchAppointments} 
    />
  ), []);

  return {
    VideoSessionElement,
    startVideoSession
  };
};

export default VideoSessionManager;
