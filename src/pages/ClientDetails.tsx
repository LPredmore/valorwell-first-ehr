
interface ClientDetails {
  id: string;
  client_first_name: string | null;
  client_last_name: string | null;
  client_preferred_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_date_of_birth: string | null;
  client_age: number | null;  // This can be a number in the state
  client_gender: string | null;
  client_gender_identity: string | null;
  client_state: string | null;
  client_time_zone: string | null;
  client_minor: string | null;
  client_status: string | null;
  client_assigned_therapist: string | null;
  client_referral_source: string | null;
  client_treatment_goal: string | null;
  // Insurance fields
  client_insurance_company_primary: string | null;
  client_policy_number_primary: string | null;
  client_group_number_primary: string | null;
  client_subscriber_name_primary: string | null;
  client_insurance_type_primary: string | null;
  client_insurance_company_secondary: string | null;
  client_policy_number_secondary: string | null;
  client_group_number_secondary: string | null;
  client_subscriber_name_secondary: string | null;
  client_insurance_type_secondary: string | null;
  client_insurance_company_tertiary: string | null;
  client_policy_number_tertiary: string | null;
  client_group_number_tertiary: string | null;
  client_subscriber_name_tertiary: string | null;
  client_insurance_type_tertiary: string | null;
}

interface Clinician {
  id: string;
  clinician_professional_name: string | null;
  clinician_first_name: string | null;
  clinician_last_name: string | null;
}
