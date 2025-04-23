
import { useState } from 'react';
import { supabase } from '../../api/supabase';
import { SessionNoteFormData } from '../../types/sessionNote';

interface UseSessionNoteSaveProps {
  clientId: string;
  clinicianId: string;
  appointmentId?: string;
}

export const useSessionNoteSave = ({
  clientId,
  clinicianId,
  appointmentId
}: UseSessionNoteSaveProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const saveSessionNote = async (formData: SessionNoteFormData) => {
    if (!clientId || !clinicianId) {
      setSaveError('Missing client or clinician information');
      return null;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Map form data to database structure
      const sessionNoteData = {
        client_id: clientId,
        clinician_id: clinicianId,
        appointment_id: appointmentId || null,
        session_date: formData.sessionDate,
        session_type: formData.sessionType,
        client_name: formData.patientName,
        patient_name: formData.patientName,
        patient_dob: formData.patientDOB,
        clinician_name: formData.clinicianName,
        diagnosis: formData.diagnosis,
        plan_type: formData.planType,
        treatment_frequency: formData.treatmentFrequency,
        medications: formData.medications,
        persons_in_attendance: formData.personsInAttendance,
        appearance: formData.appearance,
        attitude: formData.attitude,
        behavior: formData.behavior,
        speech: formData.speech,
        affect: formData.affect,
        thought_process: formData.thoughtProcess,
        perception: formData.perception,
        orientation: formData.orientation,
        memory_concentration: formData.memoryConcentration,
        insight_judgement: formData.insightJudgement,
        mood: formData.mood,
        substance_abuse_risk: formData.substanceAbuseRisk,
        suicidal_ideation: formData.suicidalIdeation,
        homicidal_ideation: formData.homicidalIdeation,
        primary_objective: formData.primaryObjective,
        intervention1: formData.intervention1,
        intervention2: formData.intervention2,
        secondary_objective: formData.secondaryObjective,
        intervention3: formData.intervention3,
        intervention4: formData.intervention4,
        tertiary_objective: formData.tertiaryObjective,
        intervention5: formData.intervention5,
        intervention6: formData.intervention6,
        current_symptoms: formData.currentSymptoms,
        functioning: formData.functioning,
        prognosis: formData.prognosis,
        progress: formData.progress,
        problem_narrative: formData.problemNarrative,
        treatment_goal_narrative: formData.treatmentGoalNarrative,
        session_narrative: formData.sessionNarrative,
        next_treatment_plan_update: formData.nextTreatmentPlanUpdate,
        signature: formData.signature,
        private_note: formData.privateNote
      };

      // Insert the session note
      const { data, error } = await supabase
        .from('session_notes')
        .insert(sessionNoteData)
        .select('id')
        .single();

      if (error) {
        console.error('Error saving session note:', error);
        setSaveError(error.message);
        return null;
      }

      // Also save a copy to the session notes history table
      const historyData = {
        client_id: clientId,
        clinician_id: clinicianId,
        appointment_id: appointmentId || null,
        session_date: formData.sessionDate,
        session_type: formData.sessionType,
        session_data: sessionNoteData
      };

      await supabase.from('session_notes_history').insert(historyData);

      setSavedSessionId(data.id);
      return data.id;
    } catch (err) {
      console.error('Exception during session note save:', err);
      setSaveError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveError,
    savedSessionId,
    saveSessionNote
  };
};
