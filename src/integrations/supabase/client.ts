import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL environment variable is missing. Please make sure it is set in your .env file.');
}

if (!supabaseKey) {
  console.error('VITE_SUPABASE_ANON_KEY environment variable is missing. Please make sure it is set in your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321', 
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

export const parseDateString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: ${dateString}`);
    return null;
  }
  
  return date;
};

export const formatDateForDB = (date: Date | null): string | null => {
  if (!date) return null;
  
  return date.toISOString().split('T')[0];
};

export interface CPTCode {
  code: string;
  name: string;
  fee: number;
  description: string;
  clinical_type: string;
}

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
