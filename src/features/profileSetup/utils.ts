
import { format } from 'date-fns';
import { ProfileFormValues, FormStorageData } from './types';

// Helper function to save form state to localStorage
export const saveFormState = (formValues: ProfileFormValues, step: number) => {
  localStorage.setItem('profileFormValues', JSON.stringify(formValues));
  localStorage.setItem('profileStep', String(step));
};

// Helper function to load form state from localStorage
export const loadFormState = (): FormStorageData => {
  const formValuesStr = localStorage.getItem('profileFormValues');
  const stepStr = localStorage.getItem('profileStep');
  
  const step = stepStr ? parseInt(stepStr, 10) : 1;
  const formValues = formValuesStr ? JSON.parse(formValuesStr) : null;
  
  // Convert date strings back to Date objects
  if (formValues) {
    if (formValues.client_date_of_birth) {
      formValues.client_date_of_birth = new Date(formValues.client_date_of_birth);
    }
    if (formValues.client_recentdischarge) {
      formValues.client_recentdischarge = new Date(formValues.client_recentdischarge);
    }
    if (formValues.client_subscriber_dob_primary) {
      formValues.client_subscriber_dob_primary = new Date(formValues.client_subscriber_dob_primary);
    }
    if (formValues.client_subscriber_dob_secondary) {
      formValues.client_subscriber_dob_secondary = new Date(formValues.client_subscriber_dob_secondary);
    }
  }
  
  return { formValues, step };
};

// Format dates for Supabase
export const formatDateForSupabase = (date: Date | undefined): string | null => {
  return date ? format(date, 'yyyy-MM-dd') : null;
};
