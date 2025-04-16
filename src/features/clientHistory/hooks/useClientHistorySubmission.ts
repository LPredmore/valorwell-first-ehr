
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ClientHistoryFormData } from '../types';
import { handleFormSubmission } from '@/utils/formSubmissionUtils';

interface UseClientHistorySubmissionProps {
  userId: string;
}

export const useClientHistorySubmission = ({ userId }: UseClientHistorySubmissionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitClientHistory = async (formData: ClientHistoryFormData) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to submit this form.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Submitting client history form data:", formData);
      
      // Step 1: Create the main history record
      const { data: historyData, error: historyError } = await supabase
        .from('client_history')
        .insert({
          client_id: userId,
          emergency_name: formData.emergencyContact?.name || null,
          emergency_relationship: formData.emergencyContact?.relationship || null,
          emergency_phone: formData.emergencyContact?.phone || null,
          current_issues: formData.currentIssues || null,
          progression_of_issues: formData.progressionOfIssues || null,
          selected_symptoms: formData.symptoms || [],
          hospitalized_psychiatric: formData.hospitalizedPsychiatric || false,
          attempted_suicide: formData.attemptedSuicide || false,
          psych_hold: formData.psychHold || false,
          life_changes: formData.lifeChanges || null,
          additional_info: formData.additionalInfo || null,
          counseling_goals: formData.counselingGoals || null,
          childhood_elaboration: formData.childhoodElaboration || null,
          occupation_details: formData.occupationDetails || null,
          education_level: formData.educationLevel || null,
          relationship_problems: formData.relationshipProblems || null,
          chronic_health_problems: formData.chronicHealthProblems || null,
          sleep_hours: formData.sleepHours || null,
          alcohol_use: formData.alcoholUse || null,
          tobacco_use: formData.tobaccoUse || null,
          drug_use: formData.drugUse || null,
          personal_strengths: formData.personalStrengths || null,
          hobbies: formData.hobbies || null,
          additional_info2: formData.additionalInfo2 || null,
          signature: formData.signature || null,
          selected_childhood_experiences: formData.childhoodExperiences || [],
          selected_medical_conditions: formData.medicalConditions || [],
          is_family_same_as_household: formData.isFamilySameAsHousehold || false,
          is_married: formData.isMarried || false,
          has_past_spouses: formData.hasPastSpouses || false,
          has_received_mental_health_treatment: formData.hasReceivedTreatment || false,
          takes_medications: formData.takesMedications || false
        })
        .select('id')
        .single();
      
      if (historyError) {
        throw historyError;
      }
      
      const historyId = historyData.id;
      console.log("Created history record:", historyId);
      
      // Step 2: Add current spouse if applicable
      if (formData.isMarried && formData.currentSpouse) {
        const { error: spouseError } = await supabase
          .from('client_history_current_spouse')
          .insert({
            history_id: historyId,
            name: formData.currentSpouse.name || null,
            personality: formData.currentSpouse.personality || null,
            relationship: formData.currentSpouse.relationship || null
          });
          
        if (spouseError) {
          console.error("Error saving spouse information:", spouseError);
        }
      }
      
      // Step 3: Add family members if provided
      if (formData.familyMembers && formData.familyMembers.length > 0) {
        const familyMembers = formData.familyMembers.map((member) => ({
          history_id: historyId,
          relationship_type: member.relationshipType || null,
          name: member.name || null,
          personality: member.personality || null,
          relationship_growing: member.relationshipGrowing || null,
          relationship_now: member.relationshipNow || null
        }));
        
        const { error: familyError } = await supabase
          .from('client_history_family')
          .insert(familyMembers);
          
        if (familyError) {
          console.error("Error saving family members:", familyError);
        }
      }
      
      // Step 4: Add household members if different from family
      if (!formData.isFamilySameAsHousehold && formData.householdMembers && formData.householdMembers.length > 0) {
        const householdMembers = formData.householdMembers.map((member) => ({
          history_id: historyId,
          relationship_type: member.relationshipType || null,
          name: member.name || null,
          personality: member.personality || null,
          relationship_now: member.relationshipNow || null
        }));
        
        const { error: householdError } = await supabase
          .from('client_history_household')
          .insert(householdMembers);
          
        if (householdError) {
          console.error("Error saving household members:", householdError);
        }
      }
      
      // Step 5: Add past spouses if applicable
      if (formData.hasPastSpouses && formData.pastSpouses && formData.pastSpouses.length > 0) {
        const pastSpouses = formData.pastSpouses.map((spouse) => ({
          history_id: historyId,
          name: spouse.name || null,
          personality: spouse.personality || null,
          relationship: spouse.relationship || null
        }));
        
        const { error: spousesError } = await supabase
          .from('client_history_spouses')
          .insert(pastSpouses);
          
        if (spousesError) {
          console.error("Error saving past spouses:", spousesError);
        }
      }
      
      // Step 6: Add past treatments if applicable
      if (formData.hasReceivedTreatment && formData.pastTreatments && formData.pastTreatments.length > 0) {
        const pastTreatments = formData.pastTreatments.map((treatment) => ({
          history_id: historyId,
          year: treatment.year || null,
          reason: treatment.reason || null,
          length: treatment.length || null,
          provider: treatment.provider || null
        }));
        
        const { error: treatmentsError } = await supabase
          .from('client_history_treatments')
          .insert(pastTreatments);
          
        if (treatmentsError) {
          console.error("Error saving past treatments:", treatmentsError);
        }
      }
      
      // Step 7: Add medications if applicable
      if (formData.takesMedications && formData.medications && formData.medications.length > 0) {
        const medications = formData.medications.map((medication) => ({
          history_id: historyId,
          name: medication.name || null,
          purpose: medication.purpose || null,
          duration: medication.duration || null
        }));
        
        const { error: medicationsError } = await supabase
          .from('client_history_medications')
          .insert(medications);
          
        if (medicationsError) {
          console.error("Error saving medications:", medicationsError);
        }
      }
      
      // Step 8: Generate PDF and update document assignment
      const docDate = new Date();
      const documentInfo = {
        clientId: userId,
        documentType: 'client_history',
        documentDate: docDate,
        documentTitle: 'Client History Form',
        createdBy: userId
      };
      
      const result = await handleFormSubmission(
        'client-history-form',
        documentInfo,
        'Client History',
        formData
      );
      
      if (result.success && result.filePath) {
        // Update the client_history record with the PDF path
        const { error: pdfUpdateError } = await supabase
          .from('client_history')
          .update({ pdf_path: result.filePath })
          .eq('id', historyId);
          
        if (pdfUpdateError) {
          console.error("Error updating history with PDF path:", pdfUpdateError);
        }
        
        // Success! Update client status if needed
        const { error: clientStatusError } = await supabase
          .from('clients')
          .update({ client_status: 'Active' })
          .eq('id', userId);
          
        if (clientStatusError) {
          console.error("Error updating client status:", clientStatusError);
        }
        
        toast({
          title: "Success!",
          description: "Your client history form has been submitted successfully.",
        });
        
        // Redirect to patient dashboard
        navigate("/patient-dashboard");
        return true;
      } else {
        // Handle PDF generation failure
        toast({
          title: "Warning",
          description: result.message || "There was an issue with document generation.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return false;
      }
    } catch (error) {
      console.error("Error submitting client history form:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your form. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return false;
    }
  };

  return {
    isSubmitting,
    submitClientHistory,
  };
};
