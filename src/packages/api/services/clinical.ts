
import { supabase } from '../client';
import { handleApiError } from '../utils/error';

// Session Notes Management
export const getSessionNotes = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('session_date', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getSessionNoteById = async (noteId: string) => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('id', noteId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createSessionNote = async (sessionNote: any) => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .insert(sessionNote)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateSessionNote = async (noteId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Treatment Plans Management
export const getTreatmentPlans = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getTreatmentPlanById = async (planId: string) => {
  try {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createTreatmentPlan = async (treatmentPlan: any) => {
  try {
    const { data, error } = await supabase
      .from('treatment_plans')
      .insert(treatmentPlan)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateTreatmentPlan = async (planId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('treatment_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Client History Management
export const getClientHistory = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('client_history')
      .select(`
        *,
        client_history_medications(*),
        client_history_treatments(*),
        client_history_family(*),
        client_history_household(*),
        client_history_current_spouse(*),
        client_history_spouses(*)
      `)
      .eq('client_id', clientId)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const saveClientHistory = async (historyData: any) => {
  try {
    const { clientId, mainFormData, medications, treatments, family, household, currentSpouse, pastSpouses } = historyData;
    
    // First save the main history record
    const { data: historyRecord, error: historyError } = await supabase
      .from('client_history')
      .upsert({
        client_id: clientId,
        ...mainFormData
      })
      .select()
      .single();
      
    if (historyError) throw historyError;
    
    const historyId = historyRecord.id;
    
    // Then save related records using the history ID
    // Implementation for saving medications, treatments, etc. would go here
    
    return historyRecord;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Assessment Management
export const getAssessments = async (clientId: string, assessmentType: string) => {
  try {
    let query = supabase.from(`${assessmentType}_assessments`).select('*');
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data, error } = await query.order('assessment_date', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const saveAssessment = async (assessmentType: string, assessmentData: any) => {
  try {
    const { data, error } = await supabase
      .from(`${assessmentType}_assessments`)
      .insert(assessmentData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Diagnosis Management
export const getIcd10Codes = async (searchTerm: string = '') => {
  try {
    let query = supabase.from('icd10').select('*');
    
    if (searchTerm) {
      query = query.or(`icd10.ilike.%${searchTerm}%,diagnosis_name.ilike.%${searchTerm}%`);
    }
    
    const { data, error } = await query.order('diagnosis_name').limit(50);
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};
