import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface TreatmentPlanTemplateProps {
  onClose: () => void;
  onSaveSuccess?: () => void;
  clientData?: any;
  clinicianData?: any;
}

const TreatmentPlanTemplate: React.FC<TreatmentPlanTemplateProps> = ({ 
  onClose,
  onSaveSuccess,
  clientData,
  clinicianData 
}) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: clientData ? `${clientData.client_first_name || ''} ${clientData.client_last_name || ''}`.trim() : '',
    clientDob: clientData?.client_date_of_birth || '',
    clinicianName: clinicianData?.clinician_professional_name || '',
    planLength: clientData?.client_planlength || '',
    treatmentFrequency: clientData?.client_treatmentfrequency || '',
    diagnosis: clientData?.client_diagnosis ? clientData.client_diagnosis.join(', ') : '',
    problemNarrative: clientData?.client_problem || '',
    treatmentGoal: clientData?.client_treatmentgoal || '',
    primaryObjective: clientData?.client_primaryobjective || '',
    intervention1: clientData?.client_intervention1 || '',
    intervention2: clientData?.client_intervention2 || '',
    secondaryObjective: clientData?.client_secondaryobjective || '',
    intervention3: clientData?.client_intervention3 || '',
    intervention4: clientData?.client_intervention4 || '',
    tertiaryObjective: clientData?.client_tertiaryobjective || '',
    intervention5: clientData?.client_intervention5 || '',
    intervention6: clientData?.client_intervention6 || '',
    nextUpdate: '',
    privateNote: clientData?.client_privatenote || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      if (!clientData?.id) {
        throw new Error('Client ID is missing');
      }
      
      const updates = {
        client_treatmentplan_startdate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        client_planlength: formData.planLength,
        client_treatmentfrequency: formData.treatmentFrequency,
        client_diagnosis: formData.diagnosis ? [formData.diagnosis] : [],
        client_problem: formData.problemNarrative,
        client_treatmentgoal: formData.treatmentGoal,
        client_primaryobjective: formData.primaryObjective,
        client_intervention1: formData.intervention1,
        client_intervention2: formData.intervention2,
        client_secondaryobjective: formData.secondaryObjective,
        client_intervention3: formData.intervention3,
        client_intervention4: formData.intervention4,
        client_tertiaryobjective: formData.tertiaryObjective,
        client_intervention5: formData.intervention5,
        client_intervention6: formData.intervention6,
        client_nexttreatmentplanupdate: null,
        client_privatenote: formData.privateNote
      };
      
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientData.id);
        
      if (error) throw error;
      
      if (onSaveSuccess) {
        onSaveSuccess();
      } else {
        toast({
          title: "Treatment Plan Saved",
          description: "The treatment plan was saved successfully",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      toast({
        title: "Error",
        description: "Failed to save treatment plan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border border-gray-200 rounded-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold text-valorwell-700">Treatment Plan</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Create a treatment plan for this client.
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
                  value={formData.clientName} 
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-dob" className="text-sm text-valorwell-700 font-semibold">Client DOB</Label>
                <Input 
                  id="client-dob" 
                  value={formData.clientDob} 
                  readOnly 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinician-name" className="text-sm text-valorwell-700 font-semibold">Clinician Name</Label>
                <Input 
                  id="clinician-name" 
                  value={formData.clinicianName} 
                  onChange={(e) => handleInputChange('clinicianName', e.target.value)}
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
                  value={formData.planLength}
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
                  value={formData.treatmentFrequency}
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
                placeholder="Select diagnosis code" 
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="problem-narrative" className="text-sm text-valorwell-700 font-semibold">Problem Narrative</Label>
              <Textarea 
                id="problem-narrative" 
                placeholder="Describe the presenting problem" 
                className="min-h-[100px]"
                value={formData.problemNarrative}
                onChange={(e) => handleInputChange('problemNarrative', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="treatment-goal" className="text-sm text-valorwell-700 font-semibold">Treatment Goal Narrative</Label>
              <Textarea 
                id="treatment-goal" 
                placeholder="Describe the treatment goals" 
                className="min-h-[100px]"
                value={formData.treatmentGoal}
                onChange={(e) => handleInputChange('treatmentGoal', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="primary-objective" className="text-sm text-valorwell-700 font-semibold">Primary Objective</Label>
              <Textarea 
                id="primary-objective" 
                placeholder="Describe the primary objective" 
                className="min-h-[100px]"
                value={formData.primaryObjective}
                onChange={(e) => handleInputChange('primaryObjective', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 1</Label>
                <Input 
                  id="intervention-1" 
                  placeholder="Describe intervention" 
                  value={formData.intervention1}
                  onChange={(e) => handleInputChange('intervention1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 2</Label>
                <Input 
                  id="intervention-2" 
                  placeholder="Describe intervention" 
                  value={formData.intervention2}
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
                value={formData.secondaryObjective}
                onChange={(e) => handleInputChange('secondaryObjective', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="sec-intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 3</Label>
                <Input 
                  id="sec-intervention-1" 
                  placeholder="Describe intervention" 
                  value={formData.intervention3}
                  onChange={(e) => handleInputChange('intervention3', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sec-intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 4</Label>
                <Input 
                  id="sec-intervention-2" 
                  placeholder="Describe intervention" 
                  value={formData.intervention4}
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
                value={formData.tertiaryObjective}
                onChange={(e) => handleInputChange('tertiaryObjective', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="tert-intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 5</Label>
                <Input 
                  id="tert-intervention-1" 
                  placeholder="Describe intervention" 
                  value={formData.intervention5}
                  onChange={(e) => handleInputChange('intervention5', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tert-intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 6</Label>
                <Input 
                  id="tert-intervention-2" 
                  placeholder="Describe intervention" 
                  value={formData.intervention6}
                  onChange={(e) => handleInputChange('intervention6', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="next-update" className="text-sm text-valorwell-700 font-semibold">Next Treatment Plan Update</Label>
              <Input 
                id="next-update" 
                placeholder="When will this plan be reviewed next" 
                value={formData.nextUpdate}
                onChange={(e) => handleInputChange('nextUpdate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-2">
              <Label htmlFor="private-note" className="text-sm text-valorwell-700 font-semibold">Private Note</Label>
              <Input 
                id="private-note" 
                placeholder="Notes visible only to providers"
                value={formData.privateNote}
                onChange={(e) => handleInputChange('privateNote', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
            <Button 
              className="bg-valorwell-700 hover:bg-valorwell-800"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Treatment Plan'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPlanTemplate;
