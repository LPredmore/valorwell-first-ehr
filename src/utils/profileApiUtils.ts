
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ProfileFormValues } from '@/validations/profileSchemas';

/**
 * Fetches the user profile data from Supabase
 * @returns The client data object or null if not found
 */
export const fetchUserProfile = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Authentication error: ' + (authError?.message || 'No user found'));
  }
  
  let { data: clientData, error: clientIdError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', user.id);
    
  if ((!clientData || clientData.length === 0) && user.email) {
    const { data: emailData, error: emailError } = await supabase
      .from('clients')
      .select('*')
      .eq('client_email', user.email);
      
    if (!emailError && emailData && emailData.length > 0) {
      clientData = emailData;
      
      const { error: updateError } = await supabase
        .from('clients')
        .update({ id: user.id })
        .eq('id', clientData[0].id);
        
      if (!updateError) {
        const { data: updatedData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id);
          
        if (updatedData && updatedData.length > 0) {
          clientData = updatedData;
        }
      }
    }
  }
  
  if (!clientData || clientData.length === 0) {
    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert([
        { 
          id: user.id,
          client_email: user.email,
        }
      ])
      .select();
      
    if (insertError) {
      throw new Error('Error creating client record: ' + insertError.message);
    }
    
    clientData = newClient;
  }
  
  return clientData?.[0] || null;
};

/**
 * Updates the client's identity information
 * @param clientId The client ID
 * @param data The form data containing identity information
 * @returns True if successful
 */
export const updateClientIdentity = async (clientId: string, data: Partial<ProfileFormValues>) => {
  const { error } = await supabase
    .from('clients')
    .update({
      client_first_name: data.client_first_name,
      client_last_name: data.client_last_name,
      client_preferred_name: data.client_preferred_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      client_relationship: data.client_relationship
    })
    .eq('id', clientId);
    
  if (error) {
    throw new Error('Error saving identity data: ' + error.message);
  }
  
  return true;
};

/**
 * Updates the client's demographic information
 * @param clientId The client ID
 * @param data The form data containing demographic information
 * @returns True if successful
 */
export const updateClientDemographics = async (clientId: string, data: Partial<ProfileFormValues>) => {
  const formattedDateOfBirth = data.client_date_of_birth 
    ? format(data.client_date_of_birth, 'yyyy-MM-dd') 
    : null;
    
  const { error } = await supabase
    .from('clients')
    .update({
      client_date_of_birth: formattedDateOfBirth,
      client_gender: data.client_gender,
      client_gender_identity: data.client_gender_identity,
      client_state: data.client_state,
      client_time_zone: data.client_time_zone,
      client_vacoverage: data.client_vacoverage
    })
    .eq('id', clientId);
    
  if (error) {
    throw new Error('Error saving demographic data: ' + error.message);
  }
  
  return true;
};

/**
 * Updates the client's CHAMPVA information
 * @param clientId The client ID
 * @param data The form data containing CHAMPVA information
 * @returns True if successful
 */
export const updateClientChampva = async (clientId: string, data: Partial<ProfileFormValues>) => {
  const { error } = await supabase
    .from('clients')
    .update({
      client_champva: data.client_champva,
      client_other_insurance: data.client_other_insurance,
      client_champva_agreement: data.client_champva_agreement,
      client_mental_health_referral: data.client_mental_health_referral
    })
    .eq('id', clientId);
    
  if (error) {
    throw new Error('Error saving CHAMPVA data: ' + error.message);
  }
  
  return true;
};

/**
 * Updates the client's TRICARE information
 * @param clientId The client ID
 * @param data The form data containing TRICARE information
 * @returns True if successful
 */
export const updateClientTricare = async (clientId: string, data: Partial<ProfileFormValues>) => {
  const { error } = await supabase
    .from('clients')
    .update({
      client_tricare_beneficiary_category: data.client_tricare_beneficiary_category,
      client_tricare_sponsor_name: data.client_tricare_sponsor_name,
      client_tricare_sponsor_branch: data.client_tricare_sponsor_branch,
      client_tricare_sponsor_id: data.client_tricare_sponsor_id,
      client_tricare_plan: data.client_tricare_plan,
      client_tricare_region: data.client_tricare_region,
      client_tricare_policy_id: data.client_tricare_policy_id,
      client_tricare_has_referral: data.client_tricare_has_referral,
      client_tricare_referral_number: data.client_tricare_referral_number
    })
    .eq('id', clientId);
    
  if (error) {
    throw new Error('Error saving TRICARE data: ' + error.message);
  }
  
  return true;
};

/**
 * Updates the client's veteran information
 * @param clientId The client ID
 * @param data The form data containing veteran information
 * @returns True if successful
 */
export const updateClientVeteran = async (clientId: string, data: Partial<ProfileFormValues>) => {
  const formattedDischargeDate = data.client_recentdischarge 
    ? format(data.client_recentdischarge, 'yyyy-MM-dd') 
    : null;
  
  const { error } = await supabase
    .from('clients')
    .update({
      client_branchOS: data.client_branchOS,
      client_recentdischarge: formattedDischargeDate,
      client_disabilityrating: data.client_disabilityrating
    })
    .eq('id', clientId);
    
  if (error) {
    throw new Error('Error saving veteran data: ' + error.message);
  }
  
  return true;
};

/**
 * Updates the client's primary insurance information
 * @param clientId The client ID
 * @param data The form data containing primary insurance information
 * @returns True if successful
 */
export const updateClientPrimaryInsurance = async (clientId: string, data: Partial<ProfileFormValues>) => {
  const formattedSubscriberDob = data.client_subscriber_dob_primary 
    ? format(data.client_subscriber_dob_primary, 'yyyy-MM-dd') 
    : null;
    
  const { error } = await supabase
    .from('clients')
    .update({
      client_insurance_company_primary: data.client_insurance_company_primary,
      client_insurance_type_primary: data.client_insurance_type_primary,
      client_subscriber_name_primary: data.client_subscriber_name_primary,
      client_subscriber_relationship_primary: data.client_subscriber_relationship_primary,
      client_subscriber_dob_primary: formattedSubscriberDob,
      client_group_number_primary: data.client_group_number_primary,
      client_policy_number_primary: data.client_policy_number_primary,
      hasMoreInsurance: data.hasMoreInsurance
    })
    .eq('id', clientId);
    
  if (error) {
    throw new Error('Error saving primary insurance data: ' + error.message);
  }
  
  return true;
};

/**
 * Updates the client's secondary insurance information
 * @param clientId The client ID
 * @param data The form data containing secondary insurance information
 * @returns True if successful
 */
export const updateClientSecondaryInsurance = async (clientId: string, data: Partial<ProfileFormValues>) => {
  const formattedSubscriberDobSecondary = data.client_subscriber_dob_secondary 
    ? format(data.client_subscriber_dob_secondary, 'yyyy-MM-dd') 
    : null;
    
  const { error } = await supabase
    .from('clients')
    .update({
      client_insurance_company_secondary: data.client_insurance_company_secondary,
      client_insurance_type_secondary: data.client_insurance_type_secondary,
      client_subscriber_name_secondary: data.client_subscriber_name_secondary,
      client_subscriber_relationship_secondary: data.client_subscriber_relationship_secondary,
      client_subscriber_dob_secondary: formattedSubscriberDobSecondary,
      client_group_number_secondary: data.client_group_number_secondary,
      client_policy_number_secondary: data.client_policy_number_secondary,
      client_has_even_more_insurance: data.client_has_even_more_insurance
    })
    .eq('id', clientId);
    
  if (error) {
    throw new Error('Error saving secondary insurance data: ' + error.message);
  }
  
  return true;
};

/**
 * Completes the client's profile
 * @param clientId The client ID
 * @param data The form data containing final information
 * @returns True if successful
 */
export const completeClientProfile = async (clientId: string, data: Partial<ProfileFormValues>) => {
  // Update client table with time zone and complete status
  const { error } = await supabase
    .from('clients')
    .update({
      client_time_zone: data.client_time_zone,
      client_self_goal: data.client_self_goal || null,
      client_referral_source: data.client_referral_source || null,
      client_status: 'Profile Complete',
      client_is_profile_complete: 'true'
    })
    .eq('id', clientId);

  if (error) {
    throw new Error('Error updating client status: ' + error.message);
  }
  
  return true;
};
