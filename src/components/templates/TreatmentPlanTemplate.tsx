import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDetails } from "@/types/client";
import { useToast } from "@/hooks/use-toast";
import { supabase, formatDateForDB } from "@/integrations/supabase/client";

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
  // Initialize form state from client data
  const [formState, setFormState] = useState({
    clientName: clientName || `${clientData?.client_first_name || ''} ${clientData?.client_last_name || ''}`,
    clientDob: clientDob || clientData?.client_date_of_birth || '',
    clinicianName: clinicianName || '',
    startDate: new Date(),
    planLength: clientData?.client_planlength || '',
    treatmentFrequency: clientData?.client_treatmentfrequency || '',
    diagnosis: clientData?.client_diagnosis ? clientData.client_diagnosis.join(', ') : '',
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
        diagnosis: clientData.client_diagnosis ? clientData.client_diagnosis.join(', ') : '',
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
    }
  }, [clientData, clinicianName]);

  // Function to calculate the next update date based on start date and plan length
  const calculateNextUpdateDate = (startDate: Date, planLength: string): string => {
    if (!startDate || !planLength) return '';
    
    // Extract the number of months from the planLength value
    const months = parseInt(planLength.replace('month', ''));
    
    // Calculate the next update date by adding months to the start date
    const nextDate = addMonths(startDate, months);
    
    // Format as YYYY-MM-DD for database compatibility
    return format(nextDate, 'yyyy-MM-dd');
  };

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormState(prev => {
      const newState = { ...prev, [field]: value };
      
      // If startDate or planLength changed, recalculate nextUpdate
      if ((field === 'startDate' || field === 'planLength') && newState.startDate && newState.planLength) {
        newState.nextUpdate = calculateNextUpdateDate(newState.startDate, newState.planLength);
      }
      
      return newState;
    });
  };

  const handleSave = async () => {
    try {
      if (!clientData?.id) {
        toast({
          title: "Error",
          description: "Cannot save - client data is missing",
          variant: "destructive"
        });
        return;
      }

      // Map form data back to database schema
      const updates = {
        client_planlength: formState.planLength,
        client_treatmentfrequency: formState.treatmentFrequency,
        client_diagnosis: formState.diagnosis ? formState.diagnosis.split(',').map(d => d.trim()) : [],
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
        client_nexttreatmentplanupdate: formState.nextUpdate ? formState.nextUpdate : null,
        client_privatenote: formState.privateNote,
        client_treatmentplan_startdate: formState.startDate ? formatDateForDB(formState.startDate) : null
      };

      console.log('Saving treatment plan with updates:', updates);
      console.log('For client with ID:', clientData.id);

      // Update client in database
      const { error, data } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientData.id)
        .select();

      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }

      console.log('Treatment plan saved successfully:', data);

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
    }
  };

  // When component mounts, calculate nextUpdate if startDate and planLength are already set
  useEffect(() => {
    if (formState.startDate && formState.planLength && !formState.nextUpdate) {
      handleChange('planLength', formState.planLength);
    }
  }, []);

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
          <div className="border rounded-md p-4 bg-white">
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
              <Input 
                id="diagnosis" 
                placeholder="Enter diagnoses separated by commas" 
                value={formState.diagnosis}
                onChange={(e) => handleChange('diagnosis', e.target.value)}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="secondary-objective" className="text-sm text-valorwell-700 font-semibold">Secondary Objective</Label>
              <Textarea 
                id="secondary-objective" 
                placeholder="Describe the secondary objective" 
                className="min-h-[100px]"
                value={formState.secondaryObjective}
                onChange={(e) => handleChange('secondaryObjective', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            
            <div className="space-y-2 mb-4">
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
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="next-update" className="text-sm text-valorwell-700 font-semibold">Next Treatment Plan Update</Label>
              <Input 
                id="next-update" 
                placeholder="Auto-calculated based on plan length"
                value={formState.nextUpdate}
                onChange={(e) => handleChange('nextUpdate', e.target.value)}
                readOnly
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">This date is automatically calculated based on the Plan Length</p>
            </div>
            
            <div className="space-y-2 mb-2">
              <Label htmlFor="private-note" className="text-sm text-valorwell-700 font-semibold">Private Note</Label>
              <Input 
                id="private-note" 
                placeholder="Notes visible only to providers"
                value={formState.privateNote}
                onChange={(e) => handleChange('privateNote', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="mr-2">Close</Button>
            <Button 
              className="bg-valorwell-700 hover:bg-valorwell-800" 
              onClick={handleSave}
            >
              Save Treatment Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPlanTemplate;
