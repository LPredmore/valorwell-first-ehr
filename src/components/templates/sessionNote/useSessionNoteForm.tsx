import React, { useState, useEffect, RefObject } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientDetails } from '@/types/client';
import { generateAndSavePDF } from '@/utils/reactPdfUtils';

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

  const [formState, setFormState] = useState({
    sessionDate: '',
    patientName: '',
    patientDOB: '',
    clinicianName: '',
    diagnosis: '',
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
      if (!clientData) return;
      
      try {
        const clinicianId = clientData.client_assigned_therapist;
        
        if (clinicianId) {
          const { data, error } = await supabase
            .from('clinicians')
            .select('clinician_nameinsurance')
            .eq('id', clinicianId)
            .single();
            
          if (error) {
            console.error('Error fetching clinician insurance name:', error);
            return;
          }
          
          if (data && data.clinician_nameinsurance) {
            setFormState(prevState => ({
              ...prevState,
              clinicianName: data.clinician_nameinsurance
            }));
          }
        }
      } catch (error) {
        console.error('Error in fetchClinicianInsuranceName:', error);
      }
    };
    
    fetchClinicianInsuranceName();
  }, [clientData]);

  useEffect(() => {
    if (clientData) {
      setFormState(prevState => ({
        ...prevState,
        patientName: `${clientData.client_first_name || ''} ${clientData.client_last_name || ''}`,
        patientDOB: clientData.client_date_of_birth || '',
        diagnosis: (clientData.client_diagnosis || []).join(', '),
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
    if (appointment && appointment.client) {
      const appointmentDate = appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : '';
      
      setFormState(prevState => ({
        ...prevState,
        sessionDate: appointmentDate,
        sessionType: appointment.type || '',
        patientName: appointment.client.client_first_name && appointment.client.client_last_name 
          ? `${appointment.client.client_first_name} ${appointment.client.client_last_name}`
          : prevState.patientName
      }));

      if (clientData?.id && appointmentDate) {
        fetchPHQ9Assessment(clientData.id, appointmentDate);
      }
    }
  }, [appointment, clientData]);

  const fetchPHQ9Assessment = async (clientId: string, assessmentDate: string) => {
    try {
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
    } catch (error) {
      console.error('Error in fetchPHQ9Assessment:', error);
    }
  };

  const handleChange = (field: string, value: string | string[]) => {
    if (field === 'diagnosis' && Array.isArray(value)) {
      setFormState({
        ...formState,
        [field]: value.join(', ')
      });
    } else {
      setFormState({
        ...formState,
        [field]: value
      });
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Format diagnosis from string to array if needed
      let client_diagnosis: string[] = [];
      if (typeof formState.diagnosis === 'string' && formState.diagnosis.trim()) {
        client_diagnosis = formState.diagnosis.split(',').map(d => d.trim()).filter(Boolean);
      }

      // Step 1: Update client data in clients table
      console.log("Updating client data...");
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
        client_diagnosis: client_diagnosis,
        client_privatenote: formState.privateNote,
        client_nexttreatmentplanupdate: formState.nextTreatmentPlanUpdate,
      };

      const { error } = await supabase
        .from('clients')
        .update(clientUpdates)
        .eq('id', clientData.id);

      if (error) {
        throw error;
      }
      
      console.log("Client data updated successfully");

      // Step 2: Handle session_notes table update or creation
      let pdfPath = null;
      let sessionDate = null;
      
      if (appointment?.date) {
        sessionDate = new Date(appointment.date).toISOString().split('T')[0];
      } else {
        sessionDate = new Date().toISOString().split('T')[0];
      }
      
      // Check if a session note already exists for this appointment
      console.log("Checking for existing session note...");
      const { data: existingNote, error: fetchError } = await supabase
        .from('session_notes')
        .select('id')
        .eq('client_id', clientData.id)
        .eq('appointment_id', appointment?.id || null)
        .maybeSingle();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing session note:', fetchError);
      }
      
      // Get clinician ID
      const clinician_id = appointment?.clinician_id || 
                          clientData.client_assigned_therapist || 
                          (await supabase.auth.getUser()).data.user?.id;

      // Ensure we have a clinician_id before proceeding
      if (!clinician_id) {
        console.error('No clinician_id available for session note');
        toast({
          title: "Error",
          description: "Could not determine clinician ID. Session note not saved.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Prepare data for session_notes table
      const sessionNoteData = {
        client_id: clientData.id,
        clinician_id: clinician_id,
        appointment_id: appointment?.id || null,
        session_date: sessionDate,
        patient_name: formState.patientName,
        patient_dob: formState.patientDOB,
        clinician_name: formState.clinicianName,
        diagnosis: client_diagnosis,
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

      // Step 3: Update or insert session note
      let sessionNoteId;
      console.log("Saving session note data...");
      try {
        if (existingNote?.id) {
          console.log("Updating existing session note:", existingNote.id);
          const { error: updateError } = await supabase
            .from('session_notes')
            .update(sessionNoteData)
            .eq('id', existingNote.id);
            
          if (updateError) {
            console.error('Error updating session note:', updateError);
            toast({
              title: "Warning",
              description: "Updated client data but failed to update session note.",
              variant: "default",
            });
          } else {
            sessionNoteId = existingNote.id;
            console.log("Session note updated successfully");
          }
        } else {
          console.log("Creating new session note");
          const { data: newNote, error: insertError } = await supabase
            .from('session_notes')
            .insert(sessionNoteData)
            .select('id')
            .single();
            
          if (insertError) {
            console.error('Error creating session note:', insertError);
            toast({
              title: "Warning",
              description: "Updated client data but failed to create session note record.",
              variant: "default",
            });
          } else if (newNote) {
            sessionNoteId = newNote.id;
            console.log("Session note created successfully with ID:", sessionNoteId);
          }
        }
      } catch (error) {
        console.error('Error saving session note:', error);
        toast({
          title: "Warning",
          description: "Error when saving session note data",
          variant: "default",
        });
      }

      // Step 4: Update appointment status to Documented
      if (appointment?.id) {
        console.log("Updating appointment status to Documented");
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({ status: 'Documented' })
          .eq('id', appointment.id);

        if (appointmentError) {
          console.error('Error updating appointment status:', appointmentError);
          toast({
            title: "Warning",
            description: "Session note saved, but couldn't update appointment status.",
            variant: "default",
          });
        } else {
          console.log(`Appointment ${appointment.id} status updated to Documented`);
        }
      }

      // Step 5: Generate PDF if we have a content reference
      if (contentRef?.current && sessionNoteId) {
        console.log("Generating PDF for session note...");
        try {
          const docDate = new Date();
          const documentInfo = {
            clientId: clientData.id,
            documentType: 'session_note',
            documentDate: docDate,
            documentTitle: `Session Note - ${format(docDate, 'yyyy-MM-dd')}`,
            createdBy: clinician_id
          };
          
          const elementId = 'session-note-content';
          const pdfResult = await generateAndSavePDF(elementId, documentInfo);
          
          if (pdfResult) {
            console.log("PDF generated successfully:", pdfResult);
            
            const { error: pdfUpdateError } = await supabase
              .from('session_notes')
              .update({ pdf_path: pdfResult })
              .eq('id', sessionNoteId);
              
            if (pdfUpdateError) {
              console.error('Error updating session note with PDF path:', pdfUpdateError);
            } else {
              console.log("Session note updated with PDF path");
            }
          } else {
            console.error("PDF generation failed");
          }
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
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
    phq9Data
  };
};

function format(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (formatStr === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }
  
  return `${month}/${day}/${year}`;
}
