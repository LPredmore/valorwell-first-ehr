
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { CalendarClock, User, Clock, AlertTriangle } from 'lucide-react';
import { supabase, getOrCreateVideoRoom } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import VideoChat from '@/components/video/VideoChat';

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    client_id: string;
    date: string;
    start_time: string;
    end_time: string;
    type: string;
    status: string;
    clientName?: string;
  } | null;
  onAppointmentUpdated?: () => void;
}

const AppointmentDetailsDialog: React.FC<AppointmentDetailsDialogProps> = ({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVideoSessionOpen, setIsVideoSessionOpen] = useState(false);
  const [videoRoomUrl, setVideoRoomUrl] = useState<string | null>(null);
  const [isLoadingVideoSession, setIsLoadingVideoSession] = useState(false);

  if (!appointment) return null;

  const handleClientClick = () => {
    navigate(`/clients/${appointment.client_id}`);
    onClose();
  };

  const handleCancelClick = () => {
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!appointment) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);
        
      if (error) {
        console.error('Error cancelling appointment:', error);
        toast({
          title: "Error",
          description: "Failed to cancel the appointment. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Appointment Cancelled",
          description: "The appointment has been successfully cancelled."
        });
        if (onAppointmentUpdated) {
          onAppointmentUpdated();
        }
        onClose();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsCancelDialogOpen(false);
    }
  };

  const handleStartSession = async () => {
    if (!appointment) return;
    
    setIsLoadingVideoSession(true);
    try {
      const result = await getOrCreateVideoRoom(appointment.id);
      
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to create video room');
      }
      
      setVideoRoomUrl(result.url);
      setIsVideoSessionOpen(true);
      
      toast({
        title: "Video Session Ready",
        description: "You are entering the video session now."
      });
    } catch (error) {
      console.error('Error starting video session:', error);
      toast({
        title: "Error",
        description: "Failed to start the video session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVideoSession(false);
    }
  };

  const handleCloseVideoSession = () => {
    setIsVideoSessionOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View details for this appointment
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium">Client</div>
                  <button 
                    onClick={handleClientClick} 
                    className="text-sm text-primary hover:underline focus:outline-none"
                  >
                    {appointment.clientName || 'Unknown Client'}
                  </button>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CalendarClock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium">Date</div>
                  <div className="text-sm text-gray-600">
                    {format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium">Time</div>
                  <div className="text-sm text-gray-600">
                    {format(parseISO(`2000-01-01T${appointment.start_time}`), 'h:mm a')} - 
                    {format(parseISO(`2000-01-01T${appointment.end_time}`), 'h:mm a')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 flex items-center justify-center text-gray-500 mt-0.5">
                  <div className={`h-3 w-3 rounded-full ${appointment.status === 'scheduled' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                </div>
                <div>
                  <div className="font-medium">Status</div>
                  <div className="text-sm text-gray-600 capitalize">{appointment.status}</div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="destructive" onClick={handleCancelClick}>
              Cancel Appointment
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={handleStartSession}
                disabled={isLoadingVideoSession}
              >
                {isLoadingVideoSession ? "Loading..." : "Start Session"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>No, keep it</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelConfirm} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Cancelling..." : "Yes, cancel appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video Session Dialog */}
      {videoRoomUrl && (
        <VideoChat 
          roomUrl={videoRoomUrl} 
          isOpen={isVideoSessionOpen} 
          onClose={handleCloseVideoSession} 
        />
      )}
    </>
  );
};

export default AppointmentDetailsDialog;
