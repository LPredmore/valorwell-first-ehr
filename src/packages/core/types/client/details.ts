import { z } from 'zod';

export interface ClientDetails {
  id: string;
  client_first_name?: string;
  client_last_name?: string;
  client_preferred_name?: string;
  client_date_of_birth?: string;
  client_diagnosis?: string[];
  client_email?: string;
  client_phone?: string;
  client_gender?: string;
  client_gender_identity?: string;
  client_state?: string;
  client_time_zone?: string;
  client_planlength?: string;
  client_treatmentfrequency?: string;
  client_medications?: string;
  client_personsinattendance?: string;
  client_appearance?: string;
  client_attitude?: string;
  client_behavior?: string;
  client_speech?: string;
  client_affect?: string;
  client_thoughtprocess?: string;
  client_perception?: string;
  client_orientation?: string;
  client_memoryconcentration?: string;
  client_insightjudgement?: string;
  client_mood?: string;
  client_substanceabuserisk?: string;
  client_suicidalideation?: string;
  client_homicidalideation?: string;
  client_primaryobjective?: string;
  client_secondaryobjective?: string;
  client_tertiaryobjective?: string;
  client_intervention1?: string;
  client_intervention2?: string;
  client_intervention3?: string;
  client_intervention4?: string;
  client_intervention5?: string;
  client_intervention6?: string;
  client_functioning?: string;
  client_prognosis?: string;
  client_progress?: string;
  client_problem?: string;
  client_treatmentgoal?: string;
  client_sessionnarrative?: string;
  client_nexttreatmentplanupdate?: string;
  client_privatenote?: string;
  client_assigned_therapist?: string;
}

export const clientSchema = z.object({
  client_first_name: z.string().min(1, "First name is required"),
  client_last_name: z.string().min(1, "Last name is required"),
  client_date_of_birth: z.string().min(1, "Date of birth is required")
});
