
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Add required exported functions
export const getOrCreateVideoRoom = async (appointmentId: string) => {
  try {
    // Implementation would go here in a real application
    return {
      success: true,
      url: `https://video-room-${appointmentId}`
    };
  } catch (error) {
    console.error("Error creating video room:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error creating video room"
    };
  }
};

export const checkPHQ9ForAppointment = async (appointmentId: string) => {
  try {
    // Implementation would go here in a real application
    const { data, error } = await supabase
      .from('phq9_assessments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();
    
    if (error) throw error;
    
    return {
      exists: !!data,
      error: null
    };
  } catch (error) {
    console.error("Error checking PHQ9:", error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error checking PHQ9"
    };
  }
};

// Export all basic methods
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getClientByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
    
  if (error) throw error;
  return data;
};

export const updateClientProfile = async (clientId: string, updates: any) => {
  try {
    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error updating profile"
    };
  }
};
