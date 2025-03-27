
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'temppass1234',
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
