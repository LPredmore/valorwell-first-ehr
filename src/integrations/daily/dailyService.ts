import { supabase } from '@/integrations/supabase/client';

// Function to create or get a Daily.co room for an appointment
export async function getOrCreateAppointmentRoom(appointmentId: string) {
  try {
    // First check if the appointment already has a video_room_url
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, video_room_url')
      .eq('id', appointmentId)
      .single();
      
    if (appointmentError) {
      console.error('Error fetching appointment:', appointmentError);
      throw appointmentError;
    }
    
    // If the appointment already has a room URL, return it
    if (appointment?.video_room_url) {
      return appointment.video_room_url;
    }
    
    // Otherwise, create a new room
    const { data, error } = await supabase.functions.invoke('create-daily-room', {
      body: { appointmentId },
    });
    
    if (error) {
      console.error('Error creating Daily.co room:', error);
      throw error;
    }
    
    if (!data.url) {
      throw new Error('No room URL returned from Daily.co');
    }
    
    // Update the appointment with the room URL
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ video_room_url: data.url })
      .eq('id', appointmentId);
      
    if (updateError) {
      console.error('Error updating appointment with room URL:', updateError);
      // Continue even if update fails, as we still have the room URL
    }
    
    return data.url;
  } catch (error) {
    console.error('Error in getOrCreateAppointmentRoom:', error);
    throw error;
  }
}
