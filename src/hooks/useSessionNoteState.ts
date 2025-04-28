import { useFormState } from './useFormState';
import { useEffect, useMemo } from 'react';
import { ClientDetails } from '@/types/client';
import { SessionNoteFormData } from '@/validations/sessionNoteSchemas';

interface UseSessionNoteStateProps {
  clientData: ClientDetails | null;
  clinicianName: string;
  appointment?: any;
  validationSchema?: any;
  onSubmit?: (values: SessionNoteFormData) => Promise<void>;
}

/**
 * Hook for managing session note state with validation
 * 
 * @example
 * ```tsx
 * const {
 *   formState,
 *   handleChange,
 *   handleBlur,
 *   handleSubmit,
 *   errors,
 *   touched,
 *   isSubmitting,
 *   isValid
 * } = useSessionNoteState({
 *   clientData,
 *   clinicianName,
 *   appointment,
 *   validationSchema,
 *   onSubmit: async (values) => {
 *     await saveSessionNote(values);
 *   }
 * });
 * ```
 */
export const useSessionNoteState = ({
  clientData,
  clinicianName,
  appointment,
  validationSchema,
  onSubmit
}: UseSessionNoteStateProps) => {
  // Initial values for the form
  const initialValues = useMemo<SessionNoteFormData>(() => ({
    sessionDate: '',
    patientName: '',
    patientDOB: '',
    clinicianName: '',
    diagnosis: [] as string[],
    planType: '',
    treatmentFrequency: '',
    medications: '',
    sessionType: '',
    personsInAttendance: '',
    appearance: '',
    attitude: '',
    behavior: '',
    speech: '',
    affect: '',
    thoughtProcess: '',
    perception: '',
    orientation: '',
    memoryConcentration: '',
    insightJudgement: '',
    mood: '',
    substanceAbuseRisk: '',
    suicidalIdeation: '',
    homicidalIdeation: '',
    primaryObjective: '',
    intervention1: '',
    intervention2: '',
    secondaryObjective: '',
    intervention3: '',
    intervention4: '',
    tertiaryObjective: '',
    intervention5: '',
    intervention6: '',
    currentSymptoms: '',
    functioning: '',
    prognosis: '',
    progress: '',
    problemNarrative: '',
    treatmentGoalNarrative: '',
    sessionNarrative: '',
    nextTreatmentPlanUpdate: '',
    signature: '',
    privateNote: ''
  }), []);
  
  // Use the standardized form state hook
  const formState = useFormState({
    initialValues,
    validationSchema,
    onSubmit,
    validateOnChange: false,
    validateOnBlur: true
  });
  
  // Update form with client data
  useEffect(() => {
    if (clientData) {
      formState.setValues({
        patientName: clientData.client_first_name && clientData.client_last_name 
          ? `${clientData.client_first_name} ${clientData.client_last_name}`.trim()
          : '',
        patientDOB: clientData.client_date_of_birth || '',
        diagnosis: Array.isArray(clientData.client_diagnosis) ? clientData.client_diagnosis : [],
        planType: clientData.client_planlength || '',
        treatmentFrequency: clientData.client_treatmentfrequency || '',
        medications: clientData.client_medications || '',
        personsInAttendance: clientData.client_personsinattendance || '',
        appearance: clientData.client_appearance || '',
        attitude: clientData.client_attitude || '',
        behavior: clientData.client_behavior || '',
        speech: clientData.client_speech || '',
        affect: clientData.client_affect || '',
        thoughtProcess: clientData.client_thoughtprocess || '',
        perception: clientData.client_perception || '',
        orientation: clientData.client_orientation || '',
        memoryConcentration: clientData.client_memoryconcentration || '',
        insightJudgement: clientData.client_insightjudgement || '',
        mood: clientData.client_mood || '',
        substanceAbuseRisk: clientData.client_substanceabuserisk || '',
        suicidalIdeation: clientData.client_suicidalideation || '',
        homicidalIdeation: clientData.client_homicidalideation || '',
        primaryObjective: clientData.client_primaryobjective || '',
        secondaryObjective: clientData.client_secondaryobjective || '',
        tertiaryObjective: clientData.client_tertiaryobjective || '',
        intervention1: clientData.client_intervention1 || '',
        intervention2: clientData.client_intervention2 || '',
        intervention3: clientData.client_intervention3 || '',
        intervention4: clientData.client_intervention4 || '',
        intervention5: clientData.client_intervention5 || '',
        intervention6: clientData.client_intervention6 || '',
        functioning: clientData.client_functioning || '',
        prognosis: clientData.client_prognosis || '',
        progress: clientData.client_progress || '',
        problemNarrative: clientData.client_problem || '',
        treatmentGoalNarrative: clientData.client_treatmentgoal || '',
        sessionNarrative: clientData.client_sessionnarrative || '',
        nextTreatmentPlanUpdate: clientData.client_nexttreatmentplanupdate || '',
        privateNote: clientData.client_privatenote || ''
      });
    }
  }, [clientData, formState.setValues]);
  
  // Update clinician name
  useEffect(() => {
    formState.setFieldValue('clinicianName', clinicianName);
  }, [clinicianName, formState.setFieldValue]);
  
  // Update appointment related fields
  useEffect(() => {
    if (appointment?.client) {
      const appointmentDate = appointment.date 
        ? new Date(appointment.date).toISOString().split('T')[0] 
        : '';
      
      formState.setValues({
        sessionDate: appointmentDate,
        sessionType: appointment.type || '',
      });
    }
  }, [appointment, formState.setValues]);
  
  // Simplified API for backward compatibility
  const simplifiedAPI = {
    formState: formState.values,
    handleChange: (field: keyof SessionNoteFormData, value: any) => formState.setFieldValue(field, value),
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid: formState.isValid,
    handleSubmit: formState.handleSubmit,
    resetForm: formState.resetForm,
    
    // Provide the full form state for advanced usage
    formStateAPI: formState
  };
  
  return simplifiedAPI;
};