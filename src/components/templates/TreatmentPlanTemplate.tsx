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

  const validateForm = () => {
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
    
    const secondaryFieldsValid = !showSecondaryObjective || [
      !!formState.secondaryObjective.trim(),
      !!formState.intervention3.trim(),
      !!formState.intervention4.trim()
    ].every(Boolean);
    
    const tertiaryFieldsValid = !showTertiaryObjective || [
      !!formState.tertiaryObjective.trim(),
      !!formState.intervention5.trim(),
      !!formState.intervention6.trim()
    ].every(Boolean);
    
    return baseFieldsValid && secondaryFieldsValid && tertiaryFieldsValid;
  };

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
      
      setShowSecondaryObjective(!!clientData.client_secondaryobjective);
      setShowTertiaryObjective(!!clientData.client_tertiaryobjective);
    }
  }, [clientData, clinicianName]);

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

      const currentUser = await getCurrentUser();
      const documentInfo = {
        clientId: clientData.id,
        documentType: 'treatment_plan',
        documentDate: formState.startDate || new Date(),
        documentTitle: `Treatment Plan - ${format(formState.startDate || new Date(), 'yyyy-MM-dd')}`,
        createdBy: currentUser?.id
      };
      
      const elementId = 'treatment-plan-content';
      const pdfResult = await generateAndSavePDF(elementId, documentInfo);
      
      if (!pdfResult) {
        console.error('Failed to generate or save PDF');
        toast({
          title: "Warning",
          description: "Treatment plan saved but PDF generation failed.",
          variant: "default",
        });
      }

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
            <div className="mb-6">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                type="text"
                id="clientName"
                value={formState.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                disabled
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="clientDob">Client Date of Birth</Label>
              <Input
                type="text"
                id="clientDob"
                value={formState.clientDob}
                onChange={(e) => handleChange('clientDob', e.target.value)}
                disabled
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="clinicianName">Clinician Name</Label>
              <Input
                type="text"
                id="clinicianName"
                value={formState.clinicianName}
                onChange={(e) => handleChange('clinicianName', e.target.value)}
              />
            </div>
            <div className="mb-6">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !formState.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.startDate ? (
                      format(formState.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formState.startDate}
                    onSelect={(date) => handleChange('startDate', date)}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="mb-6">
              <Label htmlFor="planLength">Plan Length</Label>
              <Select onValueChange={(value) => handleChange('planLength', value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 Days">30 Days</SelectItem>
                  <SelectItem value="60 Days">60 Days</SelectItem>
                  <SelectItem value="90 Days">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mb-6">
              <Label htmlFor="treatmentFrequency">Treatment Frequency</Label>
              <Input
                type="text"
                id="treatmentFrequency"
                value={formState.treatmentFrequency}
                onChange={(e) => handleChange('treatmentFrequency', e.target.value)}
                placeholder="e.g., Weekly"
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="diagnosisCodes">Diagnosis Codes</Label>
              <DiagnosisSelector
                selected={formState.diagnosisCodes}
                onSelect={(codes) => handleChange('diagnosisCodes', codes)}
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="problemNarrative">Problem Narrative</Label>
              <Textarea
                id="problemNarrative"
                placeholder="Describe the client's presenting problem"
                value={formState.problemNarrative}
                onChange={(e) => handleChange('problemNarrative', e.target.value)}
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="treatmentGoalNarrative">Treatment Goal Narrative</Label>
              <Textarea
                id="treatmentGoalNarrative"
                placeholder="Define the overall goal of treatment"
                value={formState.treatmentGoalNarrative}
                onChange={(e) => handleChange('treatmentGoalNarrative', e.target.value)}
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="primaryObjective">Primary Objective</Label>
              <Textarea
                id="primaryObjective"
                placeholder="Define the primary objective"
                value={formState.primaryObjective}
                onChange={(e) => handleChange('primaryObjective', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="intervention1">Intervention 1</Label>
                  <Textarea
                    id="intervention1"
                    placeholder="Describe intervention 1"
                    value={formState.intervention1}
                    onChange={(e) => handleChange('intervention1', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="intervention2">Intervention 2</Label>
                  <Textarea
                    id="intervention2"
                    placeholder="Describe intervention 2"
                    value={formState.intervention2}
                    onChange={(e) => handleChange('intervention2', e.target.value)}
                  />
                </div>
              </div>
            </div>
            {showSecondaryObjective && (
              <div className="mb-6">
                <Label htmlFor="secondaryObjective">Secondary Objective</Label>
                <Textarea
                  id="secondaryObjective"
                  placeholder="Define the secondary objective"
                  value={formState.secondaryObjective}
                  onChange={(e) => handleChange('secondaryObjective', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="intervention3">Intervention 3</Label>
                    <Textarea
                      id="intervention3"
                      placeholder="Describe intervention 3"
                      value={formState.intervention3}
                      onChange={(e) => handleChange('intervention3', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="intervention4">Intervention 4</Label>
                    <Textarea
                      id="intervention4"
                      placeholder="Describe intervention 4"
                      value={formState.intervention4}
                      onChange={(e) => handleChange('intervention4', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            {showTertiaryObjective && (
              <div className="mb-6">
                <Label htmlFor="tertiaryObjective">Tertiary Objective</Label>
                <Textarea
                  id="tertiaryObjective"
                  placeholder="Define the tertiary objective"
                  value={formState.tertiaryObjective}
                  onChange={(e) => handleChange('tertiaryObjective', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="intervention5">Intervention 5</Label>
                    <Textarea
                      id="intervention5"
                      placeholder="Describe intervention 5"
                      value={formState.intervention5}
                      onChange={(e) => handleChange('intervention5', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="intervention6">Intervention 6</Label>
                    <Textarea
                      id="intervention6"
                      placeholder="Describe intervention 6"
                      value={formState.intervention6}
                      onChange={(e) => handleChange('intervention6', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            {!showSecondaryObjective && !showTertiaryObjective && (
              <Button variant="secondary" size="sm" onClick={handleAddObjective}>
                <Plus className="h-4 w-4 mr-2" /> Add Objective
              </Button>
            )}
            <div className="mb-6">
              <Label htmlFor="nextUpdate">Next Treatment Plan Update</Label>
              <Input
                type="text"
                id="nextUpdate"
                placeholder="Enter date for next update"
                value={formState.nextUpdate}
                onChange={(e) => handleChange('nextUpdate', e.target.value)}
              />
            </div>
            <div className="mb-6">
              <Label htmlFor="privateNote">Private Note</Label>
              <Textarea
                id="privateNote"
                placeholder="Enter private note (therapist only)"
                className="private-note-container"
                value={formState.privateNote}
                onChange={(e) => handleChange('privateNote', e.target.value)}
              />
            </div>
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
