import { supabase } from "@/integrations/supabase/client";

// Constants
const DAILY_API_KEY = process.env.VITE_DAILY_API_KEY || '';
const DAILY_API_URL = 'https://api.daily.co/v1';

// Types
export interface DailyRoomConfig {
  name?: string;
  properties?: {
    exp?: number;
    enable_screenshare?: boolean;
    start_audio_off?: boolean;
    start_video_off?: boolean;
    enable_chat?: boolean;
  };
}

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: any;
}

/**
 * Create a new Daily.co room
 */
export const createDailyRoom = async (config: DailyRoomConfig = {}): Promise<DailyRoom | null> => {
  try {
    // Use the Edge Function to create a room - this keeps our API key secure
    const { data, error } = await supabase.functions.invoke('create-daily-room', {
      body: { config }
    });

    if (error) {
      console.error('Error creating Daily room:', error);
      return null;
    }

    return data as DailyRoom;
  } catch (error) {
    console.error('Exception creating Daily room:', error);
    return null;
  }
};

/**
 * Get or create a Daily.co room for an appointment
 */
export const getOrCreateAppointmentRoom = async (appointmentId: string): Promise<string | null> => {
  try {
    // Check if the appointment already has a meeting URL
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('meeting_url')
      .eq('id', appointmentId)
      .single();

    if (fetchError) {
      console.error('Error fetching appointment:', fetchError);
      return null;
    }

    // If there's already a meeting URL, return it
    if (appointment?.meeting_url) {
      return appointment.meeting_url;
    }

    // Create a new room
    const roomConfig: DailyRoomConfig = {
      name: `appointment-${appointmentId}`,
      properties: {
        enable_screenshare: true,
        start_audio_off: false,
        start_video_off: false,
        enable_chat: true,
      }
    };

    const room = await createDailyRoom(roomConfig);

    if (!room) {
      console.error('Failed to create Daily room');
      return null;
    }

    // Update the appointment with the meeting URL
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ meeting_url: room.url })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment with meeting URL:', updateError);
      return null;
    }

    return room.url;
  } catch (error) {
    console.error('Exception in getOrCreateAppointmentRoom:', error);
    return null;
  }
};
