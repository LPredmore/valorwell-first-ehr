import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL environment variable is missing. Please make sure it is set in your .env file.');
}

if (!supabaseKey) {
  console.error('VITE_SUPABASE_ANON_KEY environment variable is missing. Please make sure it is set in your .env file.');
}

// Create a Supabase client with fallback defaults (for development only)
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321', 
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

// Helper function to parse date strings from the database
export const parseDateString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  // Try to parse the date string
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: ${dateString}`);
    return null;
  }
  
  return date;
};

// Helper function to format dates for database storage
export const formatDateForDB = (date: Date | null): string | null => {
  if (!date) return null;
  
  // Format as ISO string and take just the date part (YYYY-MM-DD)
  return date.toISOString().split('T')[0];
};

// New function to get or create a video room for an appointment
export const getOrCreateVideoRoom = async (appointmentId: string) => {
  try {
    console.log('Getting or creating video room for appointment:', appointmentId);
    
    // First check if the appointment already has a video room URL
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('video_room_url')
      .eq('id', appointmentId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching appointment:', fetchError);
      throw fetchError;
    }
    
    // If a video room URL already exists, return it
    if (appointment && appointment.video_room_url) {
      console.log('Appointment already has video room URL:', appointment.video_room_url);
      return { url: appointment.video_room_url, success: true };
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

// New function to fetch clinical documents for a client
export const fetchClinicalDocuments = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('document_date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clinical documents:', error);
    return [];
  }
};

// New function to get document download URL
export const getDocumentDownloadURL = async (filePath: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('clinical_documents')
      .createSignedUrl(filePath, 60); // 60 seconds expiration
      
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting document download URL:', error);
    return null;
  }
};

// New interface for PHQ9 assessment data
export interface PHQ9Assessment {
  client_id: string;
  assessment_date: string;
  question_1: number;
  question_2: number;
  question_3: number;
  question_4: number;
  question_5: number;
  question_6: number;
  question_7: number;
  question_8: number;
  question_9: number;
  total_score: number;
  additional_notes?: string;
}

// New function to save PHQ-9 assessment
export const savePHQ9Assessment = async (assessment: PHQ9Assessment) => {
  try {
    const { data, error } = await supabase
      .from('phq9_assessments')
      .insert([assessment])
      .select();
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving PHQ9 assessment:', error);
    return { success: false, error };
  }
};

// Function to fetch PHQ-9 assessments for a client
export const fetchPHQ9Assessments = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('phq9_assessments')
      .select('*')
      .eq('client_id', clientId)
      .order('assessment_date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching PHQ9 assessments:', error);
    return [];
  }
};

// Interface for CPT Code
export interface CPTCode {
  code: string;
  name: string;
  fee: number;
  description: string;
  clinical_type: string;
}

// Interface for Practice Info
export interface PracticeInfo {
  id: string;
  practice_name: string;
  practice_npi: string;
  practice_taxid: string;
  practice_taxonomy: string;
  practice_address1: string;
  practice_address2: string;
  practice_city: string;
  practice_state: string;
  practice_zip: string;
}

// User management functions
export const createUser = async (email: string, userData: any) => {
  try {
    // Ensure userData contains temp_password
    if (!userData.temp_password) {
      // Generate a random temporary password if not provided
      userData.temp_password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      console.log(`Generated temporary password for ${email}: ${userData.temp_password}`);
    }
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: userData.temp_password, // Use the same password for auth and metadata
      email_confirm: true,
      user_metadata: userData
    });
    
    return { data, error };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
};

// User data functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Client data functions
export const getClientByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting client by user ID:', error);
    return null;
  }
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
    console.error('Error updating client profile:', error);
    return { success: false, error };
  }
};

// Clinician data functions
export const getClinicianNameById = async (clinicianId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select('clinician_professional_name')
      .eq('id', clinicianId)
      .single();
      
    if (error) throw error;
    return data?.clinician_professional_name || null;
  } catch (error) {
    console.error('Error getting clinician name by ID:', error);
    return null;
  }
};

export const getClinicianIdByName = async (clinicianName: string) => {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select('id')
      .eq('clinician_professional_name', clinicianName)
      .single();
      
    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error getting clinician ID by name:', error);
    return null;
  }
};

// CPT code functions
export const fetchCPTCodes = async (): Promise<CPTCode[]> => {
  try {
    const { data, error } = await supabase
      .from('cpt_codes')
      .select('*')
      .order('code');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching CPT codes:', error);
    return [];
  }
};

export const addCPTCode = async (cptCode: CPTCode) => {
  try {
    const { error } = await supabase
      .from('cpt_codes')
      .insert([cptCode]);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error adding CPT code:', error);
    return { success: false, error };
  }
};

export const updateCPTCode = async (codeId: string, updates: Partial<CPTCode>) => {
  try {
    const { error } = await supabase
      .from('cpt_codes')
      .update(updates)
      .eq('code', codeId);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating CPT code:', error);
    return { success: false, error };
  }
};

export const deleteCPTCode = async (codeId: string) => {
  try {
    const { error } = await supabase
      .from('cpt_codes')
      .delete()
      .eq('code', codeId);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting CPT code:', error);
    return { success: false, error };
  }
};

// Practice info functions
export const fetchPracticeInfo = async (): Promise<PracticeInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('practiceinfo')
      .select('*')
      .limit(1)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching practice info:', error);
    return null;
  }
};

export const updatePracticeInfo = async (updates: Partial<PracticeInfo>) => {
  try {
    const { error } = await supabase
      .from('practiceinfo')
      .update(updates)
      .eq('id', updates.id);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating practice info:', error);
    return { success: false, error };
  }
};
