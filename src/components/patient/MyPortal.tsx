import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Clock, FileText, Video, Loader2 } from "lucide-react";
import { format, parseISO, isToday, addDays, isFuture, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import VideoChat from '@/components/video/VideoChat';
import { Appointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';

const MyPortal = () => {
  const { userId } = useUser();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [upcomingDocuments, setUpcomingDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [currentVideoRoomUrl, setCurrentVideoRoomUrl] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchAppointments();
      fetchUpcomingDocuments();
    }
  }, [userId]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          start_time,
          end_time,
          type,
          status,
          video_room_url,
          clinician_id,
          clinicians (
            clinician_professional_name,
            clinician_first_name,
            clinician_last_name
          )
        `)
        .eq('client_id', userId)
        .order('date')
        .order('start_time');
        
      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Error",
          description: "Could not load your appointments. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      setAppointments(data || []);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading appointments.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpcomingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_assignments')
        .select(`
          id,
          status,
          due_date,
          documents (
            id,
            title,
            category
          )
        `)
        .eq('client_id', userId)
        .eq('status', 'pending')
        .order('due_date');
        
      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }
      
      setUpcomingDocuments(data || []);
    } catch (error) {
      console.error('Error in fetchUpcomingDocuments:', error);
    }
  };

  const getOrCreateVideoRoom = async (appointmentId: string) => {
    try {
      console.log('Getting or creating video room for appointment:', appointmentId);
      
      // First check if the appointment already has a video room URL
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select('video_room_url')
        .eq('id', appointmentId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching appointment:', fetchError);
        throw fetchError;
      }
      
      // If a video room URL already exists, return it
      if (appointmentData && appointmentData.video_room_url) {
        console.log('Appointment already has video room URL:', appointmentData.video_room_url);
        return { url: appointmentData.video_room_url, success: true };
      }
      
      console.log('Creating new video room via Edge Function');
      // Otherwise, create a new room via the Edge Function
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { appointmentId }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      if (!data?.url) {
        console.error('No URL returned from edge function:', data);
        throw new Error('Failed to get video room URL');
      }
      
      console.log('Video room created, URL:', data.url);
      
      // Store the room URL in the appointment record
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ video_room_url: data.url })
        .eq('id', appointmentId);
        
      if (updateError) {
        console.error('Error updating appointment with video URL:', updateError);
        throw updateError;
      }
      
      return { url: data.url, success: true };
    } catch (error) {
      console.error('Error getting/creating video room:', error);
      return { success: false, error };
    }
  };

  // Handler for starting a video session
  const startVideoSession = async (appointment: any) => {
    try {
      console.log("Starting video session for appointment:", appointment.id);
      
      if (appointment.video_room_url) {
        console.log("Using existing video room URL:", appointment.video_room_url);
        setCurrentVideoRoomUrl(appointment.video_room_url);
        setIsVideoDialogOpen(true);
      } else {
        console.log("Creating new video room for appointment:", appointment.id);
        const result = await getOrCreateVideoRoom(appointment.id);
        console.log("Video room creation result:", result);
        
        if (result.success && result.url) {
          setCurrentVideoRoomUrl(result.url);
          setIsVideoDialogOpen(true);
          fetchAppointments(); // Refresh to get updated video URL
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

  const getAppointmentTimingClass = (date: string) => {
    const appointmentDate = parseISO(date);
    const today = new Date();
    const daysUntil = differenceInDays(appointmentDate, today);
    
    if (isToday(appointmentDate)) return "text-blue-600 font-medium";
    if (daysUntil <= 2 && daysUntil > 0) return "text-orange-500 font-medium";
    return "text-gray-600";
  };

  const renderUpcomingAppointments = () => {
    // Filter for upcoming appointments (today or in the future)
    const upcomingAppointments = appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.date);
      return isToday(appointmentDate) || isFuture(appointmentDate);
    }).slice(0, 3); // Show just the next 3
    
    if (upcomingAppointments.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          No upcoming appointments scheduled.
        </div>
      );
    }
    
    return upcomingAppointments.map((appointment, index) => {
      const appointmentDate = parseISO(appointment.date);
      const isTodays = isToday(appointmentDate);
      const canJoin = isTodays; // Only allow joining today's appointments
      
      return (
        <div key={appointment.id} className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className={getAppointmentTimingClass(appointment.date)}>
                {isTodays ? 'Today' : format(appointmentDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="flex items-center mt-1">
                <Clock className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">
                  {appointment.start_time} - {appointment.end_time}
                </span>
              </div>
              <div className="mt-1 text-sm font-medium">
                {appointment.clinicians?.clinician_professional_name || 'Your Therapist'}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {appointment.type || 'Therapy Session'}
              </div>
            </div>
            
            {canJoin && (
              <Button
                size="sm"
                onClick={() => startVideoSession(appointment)}
                className="flex items-center"
              >
                <Video className="h-4 w-4 mr-1" />
                Join
              </Button>
            )}
          </div>
          
          {index < upcomingAppointments.length - 1 && (
            <Separator className="my-4" />
          )}
        </div>
      );
    });
  };

  const renderUpcomingDocuments = () => {
    if (upcomingDocuments.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          No pending documents to complete.
        </div>
      );
    }
    
    return upcomingDocuments.slice(0, 3).map((document, index) => {
      const dueDate = document.due_date ? parseISO(document.due_date) : addDays(new Date(), 7);
      
      return (
        <div key={document.id} className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium">
                {document.documents?.title || 'Document'}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {document.documents?.category || 'Form'}
              </div>
              <div className="flex items-center mt-1">
                <CalendarIcon className="h-3 w-3 text-gray-500 mr-1" />
                <span className="text-xs text-gray-600">
                  Due: {format(dueDate, 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8"
            >
              Complete
            </Button>
          </div>
          
          {index < upcomingDocuments.length - 1 && (
            <Separator className="my-3" />
          )}
        </div>
      );
    });
  };

  const handleCloseVideoDialog = () => {
    setIsVideoDialogOpen(false);
    setCurrentVideoRoomUrl(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {renderUpcomingAppointments()}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" className="w-full">
              View All Appointments
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documents to Complete</CardTitle>
            <CardDescription>Forms that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {renderUpcomingDocuments()}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" className="w-full">
              View All Documents
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {isVideoDialogOpen && currentVideoRoomUrl && (
        <VideoChat
          roomUrl={currentVideoRoomUrl}
          isOpen={isVideoDialogOpen}
          onClose={handleCloseVideoDialog}
        />
      )}
    </div>
  );
};

export default MyPortal;
