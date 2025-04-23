import { supabase } from '../client';
import { handleApiError } from '../utils/error';

export const getOrCreateVideoRoom = async (appointmentId: string) => {
  try {
    console.log('Getting or creating video room for appointment:', appointmentId);
    
    // First check if the appointment already has a video room URL
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('video_room_url')
      .eq('id', appointmentId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // If a video room URL already exists, return it
    if (appointment?.video_room_url) {
      return { url: appointment.video_room_url, success: true };
    }
    
    // Otherwise, create a new room via the Edge Function
    const { data, error } = await supabase.functions.invoke('create-daily-room', {
      body: { appointmentId }
    });
    
    if (error) throw error;
    
    if (!data?.url) {
      throw new Error('Failed to get video room URL');
    }
    
    // Store the room URL in the appointment record
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ video_room_url: data.url })
      .eq('id', appointmentId);
      
    if (updateError) throw updateError;
    
    return { url: data.url, success: true };
  } catch (error) {
    console.error('Error in getOrCreateVideoRoom:', error);
    throw handleApiError(error);
  }
};
