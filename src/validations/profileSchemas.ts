
import { z } from 'zod';

// Helper function to transform string dates to Date objects
const stringToDateTransformer = z.preprocess(
  (arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  },
  z.date({
    required_error: "Date is required",
    invalid_type_error: "That's not a date!",
  })
);

export const profileSchemas = {
  step1Schema: z.object({
    client_first_name: z.string().min(1, "First name is required"),
    client_last_name: z.string().min(1, "Last name is required"),
    client_preferred_name: z.string().optional(),
    client_email: z.string().email("Valid email is required"),
    client_phone: z.string().min(10, "Valid phone number is required"),
    client_relationship: z.string().min(1, "Relationship is required"),
  }),

  step2Schema: z.object({
    client_date_of_birth: stringToDateTransformer,
    client_gender: z.string().min(1, "Birth gender is required"),
    client_gender_identity: z.string().min(1, "Gender identity is required"),
    client_state: z.string().min(1, "State is required"),
    client_time_zone: z.string().min(1, "Time zone is required"),
    client_vacoverage: z.string().min(1, "VA coverage information is required"),
  }),

  // Full form type definition for TypeScript
  fullFormSchema: z.object({
    // Step 1 fields
    client_first_name: z.string().min(1, "First name is required"),
    client_preferred_name: z.string().optional(),
    client_last_name: z.string().min(1, "Last name is required"),
    client_email: z.string().email("Valid email is required"),
    client_phone: z.string().min(10, "Valid phone number is required"),
    client_relationship: z.string().min(1, "Relationship is required"),
    
    // Step 2 fields
    client_date_of_birth: stringToDateTransformer.optional(),
    client_gender: z.string().optional(),
    client_gender_identity: z.string().optional(),
    client_state: z.string().optional(),
    client_time_zone: z.string().optional(),
    client_vacoverage: z.string().optional(),
    
    // Step 3 fields - CHAMPVA
    client_champva: z.string().optional(),
    client_other_insurance: z.string().optional(),
    client_champva_agreement: z.boolean().optional(),
    client_mental_health_referral: z.string().optional(),
    
    // Step 3 fields - TRICARE
    client_tricare_beneficiary_category: z.string().optional(),
    client_tricare_sponsor_name: z.string().optional(),
    client_tricare_sponsor_branch: z.string().optional(),
    client_tricare_sponsor_id: z.string().optional(),
    client_tricare_plan: z.string().optional(),
    client_tricare_region: z.string().optional(),
    client_tricare_policy_id: z.string().optional(),
    client_tricare_has_referral: z.string().optional(),
    client_tricare_referral_number: z.string().optional(),
    client_tricare_insurance_agreement: z.boolean().optional(),
    
    // Step 3 fields - Veteran
    client_branchOS: z.string().optional(),
    client_recentdischarge: stringToDateTransformer.optional(),
    client_disabilityrating: z.string().optional(),
    
    // Step 3 fields - Not a Veteran
    client_veteran_relationship: z.string().optional(),
    client_situation_explanation: z.string().optional(),
    
    // Step 4 fields - Primary Insurance
    client_insurance_company_primary: z.string().optional(),
    client_insurance_type_primary: z.string().optional(),
    client_subscriber_name_primary: z.string().optional(),
    client_subscriber_relationship_primary: z.string().optional(),
    client_subscriber_dob_primary: stringToDateTransformer.optional(),
    client_group_number_primary: z.string().optional(),
    client_policy_number_primary: z.string().optional(),
    hasMoreInsurance: z.string().optional(),
    
    // Step 5 fields - Secondary Insurance
    client_insurance_company_secondary: z.string().optional(),
    client_insurance_type_secondary: z.string().optional(),
    client_subscriber_name_secondary: z.string().optional(),
    client_subscriber_relationship_secondary: z.string().optional(),
    client_subscriber_dob_secondary: stringToDateTransformer.optional(),
    client_group_number_secondary: z.string().optional(),
    client_policy_number_secondary: z.string().optional(),
    client_has_even_more_insurance: z.string().optional(),
    
    // Step 6 fields - Final
    client_self_goal: z.string().optional(),
    client_referral_source: z.string().optional(),
    tricareInsuranceAgreement: z.boolean().optional(),
  })
};

// Type for the form values
export type ProfileFormValues = z.infer<typeof profileSchemas.fullFormSchema>;
