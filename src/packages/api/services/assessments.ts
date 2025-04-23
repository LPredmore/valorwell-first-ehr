
import { supabase } from '../client';
import { handleApiError } from '../utils/error';

export const checkPHQ9ForAppointment = async (appointmentId: string) => {
  try {
    const { data, error } = await supabase
      .from('phq9_assessments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();
      
    if (error) throw error;
    return { exists: !!data, data };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const savePHQ9Assessment = async (assessment: {
  client_id: string;
  appointment_id?: string;
  assessment_date: string;
  total_score: number;
  [key: string]: any;
}) => {
  try {
    const { data, error } = await supabase
      .from('phq9_assessments')
      .insert([assessment])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};
