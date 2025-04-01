
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import VideoChat from '@/components/video/VideoChat';
import { getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { Appointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';

export interface VideoSessionManagerProps {
  onRefetchAppointments: () => void;
}

export interface VideoSessionManagerRef {
  startVideoSession: (appointment: Appointment) => Promise<void>;
}

const VideoSessionManager = forwardRef<VideoSessionManagerRef, VideoSessionManagerProps>(
  ({ onRefetchAppointments }, ref) => {
    const { toast } = useToast();
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    const [currentVideoRoomUrl, setCurrentVideoRoomUrl] = useState<string | null>(null);
    
    // Expose the startVideoSession method to parent components
    useImperativeHandle(ref, () => ({
      startVideoSession: async (appointment: Appointment) => {
        try {
          if (appointment.video_room_url) {
            setCurrentVideoRoomUrl(appointment.video_room_url);
            setIsVideoDialogOpen(true);
          } else {
            const result = await getOrCreateVideoRoom(appointment);
            
            if (result.success && result.url) {
              setCurrentVideoRoomUrl(result.url);
              setIsVideoDialogOpen(true);
              onRefetchAppointments();
            } else {
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
      }
    }));

    const handleCloseVideoDialog = () => {
      setIsVideoDialogOpen(false);
      setCurrentVideoRoomUrl(null);
    };

    return (
      <>
        {isVideoDialogOpen && currentVideoRoomUrl && (
          <VideoChat
            roomUrl={currentVideoRoomUrl}
            isOpen={isVideoDialogOpen}
            onClose={handleCloseVideoDialog}
          />
        )}
      </>
    );
  }
);

VideoSessionManager.displayName = 'VideoSessionManager';

export default VideoSessionManager;
