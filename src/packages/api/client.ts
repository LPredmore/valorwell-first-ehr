import { supabase } from './supabaseClient';

/**
 * Updates a client's profile information
 */
export const updateClientProfile = async (clientId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId);

    if (error) {
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating client profile:', error);
    return { success: false, error };
  }
};

/**
 * Gets or creates a video room for an appointment
 */
export const getOrCreateVideoRoom = async (appointmentId: string) => {
  try {
    // Check if appointment already has a room URL
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .select('video_room_url')
      .eq('id', appointmentId)
      .single();

    if (appointmentError) {
      console.error('Error fetching appointment:', appointmentError);
      return { success: false, error: appointmentError };
    }

    // If appointment already has a room URL, return it
    if (appointmentData?.video_room_url) {
      return { success: true, url: appointmentData.video_room_url };
    }

    // Otherwise generate a room URL (in a real implementation, this would involve creating a room in a video service)
    const roomUrl = `https://video-room-${appointmentId}`;

    // Update the appointment with the generated URL
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ video_room_url: roomUrl })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment with video room URL:', updateError);
      return { success: false, error: updateError };
    }

    return { success: true, url: roomUrl };
  } catch (error) {
    console.error('Error in getOrCreateVideoRoom:', error);
    return { success: false, error };
  }
};

/**
 * Checks if a PHQ9 assessment exists for an appointment
 */
export const checkPHQ9ForAppointment = async (appointmentId: string) => {
  try {
    const { data, error } = await supabase
      .from('phq9_assessments')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking PHQ9 assessment:', error);
      return { exists: false, error };
    }

    return { exists: !!data, error: null };
  } catch (error) {
    console.error('Error in checkPHQ9ForAppointment:', error);
    return { exists: false, error };
  }
};

/**
 * Gets a client by user ID
 */
export const getClientByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching client data by user ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getClientByUserId:', error);
    return null;
  }
};

/**
 * Gets the current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return data?.user || null;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};
