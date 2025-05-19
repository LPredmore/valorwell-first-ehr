
import React, { useState, useEffect, useRef } from 'react';
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
import { generateAndSavePDF } from "@/utils/pdfUtils";

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
  const treatmentPlanRef = useRef<HTMLDivElement>(null);
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

      // Generate and save PDF
      let pdfPath = '';
      if (treatmentPlanRef.current) {
        const currentUser = await getCurrentUser();
        const documentInfo = {
          clientId: clientData.id,
          documentType: 'Treatment Plan',
          documentDate: formState.startDate || new Date(),
          documentTitle: `Treatment Plan - ${format(formState.startDate || new Date(), 'yyyy-MM-dd')}`,
          createdBy: currentUser?.id
        };

        pdfPath = await generateAndSavePDF('treatment-plan-content', documentInfo) || '';
        
        if (pdfPath) {
          console.log('PDF saved successfully at path:', pdfPath);
        } else {
          console.error('Failed to generate or save PDF');
        }
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
        pdf_path: pdfPath
      };

      // Insert into treatment_plans table
      const { error: treatmentPlanError } = await supabase
        .from('treatment_plans')
        .insert(treatmentPlanData);

      if (treatmentPlanError) {
        console.error('Error creating treatment plan record:', treatmentPlanError);
        throw treatmentPlanError;
      }

      toast({
        title: "Success",
        description: "Treatment plan saved successfully"
      });

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
            ref={treatmentPlanRef}
            className="border rounded-md p-4 bg-white"
          >
            <h2 className="text-xl font-semibold text-valorwell-800 mb-4">Therapy Treatment Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="client-name" className="text-sm text-valorwell-700 font-semibold">Client Name</Label>
                <Input 
                  id="client-name" 
                  placeholder="Enter client name" 
                  value={formState.clientName}
                  onChange={(e) => handleChange('clientName', e.target.value)}
                  disabled // Read-only as this is bound to client data
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-dob" className="text-sm text-valorwell-700 font-semibold">Client DOB</Label>
                <Input 
                  id="client-dob" 
                  placeholder="MM/DD/YYYY" 
                  value={formState.clientDob}
                  onChange={(e) => handleChange('clientDob', e.target.value)}
                  disabled // Read-only as this is bound to client data
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinician-name" className="text-sm text-valorwell-700 font-semibold">Clinician Name</Label>
                <Input 
                  id="clinician-name" 
                  placeholder="Enter clinician name" 
                  value={formState.clinicianName}
                  onChange={(e) => handleChange('clinicianName', e.target.value)}
                  disabled // Read-only as this is bound to clinician data
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm text-valorwell-700 font-semibold">Treatment Plan Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formState.startDate && "text-muted-foreground"
                      )}
                    >
                      {formState.startDate ? format(formState.startDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.startDate}
                      onSelect={(date) => handleChange('startDate', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-type" className="text-sm text-valorwell-700 font-semibold">Plan Length</Label>
                <Select 
                  value={formState.planLength}
                  onValueChange={(value) => handleChange('planLength', value)}
                >
                  <SelectTrigger id="plan-type">
                    <SelectValue placeholder="Select plan length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 month</SelectItem>
                    <SelectItem value="3month">3 month</SelectItem>
                    <SelectItem value="6month">6 month</SelectItem>
                    <SelectItem value="9month">9 month</SelectItem>
                    <SelectItem value="12month">12 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment-frequency" className="text-sm text-valorwell-700 font-semibold">Treatment Frequency</Label>
                <Select 
                  value={formState.treatmentFrequency}
                  onValueChange={(value) => handleChange('treatmentFrequency', value)}
                >
                  <SelectTrigger id="treatment-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="asneeded">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="diagnosis" className="text-sm text-valorwell-700 font-semibold">Diagnosis</Label>
              <DiagnosisSelector 
                value={formState.diagnosisCodes}
                onChange={(codes) => handleChange('diagnosisCodes', codes)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="problem-narrative" className="text-sm text-valorwell-700 font-semibold">Problem Narrative</Label>
              <Textarea 
                id="problem-narrative" 
                placeholder="Describe the presenting problem" 
                className="min-h-[100px]"
                value={formState.problemNarrative}
                onChange={(e) => handleChange('problemNarrative', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="treatment-goal" className="text-sm text-valorwell-700 font-semibold">Treatment Goal Narrative</Label>
              <Textarea 
                id="treatment-goal" 
                placeholder="Describe the treatment goals" 
                className="min-h-[100px]"
                value={formState.treatmentGoalNarrative}
                onChange={(e) => handleChange('treatmentGoalNarrative', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="primary-objective" className="text-sm text-valorwell-700 font-semibold">Primary Objective</Label>
              <Textarea 
                id="primary-objective" 
                placeholder="Describe the primary objective" 
                className="min-h-[100px]"
                value={formState.primaryObjective}
                onChange={(e) => handleChange('primaryObjective', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 1</Label>
                <Input 
                  id="intervention-1" 
                  placeholder="Describe intervention"
                  value={formState.intervention1}
                  onChange={(e) => handleChange('intervention1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 2</Label>
                <Input 
                  id="intervention-2" 
                  placeholder="Describe intervention"
                  value={formState.intervention2}
                  onChange={(e) => handleChange('intervention2', e.target.value)}
                />
              </div>
            </div>
            
            {!showSecondaryObjective && !showTertiaryObjective && (
              <div className="mb-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddObjective}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} /> Add Another Objective
                </Button>
              </div>
            )}
            
            {showSecondaryObjective && (
              <>
                <div className="space-y-2 mt-6 mb-4">
                  <Label htmlFor="secondary-objective" className="text-sm text-valorwell-700 font-semibold">Secondary Objective</Label>
                  <Textarea 
                    id="secondary-objective" 
                    placeholder="Describe the secondary objective" 
                    className="min-h-[100px]"
                    value={formState.secondaryObjective}
                    onChange={(e) => handleChange('secondaryObjective', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="sec-intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 3</Label>
                    <Input 
                      id="sec-intervention-1" 
                      placeholder="Describe intervention"
                      value={formState.intervention3}
                      onChange={(e) => handleChange('intervention3', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sec-intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 4</Label>
                    <Input 
                      id="sec-intervention-2" 
                      placeholder="Describe intervention"
                      value={formState.intervention4}
                      onChange={(e) => handleChange('intervention4', e.target.value)}
                    />
                  </div>
                </div>
                
                {!showTertiaryObjective && (
                  <div className="mb-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddObjective}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} /> Add Another Objective
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {showTertiaryObjective && (
              <>
                <div className="space-y-2 mt-6 mb-4">
                  <Label htmlFor="tertiary-objective" className="text-sm text-valorwell-700 font-semibold">Tertiary Objective</Label>
                  <Textarea 
                    id="tertiary-objective" 
                    placeholder="Describe the tertiary objective" 
                    className="min-h-[100px]"
                    value={formState.tertiaryObjective}
                    onChange={(e) => handleChange('tertiaryObjective', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="tert-intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 5</Label>
                    <Input 
                      id="tert-intervention-1" 
                      placeholder="Describe intervention"
                      value={formState.intervention5}
                      onChange={(e) => handleChange('intervention5', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tert-intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 6</Label>
                    <Input 
                      id="tert-intervention-2" 
                      placeholder="Describe intervention"
                      value={formState.intervention6}
                      onChange={(e) => handleChange('intervention6', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="next-update" className="text-sm text-valorwell-700 font-semibold">Next Treatment Plan Update</Label>
              <Input 
                id="next-update" 
                placeholder="When will this plan be reviewed next"
                value={formState.nextUpdate}
                onChange={(e) => handleChange('nextUpdate', e.target.value)}
              />
            </div>
          </div>
          
          {/* Private note section moved outside the element that will be turned into PDF */}
          <div className="space-y-2 mb-2 private-note-container">
            <Label htmlFor="private-note" className="text-sm text-valorwell-700 font-semibold">Private Note</Label>
            <Input 
              id="private-note" 
              placeholder="Notes visible only to providers"
              value={formState.privateNote}
              onChange={(e) => handleChange('privateNote', e.target.value)}
            />
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="mr-2" disabled={isSaving}>Close</Button>
            <Button 
              className="bg-valorwell-700 hover:bg-valorwell-800" 
              onClick={handleSave}
              disabled={isSaving || !isFormValid}
            >
              {isSaving ? "Saving..." : "Save Treatment Plan"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPlanTemplate;
