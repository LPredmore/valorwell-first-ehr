
import { createClient } from '@supabase/supabase-js';
import { format, parse } from 'date-fns';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parses a date string from the database into a Date object
 * @param dateString The date string from the database
 * @returns A Date object or null if the date string is invalid
 */
export function parseDateString(dateString: string | null): Date | null {
  if (!dateString) return null;
  
  try {
    // Try ISO format first (YYYY-MM-DD)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateString);
    }
    
    // Try other common formats
    const formats = [
      'yyyy-MM-dd',
      'MM/dd/yyyy',
      'dd/MM/yyyy',
      'yyyy/MM/dd',
      'MMM d, yyyy',
      'MMMM d, yyyy'
    ];
    
    for (const formatString of formats) {
      try {
        return parse(dateString, formatString, new Date());
      } catch (e) {
        // Continue to next format if parsing fails
      }
    }
    
    // If all else fails, try creating a date directly
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Formats a Date object for storage in the database
 * @param date The Date object to format
 * @returns A string in YYYY-MM-DD format
 */
export function formatDateForDB(date: Date | null): string | null {
  if (!date) return null;
  
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
}

/**
 * Formats a date string for display
 * @param dateString The date string from the database
 * @returns A formatted date string for display
 */
export function formatDateForDisplay(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = parseDateString(dateString);
  if (!date) return '';
  
  try {
    return format(date, 'MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
}

// Helper function to convert array of strings to proper format for Supabase
export function formatArrayForDB(array: string[]): string[] {
  return array.filter(item => item.trim() !== '');
}

// Define interface for CPTCode
export interface CPTCode {
  code: string;
  name: string;
  fee: number;
  description?: string;
  clinical_type?: string;
}

// Define interface for PracticeInfo
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

// User Management Functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

export const createUser = async (email: string, userData: any) => {
  try {
    // Generate a random password (this would need to be reset by the user)
    const defaultPassword = 'temppass1234';
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: userData
    });
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
};

// Client Management Functions
export const getClientByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error getting client by user ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getClientByUserId:', error);
    return null;
  }
};

export const updateClientProfile = async (clientId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating client profile:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    return { success: false, error };
  }
};

// Clinician Management Functions
export const getClinicianNameById = async (clinicianId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select('clinician_professional_name')
      .eq('id', clinicianId)
      .single();
      
    if (error) {
      console.error('Error getting clinician name:', error);
      return null;
    }
    
    return data?.clinician_professional_name || null;
  } catch (error) {
    console.error('Error in getClinicianNameById:', error);
    return null;
  }
};

export const getClinicianIdByName = async (name: string) => {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select('id')
      .eq('clinician_professional_name', name)
      .single();
      
    if (error) {
      console.error('Error getting clinician ID by name:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getClinicianIdByName:', error);
    return null;
  }
};

// CPT Code Functions
export const fetchCPTCodes = async (): Promise<CPTCode[]> => {
  try {
    const { data, error } = await supabase
      .from('cpt_codes')
      .select('*')
      .order('code');
      
    if (error) {
      console.error('Error fetching CPT codes:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchCPTCodes:', error);
    return [];
  }
};

export const addCPTCode = async (cptCode: CPTCode) => {
  try {
    const { data, error } = await supabase
      .from('cpt_codes')
      .insert([cptCode])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding CPT code:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in addCPTCode:', error);
    return { success: false, error };
  }
};

export const updateCPTCode = async (code: string, updates: CPTCode) => {
  try {
    const { data, error } = await supabase
      .from('cpt_codes')
      .update(updates)
      .eq('code', code)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating CPT code:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateCPTCode:', error);
    return { success: false, error };
  }
};

export const deleteCPTCode = async (code: string) => {
  try {
    const { error } = await supabase
      .from('cpt_codes')
      .delete()
      .eq('code', code);
      
    if (error) {
      console.error('Error deleting CPT code:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteCPTCode:', error);
    return { success: false, error };
  }
};

// Practice Info Functions
export const fetchPracticeInfo = async (): Promise<PracticeInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('practiceinfo')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error('Error fetching practice info:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchPracticeInfo:', error);
    return null;
  }
};

export const updatePracticeInfo = async (updates: PracticeInfo) => {
  try {
    let result;
    
    if (updates.id) {
      // Update existing practice info
      const { data, error } = await supabase
        .from('practiceinfo')
        .update(updates)
        .eq('id', updates.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // Insert new practice info if no ID is provided
      const { data, error } = await supabase
        .from('practiceinfo')
        .insert([{
          practice_name: updates.practice_name,
          practice_npi: updates.practice_npi,
          practice_taxid: updates.practice_taxid,
          practice_taxonomy: updates.practice_taxonomy,
          practice_address1: updates.practice_address1,
          practice_address2: updates.practice_address2,
          practice_city: updates.practice_city,
          practice_state: updates.practice_state,
          practice_zip: updates.practice_zip
        }])
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating practice info:', error);
    return { success: false, error };
  }
};
