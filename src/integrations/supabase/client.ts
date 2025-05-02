
import { createClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Utility functions for date handling
export const parseDateString = (dateString: string): Date | null => {
  if (!dateString) return null;
  return new Date(dateString);
};

export const formatDateForDB = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
};

// User management functions
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

export const createUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Client/clinician helper functions
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
    console.error('Error fetching client:', error);
    return null;
  }
};

export const updateClientProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', userId);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client profile:', error);
    throw error;
  }
};

export const getClinicianNameById = async (clinicianId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select('clinician_first_name, clinician_last_name')
      .eq('id', clinicianId)
      .single();
      
    if (error) throw error;
    return data ? `${data.clinician_first_name} ${data.clinician_last_name}` : 'Unknown Clinician';
  } catch (error) {
    console.error('Error fetching clinician name:', error);
    return 'Unknown Clinician';
  }
};

// Documents functions
export const fetchClinicalDocuments = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinical_documents')
      .select('*')
      .eq('client_id', clientId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clinical documents:', error);
    return [];
  }
};

export const getDocumentDownloadURL = async (filePath: string) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(filePath, 60); // 60 seconds expiry
      
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting document URL:', error);
    return null;
  }
};

// Video room functions
export const getOrCreateVideoRoom = async (appointmentId: string) => {
  // Since we removed the appointments table, we'll return a mock URL
  return {
    url: `https://mock-video-room.example.com/${appointmentId}`,
    token: 'mock-token'
  };
};

// Assessment functions
export const savePHQ9Assessment = async (assessment: any) => {
  try {
    const { data, error } = await supabase
      .from('phq9_assessments')
      .insert([assessment]);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving PHQ9 assessment:', error);
    throw error;
  }
};

export const checkPHQ9ForAppointment = async (appointmentId: string) => {
  // Since we removed the appointments table, we'll return a mock value
  return false;
};

// Practice management functions
export interface PracticeInfo {
  id?: string;
  practice_name?: string;
  practice_address1?: string;
  practice_address2?: string;
  practice_city?: string;
  practice_state?: string;
  practice_zip?: string;
  practice_npi?: string;
  practice_taxid?: string;
  practice_taxonomy?: string;
}

export const fetchPracticeInfo = async (): Promise<PracticeInfo> => {
  try {
    const { data, error } = await supabase
      .from('practiceinfo')
      .select('*')
      .single();
      
    if (error) throw error;
    return data || {};
  } catch (error) {
    console.error('Error fetching practice info:', error);
    return {};
  }
};

export const updatePracticeInfo = async (info: PracticeInfo) => {
  try {
    const { data, error } = await supabase
      .from('practiceinfo')
      .upsert([info]);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating practice info:', error);
    throw error;
  }
};

// Billing functions
export interface CPTCode {
  id?: string;
  code: string;
  name: string;
  description?: string;
  fee: number;
  status?: string;
  clinical_type?: string;
}

export const fetchCPTCodes = async () => {
  try {
    const { data, error } = await supabase
      .from('cpt_codes')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching CPT codes:', error);
    return [];
  }
};

export const addCPTCode = async (code: CPTCode) => {
  try {
    const { data, error } = await supabase
      .from('cpt_codes')
      .insert([code]);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding CPT code:', error);
    throw error;
  }
};

export const updateCPTCode = async (id: string, code: CPTCode) => {
  try {
    const { data, error } = await supabase
      .from('cpt_codes')
      .update(code)
      .eq('id', id);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating CPT code:', error);
    throw error;
  }
};

export const deleteCPTCode = async (id: string) => {
  try {
    const { error } = await supabase
      .from('cpt_codes')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting CPT code:', error);
    throw error;
  }
};

// Import our mock client to enable interception
import './mockClient';
