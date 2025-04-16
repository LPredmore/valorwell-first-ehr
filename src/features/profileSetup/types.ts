
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

// Schema definitions
export const profileStep1Schema = z.object({
  client_first_name: z.string().min(1, "First name is required"),
  client_last_name: z.string().min(1, "Last name is required"),
  client_preferred_name: z.string().optional(),
  client_email: z.string().email("Valid email is required"),
  client_phone: z.string().min(10, "Valid phone number is required"),
  client_relationship: z.string().min(1, "Relationship is required"),
});

export const profileStep2Schema = z.object({
  client_date_of_birth: z.date({
    required_error: "Date of birth is required",
  }),
  client_gender: z.string().min(1, "Birth gender is required"),
  client_gender_identity: z.string().min(1, "Gender identity is required"),
  client_state: z.string().min(1, "State is required"),
  client_time_zone: z.string().min(1, "Time zone is required"),
  client_vacoverage: z.string().min(1, "VA coverage information is required"),
});

export type ProfileFormValues = z.infer<typeof profileStep1Schema> & {
  client_date_of_birth: Date | undefined;
  client_gender: string;
  client_gender_identity: string;
  client_state: string;
  client_time_zone: string;
  client_vacoverage: string;
  client_champva: string;
  client_other_insurance: string;
  client_champva_agreement: boolean;
  client_mental_health_referral: string;
  client_branchOS: string;
  client_recentdischarge: Date | undefined;
  client_disabilityrating: string;
  client_tricare_beneficiary_category: string;
  client_tricare_sponsor_name: string;
  client_tricare_sponsor_branch: string;
  client_tricare_sponsor_id: string;
  client_tricare_plan: string;
  client_tricare_region: string;
  client_tricare_policy_id: string;
  client_tricare_has_referral: string;
  client_tricare_referral_number: string;
  client_tricare_insurance_agreement: boolean;
  client_veteran_relationship: string;
  client_situation_explanation: string;
  client_insurance_company_primary: string;
  client_insurance_type_primary: string;
  client_subscriber_name_primary: string;
  client_subscriber_relationship_primary: string;
  client_subscriber_dob_primary: Date | undefined;
  client_group_number_primary: string;
  client_policy_number_primary: string;
  client_insurance_company_secondary: string;
  client_insurance_type_secondary: string;
  client_subscriber_name_secondary: string;
  client_subscriber_relationship_secondary: string;
  client_subscriber_dob_secondary: Date | undefined;
  client_group_number_secondary: string;
  client_policy_number_secondary: string;
  hasMoreInsurance: string;
  client_has_even_more_insurance: string;
  client_self_goal: string;
  client_referral_source: string;
  tricareInsuranceAgreement: boolean;
};

export interface ProfileStepProps {
  form: UseFormReturn<ProfileFormValues>;
  onNext: () => void;
  onBack?: () => void;
}

export interface ProfileFormState {
  currentStep: number;
  navigationHistory: number[];
  otherInsurance: string;
  isSubmitting: boolean;
  isProfileCompleted: boolean;
}

export interface FormStorageData {
  formValues: ProfileFormValues | null;
  step: number;
}
