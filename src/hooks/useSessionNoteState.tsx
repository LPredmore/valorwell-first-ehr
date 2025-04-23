
import { useState, useEffect } from 'react';
import { ClientDetails } from '@/types/client';
import { SessionNoteFormData } from '@/validations/sessionNoteSchemas';

interface UseSessionNoteStateProps {
  clientData: ClientDetails | null;
  clinicianName: string;
  appointment?: any;
}

export const useSessionNoteState = ({
  clientData,
  clinicianName,
  appointment
}: UseSessionNoteStateProps) => {
  const [formState, setFormState] = useState<SessionNoteFormData>({
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
  });

  // Update form with client data
  useEffect(() => {
    if (clientData) {
      setFormState(prev => ({
        ...prev,
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
      }));
    }
  }, [clientData]);

  // Update clinician name
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      clinicianName
    }));
  }, [clinicianName]);

  // Update appointment related fields
  useEffect(() => {
    if (appointment?.client) {
      const appointmentDate = appointment.date 
        ? new Date(appointment.date).toISOString().split('T')[0] 
        : '';
      
      setFormState(prev => ({
        ...prev,
        sessionDate: appointmentDate,
        sessionType: appointment.type || '',
      }));
    }
  }, [appointment]);

  const handleChange = (field: string, value: string | string[]) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    formState,
    handleChange,
  };
};
