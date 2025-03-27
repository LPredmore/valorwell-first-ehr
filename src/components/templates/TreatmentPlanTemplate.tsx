import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDetails } from "@/types/client";
import { useToast } from "@/hooks/use-toast";
import { supabase, formatDateForDB } from '@/integrations/supabase/client';

interface TreatmentPlanTemplateProps {
  onClose: () => void;
  clinicianName?: string;
  clientName?: string;
  clientDob?: string;
  clientData?: ClientDetails | null;
  clientId?: string;
}

const TreatmentPlanTemplate: React.FC<TreatmentPlanTemplateProps> = ({ 
  onClose, 
  clinicianName = '',
  clientName = '',
  clientDob = '',
  clientData = null,
  clientId
}) => {
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    clientData?.client_treatmentplan_startdate 
      ? new Date(clientData.client_treatmentplan_startdate) 
      : new Date()
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Initialize form state
  const [formValues, setFormValues] = useState({
    planLength: clientData?.client_planlength || '',
    treatmentFrequency: clientData?.client_treatmentfrequency || '',
    problem: clientData?.client_problem || '',
    treatmentGoal: clientData?.client_treatmentgoal || '',
    primaryObjective: clientData?.client_primaryobjective || '',
    secondaryObjective: clientData?.client_secondaryobjective || '',
    tertiaryObjective: clientData?.client_tertiaryobjective || '',
    intervention1: clientData?.client_intervention1 || '',
    intervention2: clientData?.client_intervention2 || '',
    intervention3: clientData?.client_intervention3 || '',
    intervention4: clientData?.client_intervention4 || '',
    intervention5: clientData?.client_intervention5 || '',
    intervention6: clientData?.client_intervention6 || '',
    nextUpdate: clientData?.client_nexttreatmentplanupdate || '',
    privateNote: clientData?.client_privatenote || '',
    diagnosis: clientData?.client_diagnosis ? clientData.client_diagnosis.join(', ') : ''
  });

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormValues({
      ...formValues,
      [field]: value
    });
  };
  
  // Derive values from clientData if available, otherwise use the direct props
  const derivedClientName = clientName || `${clientData?.client_first_name || ''} ${clientData?.client_last_name || ''}`;
  const derivedClientDob = clientDob || clientData?.client_date_of_birth || '';

  // Save treatment plan to database
  const handleSaveTreatmentPlan = async () => {
    if (!clientId && !clientData?.id) {
      toast({
        title: "Error",
        description: "No client ID provided. Cannot save treatment plan.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Process diagnosis field - convert comma-separated string to array
      const diagnosisArray = formValues.diagnosis 
        ? formValues.diagnosis.split(',').map(item => item.trim()) 
        : [];
      
      const updates = {
        client_treatmentplan_startdate: formatDateForDB(startDate),
        client_planlength: formValues.planLength,
        client_treatmentfrequency: formValues.treatmentFrequency,
        client_problem: formValues.problem,
        client_treatmentgoal: formValues.treatmentGoal,
        client_primaryobjective: formValues.primaryObjective,
        client_secondaryobjective: formValues.secondaryObjective,
        client_tertiaryobjective: formValues.tertiaryObjective,
        client_intervention1: formValues.intervention1,
        client_intervention2: formValues.intervention2,
        client_intervention3: formValues.intervention3,
        client_intervention4: formValues.intervention4,
        client_intervention5: formValues.intervention5,
        client_intervention6: formValues.intervention6,
        client_nexttreatmentplanupdate: formValues.nextUpdate,
        client_privatenote: formValues.privateNote,
        client_diagnosis: diagnosisArray
      };

      const id = clientId || clientData?.id;
      
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Treatment plan saved successfully."
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      toast({
        title: "Error",
        description: "Failed to save treatment plan. Please try again.",
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
          <div className="border rounded-md p-4 bg-white">
            <h2 className="text-xl font-semibold text-valorwell-800 mb-4">Therapy Treatment Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="client-name" className="text-sm text-valorwell-700 font-semibold">Client Name</Label>
                <Input id="client-name" placeholder="Enter client name" defaultValue={derivedClientName} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-dob" className="text-sm text-valorwell-700 font-semibold">Client DOB</Label>
                <Input id="client-dob" placeholder="MM/DD/YYYY" defaultValue={derivedClientDob} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinician-name" className="text-sm text-valorwell-700 font-semibold">Clinician Name</Label>
                <Input id="clinician-name" placeholder="Enter clinician name" defaultValue={clinicianName} readOnly />
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
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-type" className="text-sm text-valorwell-700 font-semibold">Plan Length</Label>
                <Select 
                  value={formValues.planLength} 
                  onValueChange={(value) => handleInputChange('planLength', value)}
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
                  value={formValues.treatmentFrequency} 
                  onValueChange={(value) => handleInputChange('treatmentFrequency', value)}
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
                placeholder="Enter diagnosis (comma separated)" 
                value={formValues.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="problem-narrative" className="text-sm text-valorwell-700 font-semibold">Problem Narrative</Label>
              <Textarea 
                id="problem-narrative" 
                placeholder="Describe the presenting problem" 
                className="min-h-[100px]"
                value={formValues.problem}
                onChange={(e) => handleInputChange('problem', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="treatment-goal" className="text-sm text-valorwell-700 font-semibold">Treatment Goal Narrative</Label>
              <Textarea 
                id="treatment-goal" 
                placeholder="Describe the treatment goals" 
                className="min-h-[100px]"
                value={formValues.treatmentGoal}
                onChange={(e) => handleInputChange('treatmentGoal', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="primary-objective" className="text-sm text-valorwell-700 font-semibold">Primary Objective</Label>
              <Textarea 
                id="primary-objective" 
                placeholder="Describe the primary objective" 
                className="min-h-[100px]"
                value={formValues.primaryObjective}
                onChange={(e) => handleInputChange('primaryObjective', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 1</Label>
                <Input 
                  id="intervention-1" 
                  placeholder="Describe intervention"
                  value={formValues.intervention1}
                  onChange={(e) => handleInputChange('intervention1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 2</Label>
                <Input 
                  id="intervention-2" 
                  placeholder="Describe intervention"
                  value={formValues.intervention2}
                  onChange={(e) => handleInputChange('intervention2', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="secondary-objective" className="text-sm text-valorwell-700 font-semibold">Secondary Objective</Label>
              <Textarea 
                id="secondary-objective" 
                placeholder="Describe the secondary objective" 
                className="min-h-[100px]"
                value={formValues.secondaryObjective}
                onChange={(e) => handleInputChange('secondaryObjective', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="sec-intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 3</Label>
                <Input 
                  id="sec-intervention-1" 
                  placeholder="Describe intervention"
                  value={formValues.intervention3}
                  onChange={(e) => handleInputChange('intervention3', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sec-intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 4</Label>
                <Input 
                  id="sec-intervention-2" 
                  placeholder="Describe intervention"
                  value={formValues.intervention4}
                  onChange={(e) => handleInputChange('intervention4', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="tertiary-objective" className="text-sm text-valorwell-700 font-semibold">Tertiary Objective</Label>
              <Textarea 
                id="tertiary-objective" 
                placeholder="Describe the tertiary objective" 
                className="min-h-[100px]"
                value={formValues.tertiaryObjective}
                onChange={(e) => handleInputChange('tertiaryObjective', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="tert-intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 5</Label>
                <Input 
                  id="tert-intervention-1" 
                  placeholder="Describe intervention"
                  value={formValues.intervention5}
                  onChange={(e) => handleInputChange('intervention5', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tert-intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 6</Label>
                <Input 
                  id="tert-intervention-2" 
                  placeholder="Describe intervention"
                  value={formValues.intervention6}
                  onChange={(e) => handleInputChange('intervention6', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="next-update" className="text-sm text-valorwell-700 font-semibold">Next Treatment Plan Update</Label>
              <Input 
                id="next-update" 
                placeholder="When will this plan be reviewed next"
                value={formValues.nextUpdate}
                onChange={(e) => handleInputChange('nextUpdate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-2">
              <Label htmlFor="private-note" className="text-sm text-valorwell-700 font-semibold">Private Note</Label>
              <Input 
                id="private-note" 
                placeholder="Notes visible only to providers"
                value={formValues.privateNote}
                onChange={(e) => handleInputChange('privateNote', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="mr-2">Close</Button>
            <Button 
              className="bg-valorwell-700 hover:bg-valorwell-800"
              onClick={handleSaveTreatmentPlan}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Treatment Plan"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPlanTemplate;
