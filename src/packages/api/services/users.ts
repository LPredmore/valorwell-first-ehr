
import { supabase } from '../client';
import { handleApiError } from '../utils/error';

// User Profile Management
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Clinician Management
export const getClinicianList = async (searchTerm: string = '', limit: number = 50) => {
  try {
    let query = supabase.from('clinicians').select('*');
    
    if (searchTerm) {
      query = query.or(`clinician_first_name.ilike.%${searchTerm}%,clinician_last_name.ilike.%${searchTerm}%,clinician_email.ilike.%${searchTerm}%`);
    }
    
    const { data, error } = await query.order('clinician_last_name').limit(limit);
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getClinicianById = async (clinicianId: string) => {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .select(`
        *,
        clinician_licenses(*)
      `)
      .eq('id', clinicianId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateClinicianProfile = async (clinicianId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('clinicians')
      .update(updates)
      .eq('id', clinicianId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Clinician License Management
export const getClinicianLicenses = async (clinicianId: string) => {
  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('clinician_id', clinicianId)
      .order('state');
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const addClinicianLicense = async (licenseData: any) => {
  try {
    const { data, error } = await supabase
      .from('licenses')
      .insert(licenseData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateClinicianLicense = async (licenseId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('licenses')
      .update(updates)
      .eq('id', licenseId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteClinicianLicense = async (licenseId: string) => {
  try {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    throw handleApiError(error);
  }
};

// User Preferences
export const getUserPreferences = async (userId: string) => {
  try {
    // This would be implemented based on where user preferences are stored,
    // either in the profiles table or a separate preferences table
    const { data, error } = await supabase
      .from('profiles')
      .select('time_zone, google_calendar_linked')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateUserPreferences = async (userId: string, preferences: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(preferences)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Google Calendar Integration
export const updateGoogleCalendarSettings = async (userId: string, settings: { linked: boolean, lastSync?: string }) => {
  try {
    const updates: any = { 
      google_calendar_linked: settings.linked 
    };
    
    if (settings.lastSync) {
      updates.google_calendar_last_sync = settings.lastSync;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};
