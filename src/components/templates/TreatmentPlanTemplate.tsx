import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDetails } from "@/types/client";
import { useToast } from "@/hooks/use-toast";
import { supabase, formatDateForDB, getCurrentUser } from "@/integrations/supabase/client";
import { DiagnosisSelector } from "@/components/DiagnosisSelector";
import { generateAndSavePDF } from "@/utils/reactPdfUtils";

interface TreatmentPlanTemplateProps {
  onClose: () => void;
  clinicianName?: string;
  clientName?: string;
  clientDob?: string;
  clientData?: ClientDetails | null;
}

const TreatmentPlanTemplate: React.FC<TreatmentPlanTemplateProps> = ({ 
  onClose, 
  clinicianName = '',
  clientName = '',
  clientDob = '',
  clientData = null
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showSecondaryObjective, setShowSecondaryObjective] = useState(false);
  const [showTertiaryObjective, setShowTertiaryObjective] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Initialize form state from client data
  const [formState, setFormState] = useState({
    clientName: clientName || `${clientData?.client_first_name || ''} ${clientData?.client_last_name || ''}`,
    clientDob: clientDob || clientData?.client_date_of_birth || '',
    clinicianName: clinicianName || '',
    startDate: new Date(),
    planLength: clientData?.client_planlength || '',
    treatmentFrequency: clientData?.client_treatmentfrequency || '',
    diagnosisCodes: clientData?.client_diagnosis || [],
    problemNarrative: clientData?.client_problem || '',
    treatmentGoalNarrative: clientData?.client_treatmentgoal || '',
    primaryObjective: clientData?.client_primaryobjective || '',
    intervention1: clientData?.client_intervention1 || '',
    intervention2: clientData?.client_intervention2 || '',
    secondaryObjective: clientData?.client_secondaryobjective || '',
    intervention3: clientData?.client_intervention3 || '',
    intervention4: clientData?.client_intervention4 || '',
    tertiaryObjective: clientData?.client_tertiaryobjective || '',
    intervention5: clientData?.client_intervention5 || '',
    intervention6: clientData?.client_intervention6 || '',
    nextUpdate: clientData?.client_nexttreatmentplanupdate || '',
    privateNote: clientData?.client_privatenote || ''
  });

  // Validate form fields
  const validateForm = () => {
    // Check required fields that are always visible
    const baseFieldsValid = [
      !!formState.planLength,
      !!formState.treatmentFrequency,
      formState.diagnosisCodes?.length > 0,
      !!formState.problemNarrative.trim(),
      !!formState.treatmentGoalNarrative.trim(),
      !!formState.primaryObjective.trim(),
      !!formState.intervention1.trim(),
      !!formState.intervention2.trim(),
      !!formState.nextUpdate.trim()
    ].every(Boolean);
    
    // Check secondary objective fields if visible
    const secondaryFieldsValid = !showSecondaryObjective || [
      !!formState.secondaryObjective.trim(),
      !!formState.intervention3.trim(),
      !!formState.intervention4.trim()
    ].every(Boolean);
    
    // Check tertiary objective fields if visible
    const tertiaryFieldsValid = !showTertiaryObjective || [
      !!formState.tertiaryObjective.trim(),
      !!formState.intervention5.trim(),
      !!formState.intervention6.trim()
    ].every(Boolean);
    
    return baseFieldsValid && secondaryFieldsValid && tertiaryFieldsValid;
  };

  // Update form state if clientData changes
  useEffect(() => {
    if (clientData) {
      setFormState({
        clientName: `${clientData.client_first_name || ''} ${clientData.client_last_name || ''}`,
        clientDob: clientData.client_date_of_birth || '',
        clinicianName: clinicianName || '',
        startDate: new Date(),
        planLength: clientData.client_planlength || '',
        treatmentFrequency: clientData.client_treatmentfrequency || '',
        diagnosisCodes: clientData.client_diagnosis || [],
        problemNarrative: clientData.client_problem || '',
        treatmentGoalNarrative: clientData.client_treatmentgoal || '',
        primaryObjective: clientData.client_primaryobjective || '',
        intervention1: clientData.client_intervention1 || '',
        intervention2: clientData.client_intervention2 || '',
        secondaryObjective: clientData.client_secondaryobjective || '',
        intervention3: clientData.client_intervention3 || '',
        intervention4: clientData.client_intervention4 || '',
        tertiaryObjective: clientData.client_tertiaryobjective || '',
        intervention5: clientData.client_intervention5 || '',
        intervention6: clientData.client_intervention6 || '',
        nextUpdate: clientData.client_nexttreatmentplanupdate || '',
        privateNote: clientData.client_privatenote || ''
      });
      
      // Show objectives if they exist in client data
      setShowSecondaryObjective(!!clientData.client_secondaryobjective);
      setShowTertiaryObjective(!!clientData.client_tertiaryobjective);
    }
  }, [clientData, clinicianName]);

  // Check form validity whenever form state changes
  useEffect(() => {
    setIsFormValid(validateForm());
  }, [formState, showSecondaryObjective, showTertiaryObjective]);

  const handleChange = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleAddObjective = () => {
    if (!showSecondaryObjective) {
      setShowSecondaryObjective(true);
    } else if (!showTertiaryObjective) {
      setShowTertiaryObjective(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!clientData?.id) {
        toast({
          title: "Error",
          description: "Cannot save - client data is missing",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      const formattedStartDate = formatDateForDB(formState.startDate);

      // Map form data back to database schema
      const clientUpdates = {
        client_planlength: formState.planLength,
        client_treatmentfrequency: formState.treatmentFrequency,
        client_diagnosis: formState.diagnosisCodes,
        client_problem: formState.problemNarrative,
        client_treatmentgoal: formState.treatmentGoalNarrative,
        client_primaryobjective: formState.primaryObjective,
        client_secondaryobjective: formState.secondaryObjective,
        client_tertiaryobjective: formState.tertiaryObjective,
        client_intervention1: formState.intervention1,
        client_intervention2: formState.intervention2,
        client_intervention3: formState.intervention3,
        client_intervention4: formState.intervention4,
        client_intervention5: formState.intervention5,
        client_intervention6: formState.intervention6,
        client_nexttreatmentplanupdate: formState.nextUpdate,
        client_privatenote: formState.privateNote,
        client_treatmentplan_startdate: formattedStartDate
      };

      console.log('Saving treatment plan with updates:', clientUpdates);
      console.log('For client with ID:', clientData.id);

      // Update client in database
      const { error: clientError } = await supabase
        .from('clients')
        .update(clientUpdates)
        .eq('id', clientData.id);

      if (clientError) {
        console.error('Error updating client:', clientError);
        throw clientError;
      }

      // Generate and save PDF using React-PDF
      const currentUser = await getCurrentUser();
      const documentInfo = {
        clientId: clientData.id,
        documentType: 'treatment_plan',
        documentDate: formState.startDate || new Date(),
        documentTitle: `Treatment Plan - ${format(formState.startDate || new Date(), 'yyyy-MM-dd')}`,
        createdBy: currentUser?.id
      };
      
      // FIX: Pass the element ID as the first parameter, not the form data
      const elementId = 'treatment-plan-content';
      const pdfResult = await generateAndSavePDF(elementId, documentInfo);
      
      if (!pdfResult) {
        console.error('Failed to generate or save PDF');
        toast({
          title: "Warning",
          description: "Treatment plan saved but PDF generation failed.",
          variant: "default",
        });
        // Continue with saving the treatment plan record even if PDF fails
      }

      // Create new entry in treatment_plans table
      const treatmentPlanData = {
        client_id: clientData.id,
        clinician_id: clientData.client_assigned_therapist || '',
        client_name: formState.clientName,
        client_dob: formState.clientDob,
        clinician_name: formState.clinicianName,
        start_date: formattedStartDate,
        plan_length: formState.planLength,
        treatment_frequency: formState.treatmentFrequency,
        diagnosis: formState.diagnosisCodes,
        problem_narrative: formState.problemNarrative,
        treatment_goal_narrative: formState.treatmentGoalNarrative,
        primary_objective: formState.primaryObjective,
        secondary_objective: formState.secondaryObjective,
        tertiary_objective: formState.tertiaryObjective,
        intervention1: formState.intervention1,
        intervention2: formState.intervention2,
        intervention3: formState.intervention3,
        intervention4: formState.intervention4,
        intervention5: formState.intervention5,
        intervention6: formState.intervention6,
        next_update: formState.nextUpdate,
        private_note: formState.privateNote,
        pdf_path: pdfResult || ''
      };

      // Insert into treatment_plans table
      const { error: treatmentPlanError } = await supabase
        .from('treatment_plans')
        .insert(treatmentPlanData);

      if (treatmentPlanError) {
        console.error('Error creating treatment plan record:', treatmentPlanError);
        toast({
          title: "Warning",
          description: "Treatment plan saved but record creation failed.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Treatment plan saved successfully"
        });
      }

      onClose();
    } catch (err) {
      console.error('Error saving treatment plan:', err);
      toast({
        title: "Error",
        description: "Failed to save treatment plan",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full border border-gray-200 rounded-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold text-valorwell-700">Treatment Plan Template</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          This is the template used for client treatment plans. This template will be used when creating a new treatment plan from a client's record section.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6">
          <div 
            id="treatment-plan-content"
            className="border rounded-md p-4 bg-white"
          >
            {/* Treatment plan content here */}
            {/* ... existing content ... */}
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Treatment Plan'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPlanTemplate;
