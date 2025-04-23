import React, { useState, useEffect, RefObject } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientDetails } from '@/types/client';
import { generateAndSavePDF } from '@/utils/reactPdfUtils';
import { sessionNoteSchema } from '@/validations/sessionNoteSchemas';

interface UseSessionNoteFormProps {
  clientData: ClientDetails | null;
  clinicianName: string;
  appointment?: any;
  onClose: () => void;
  contentRef?: RefObject<HTMLDivElement>;
}

export const useSessionNoteForm = ({
  clientData,
  clinicianName,
  appointment,
  onClose,
  contentRef
}: UseSessionNoteFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phq9Data, setPhq9Data] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formState, setFormState] = useState({
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

  useEffect(() => {
    const fetchClinicianInsuranceName = async () => {
      if (!clientData?.client_assigned_therapist) return;
      
      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('clinician_nameinsurance')
          .eq('id', clientData.client_assigned_therapist)
          .single();
            
        if (!error && data?.clinician_nameinsurance) {
          setFormState(prev => ({
            ...prev,
            clinicianName: data.clinician_nameinsurance
          }));
        }
      } catch (error) {
        console.error('Error in fetchClinicianInsuranceName:', error);
      }
    };
    
    fetchClinicianInsuranceName();
  }, [clientData]);

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
  }, [clientData, clinicianName]);

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

      if (clientData?.id && appointmentDate) {
        fetchPHQ9Assessment(clientData.id, appointmentDate);
      }
    }
  }, [appointment, clientData]);

  const fetchPHQ9Assessment = async (clientId: string, assessmentDate: string) => {
    const { data, error } = await supabase
      .from('phq9_assessments')
      .select('*')
      .eq('client_id', clientId)
      .eq('assessment_date', assessmentDate)
      .maybeSingle();

    if (error) {
      console.error('Error fetching PHQ-9 assessment:', error);
      return;
    }

    setPhq9Data(data);
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    const validationResult = sessionNoteSchema.safeParse(formState);
    setIsFormValid(validationResult.success);
    setValidationErrors(
      validationResult.success 
        ? [] 
        : validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    );
  }, [formState]);

  const handleSave = async () => {
    if (!clientData?.id) {
      toast({
        title: "Error",
        description: "No client ID found. Cannot save session note.",
        variant: "destructive",
      });
      return;
    }

    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields marked with an asterisk (*)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const clientUpdates = {
        client_appearance: formState.appearance,
        client_attitude: formState.attitude,
        client_behavior: formState.behavior,
        client_speech: formState.speech,
        client_affect: formState.affect,
        client_thoughtprocess: formState.thoughtProcess,
        client_perception: formState.perception,
        client_orientation: formState.orientation,
        client_memoryconcentration: formState.memoryConcentration,
        client_insightjudgement: formState.insightJudgement,
        client_mood: formState.mood,
        client_substanceabuserisk: formState.substanceAbuseRisk,
        client_suicidalideation: formState.suicidalIdeation,
        client_homicidalideation: formState.homicidalIdeation,
        client_primaryobjective: formState.primaryObjective,
        client_secondaryobjective: formState.secondaryObjective,
        client_tertiaryobjective: formState.tertiaryObjective,
        client_intervention1: formState.intervention1,
        client_intervention2: formState.intervention2,
        client_intervention3: formState.intervention3,
        client_intervention4: formState.intervention4,
        client_intervention5: formState.intervention5,
        client_intervention6: formState.intervention6,
        client_functioning: formState.functioning,
        client_prognosis: formState.prognosis,
        client_progress: formState.progress,
        client_problem: formState.problemNarrative,
        client_treatmentgoal: formState.treatmentGoalNarrative,
        client_sessionnarrative: formState.sessionNarrative,
        client_medications: formState.medications,
        client_personsinattendance: formState.personsInAttendance,
        client_diagnosis: formState.diagnosis,
        client_privatenote: formState.privateNote,
        client_nexttreatmentplanupdate: formState.nextTreatmentPlanUpdate,
      };

      const { error: clientError } = await supabase
        .from('clients')
        .update(clientUpdates)
        .eq('id', clientData.id);

      if (clientError) throw clientError;
      
      const sessionDate = appointment?.date 
        ? new Date(appointment.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      const clinician_id = appointment?.clinician_id || 
                          clientData.client_assigned_therapist || 
                          (await supabase.auth.getUser()).data.user?.id;

      if (!clinician_id) {
        throw new Error('No clinician_id available for session note');
      }
      
      const sessionNoteData = {
        client_id: clientData.id,
        clinician_id,
        appointment_id: appointment?.id || null,
        session_date: sessionDate,
        patient_name: formState.patientName,
        patient_dob: formState.patientDOB,
        clinician_name: formState.clinicianName,
        diagnosis: formState.diagnosis,
        plan_type: formState.planType,
        treatment_frequency: formState.treatmentFrequency,
        medications: formState.medications,
        session_type: formState.sessionType,
        persons_in_attendance: formState.personsInAttendance,
        appearance: formState.appearance,
        attitude: formState.attitude,
        behavior: formState.behavior,
        speech: formState.speech,
        affect: formState.affect,
        thought_process: formState.thoughtProcess,
        perception: formState.perception,
        orientation: formState.orientation,
        memory_concentration: formState.memoryConcentration,
        insight_judgement: formState.insightJudgement,
        mood: formState.mood,
        substance_abuse_risk: formState.substanceAbuseRisk,
        suicidal_ideation: formState.suicidalIdeation,
        homicidal_ideation: formState.homicidalIdeation,
        primary_objective: formState.primaryObjective,
        intervention1: formState.intervention1,
        intervention2: formState.intervention2,
        secondary_objective: formState.secondaryObjective,
        intervention3: formState.intervention3,
        intervention4: formState.intervention4,
        tertiary_objective: formState.tertiaryObjective,
        intervention5: formState.intervention5,
        intervention6: formState.intervention6,
        current_symptoms: formState.currentSymptoms,
        functioning: formState.functioning,
        prognosis: formState.prognosis,
        progress: formState.progress,
        problem_narrative: formState.problemNarrative,
        treatment_goal_narrative: formState.treatmentGoalNarrative,
        session_narrative: formState.sessionNarrative,
        next_treatment_plan_update: formState.nextTreatmentPlanUpdate,
        signature: formState.signature,
        private_note: formState.privateNote,
        phq9_data: phq9Data,
        phq9_score: phq9Data?.total_score || null
      };

      const { data: existingNote } = await supabase
        .from('session_notes')
        .select('id')
        .eq('client_id', clientData.id)
        .eq('appointment_id', appointment?.id || null)
        .maybeSingle();

      let sessionNoteId;
      if (existingNote?.id) {
        const { error: updateError } = await supabase
          .from('session_notes')
          .update(sessionNoteData)
          .eq('id', existingNote.id);
          
        if (updateError) throw updateError;
        sessionNoteId = existingNote.id;
      } else {
        const { data: newNote, error: insertError } = await supabase
          .from('session_notes')
          .insert(sessionNoteData)
          .select('id')
          .single();
          
        if (insertError) throw insertError;
        sessionNoteId = newNote?.id;
      }

      if (appointment?.id) {
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({ status: 'Documented' })
          .eq('id', appointment.id);

        if (appointmentError) {
          console.error('Error updating appointment status:', appointmentError);
        }
      }

      if (contentRef?.current && sessionNoteId) {
        const docDate = new Date();
        const documentInfo = {
          clientId: clientData.id,
          documentType: 'session_note',
          documentDate: docDate,
          documentTitle: `Session Note - ${formatDate(docDate)}`,
          createdBy: clinician_id
        };
        
        const pdfResult = await generateAndSavePDF('session-note-content', documentInfo);
        
        if (pdfResult) {
          await supabase
            .from('session_notes')
            .update({ pdf_path: pdfResult })
            .eq('id', sessionNoteId);
        }
      }

      toast({
        title: "Success",
        description: "Session note saved successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error",
        description: "Failed to save session note",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formState,
    handleChange,
    handleSave,
    isSubmitting,
    phq9Data,
    validationErrors,
    isFormValid
  };
};

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
