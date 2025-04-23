
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getOrCreateVideoRoom = async (appointmentId: string) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('video_room_url')
      .eq('id', appointmentId)
      .single();

    if (error) throw error;
    
    if (data?.video_room_url) {
      return { success: true, url: data.video_room_url };
    }

    // If no room exists, create one
    const response = await fetch('/api/create-daily-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create video room');
    }

    return { success: true, url: result.url };
  } catch (error) {
    console.error('Error in getOrCreateVideoRoom:', error);
    return { success: false, error };
  }
};

export const checkPHQ9ForAppointment = async (appointmentId: string) => {
  try {
    const { data, error } = await supabase
      .from('phq9_assessments')
      .select('id')
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (error) throw error;

    return { exists: !!data, error: null };
  } catch (error) {
    console.error('Error checking PHQ9:', error);
    return { exists: false, error };
  }
};
