import React, { useState, useEffect, useRef } from 'react';
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
import { ClientDetails } from "@/types/client";
import { useToast } from "@/hooks/use-toast";
import { supabase, formatDateForDB, getCurrentUser } from "@/integrations/supabase/client";
import { generateAndSavePDF } from "@/utils/pdfUtils";

interface SessionNoteTemplateProps {
  onClose: () => void;
  clinicianName?: string;
  clientName?: string;
  clientDob?: string;
  clientData?: ClientDetails | null;
}

const SessionNoteTemplate: React.FC<SessionNoteTemplateProps> = ({ 
  onClose, 
  clinicianName = '',
  clientName = '',
  clientDob = '',
  clientData = null
}) => {
  const { toast } = useToast();
  const sessionNoteRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
    sessionDate: new Date(),
    sessionType: '',
    presentingIssue: '',
    interventions: '',
    homework: '',
    goalProgress: '',
    prognosis: '',
    progress: '',
    signature: 'Electronic Signature on File'
  });

  useEffect(() => {
    if (clientData) {
      setFormState(prev => ({
        ...prev,
        clientName: `${clientData.client_first_name || ''} ${clientData.client_last_name || ''}`,
        clientDob: clientData.client_date_of_birth || '',
        clinicianName: clinicianName || '',
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
        nextUpdate: clientData.client_nexttreatmentplanupdate || ''
      }));
    }
  }, [clientData, clinicianName]);

  const handleChange = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
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

      const sessionData = {
        client_sessionnarrative: formState.presentingIssue,
        client_progress: formState.progress,
        client_prognosis: formState.prognosis,
        client_mood: formState.presentingIssue,
        client_interventions: formState.interventions,
        client_homework: formState.homework,
        client_goal_progress: formState.goalProgress
      };

      console.log('Saving session note with data:', sessionData);
      console.log('For client with ID:', clientData.id);

      const { error, data } = await supabase
        .from('clients')
        .update(sessionData)
        .eq('id', clientData.id)
        .select();

      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }

      console.log('Session note saved successfully:', data);

      if (sessionNoteRef.current) {
        const currentUser = await getCurrentUser();
        const sessionDate = formState.sessionDate ? format(formState.sessionDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        
        const documentInfo = {
          clientId: clientData.id,
          documentType: 'Session Note',
          documentDate: sessionDate,
          documentTitle: `Session Note - ${sessionDate}`,
          createdBy: currentUser?.id
        };

        const pdfPath = await generateAndSavePDF('session-note-content', documentInfo);
        
        if (pdfPath) {
          console.log('Session note PDF saved successfully at path:', pdfPath);
        } else {
          console.error('Failed to generate or save session note PDF');
        }
      }
      
      toast({
        title: "Success",
        description: "Session note saved successfully"
      });

      onClose();
    } catch (err) {
      console.error('Error saving session note:', err);
      toast({
        title: "Error",
        description: "Failed to save session note",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sessionTypeOptions = [
    "Psychotherapy, 53 minutes",
    "Psychotherapy, 43 minutes",
    "Psychotherapy, 30 minutes"
  ];

  const prognosisOptions = ["Poor", "Guarded", "Fair", "Good", "Excellent"];

  const progressOptions = [
    "Intake", 
    "Regressed", 
    "Crisis", 
    "Stable", 
    "Mild", 
    "Moderate", 
    "Significant", 
    "Near Discharge", 
    "Discharge"
  ];

  return (
    <Card className="w-full border border-gray-200 rounded-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold text-valorwell-700">Session Note Template</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          This is the template used for client session notes. This template will be used when creating a new session note from a client's record section.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6">
          <div 
            id="session-note-content"
            ref={sessionNoteRef}
            className="border rounded-md p-4 bg-white"
          >
            <h2 className="text-xl font-semibold text-valorwell-800 mb-4">Therapy Session Note</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="client-name" className="text-sm text-valorwell-700 font-semibold">Client Name</Label>
                <Input 
                  id="client-name" 
                  placeholder="Enter client name" 
                  value={formState.clientName}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-dob" className="text-sm text-valorwell-700 font-semibold">Client DOB</Label>
                <Input 
                  id="client-dob" 
                  placeholder="MM/DD/YYYY" 
                  value={formState.clientDob}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinician-name" className="text-sm text-valorwell-700 font-semibold">Clinician Name</Label>
                <Input 
                  id="clinician-name" 
                  placeholder="Enter clinician name" 
                  value={formState.clinicianName}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="session-date" className="text-sm text-valorwell-700 font-semibold">Session Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formState.sessionDate && "text-muted-foreground"
                      )}
                    >
                      {formState.sessionDate ? format(formState.sessionDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.sessionDate}
                      onSelect={(date) => handleChange('sessionDate', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-type" className="text-sm text-valorwell-700 font-semibold">Session Type</Label>
                <Select 
                  value={formState.sessionType}
                  onValueChange={(value) => handleChange('sessionType', value)}
                >
                  <SelectTrigger id="session-type">
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis" className="text-sm text-valorwell-700 font-semibold">Diagnosis</Label>
                <Input 
                  id="diagnosis" 
                  placeholder="Client diagnosis" 
                  value={formState.diagnosisCodes.join(', ')}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="plan-type" className="text-sm text-valorwell-700 font-semibold">Plan Type</Label>
                <Input 
                  id="plan-type" 
                  placeholder="Plan type" 
                  value={formState.planLength}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment-frequency" className="text-sm text-valorwell-700 font-semibold">Treatment Frequency</Label>
                <Input 
                  id="treatment-frequency" 
                  placeholder="Treatment frequency"
                  value={formState.treatmentFrequency}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problem-narrative" className="text-sm text-valorwell-700 font-semibold">Problem Narrative</Label>
                <Input 
                  id="problem-narrative" 
                  placeholder="Problem narrative" 
                  value={formState.problemNarrative}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="treatment-goal" className="text-sm text-valorwell-700 font-semibold">Treatment Goal Narrative</Label>
              <Input 
                id="treatment-goal" 
                placeholder="Treatment goal narrative" 
                value={formState.treatmentGoalNarrative}
                readOnly
                className="bg-gray-100"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="primary-objective" className="text-sm text-valorwell-700 font-semibold">Primary Objective</Label>
                <Input 
                  id="primary-objective" 
                  placeholder="Primary objective" 
                  value={formState.primaryObjective}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 1</Label>
                <Input 
                  id="intervention-1" 
                  placeholder="Intervention 1"
                  value={formState.intervention1}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 2</Label>
                <Input 
                  id="intervention-2" 
                  placeholder="Intervention 2"
                  value={formState.intervention2}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="secondary-objective" className="text-sm text-valorwell-700 font-semibold">Secondary Objective</Label>
                <Input 
                  id="secondary-objective" 
                  placeholder="Secondary objective" 
                  value={formState.secondaryObjective}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-3" className="text-sm text-valorwell-700 font-semibold">Intervention 3</Label>
                <Input 
                  id="intervention-3" 
                  placeholder="Intervention 3"
                  value={formState.intervention3}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-4" className="text-sm text-valorwell-700 font-semibold">Intervention 4</Label>
                <Input 
                  id="intervention-4" 
                  placeholder="Intervention 4"
                  value={formState.intervention4}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="tertiary-objective" className="text-sm text-valorwell-700 font-semibold">Tertiary Objective</Label>
                <Input 
                  id="tertiary-objective" 
                  placeholder="Tertiary objective" 
                  value={formState.tertiaryObjective}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-5" className="text-sm text-valorwell-700 font-semibold">Intervention 5</Label>
                <Input 
                  id="intervention-5" 
                  placeholder="Intervention 5"
                  value={formState.intervention5}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention-6" className="text-sm text-valorwell-700 font-semibold">Intervention 6</Label>
                <Input 
                  id="intervention-6" 
                  placeholder="Intervention 6"
                  value={formState.intervention6}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="next-update" className="text-sm text-valorwell-700 font-semibold">Next Treatment Plan Update</Label>
              <Input 
                id="next-update" 
                placeholder="Next treatment plan update"
                value={formState.nextUpdate}
                readOnly
                className="bg-gray-100"
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="presenting-issue" className="text-sm text-valorwell-700 font-semibold">Presenting Issue</Label>
              <Textarea 
                id="presenting-issue" 
                placeholder="Describe the presenting issue for this session" 
                className="min-h-[100px]"
                value={formState.presentingIssue}
                onChange={(e) => handleChange('presentingIssue', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="interventions" className="text-sm text-valorwell-700 font-semibold">Interventions Used in Session</Label>
              <Textarea 
                id="interventions" 
                placeholder="Describe interventions used during the session" 
                className="min-h-[100px]"
                value={formState.interventions}
                onChange={(e) => handleChange('interventions', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="homework" className="text-sm text-valorwell-700 font-semibold">Homework/Client Action Steps</Label>
              <Textarea 
                id="homework" 
                placeholder="Describe homework or action steps for the client" 
                className="min-h-[100px]"
                value={formState.homework}
                onChange={(e) => handleChange('homework', e.target.value)}
              />
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="goal-progress" className="text-sm text-valorwell-700 font-semibold">Goal Progress</Label>
              <Textarea 
                id="goal-progress" 
                placeholder="Describe progress towards treatment goals" 
                className="min-h-[100px]"
                value={formState.goalProgress}
                onChange={(e) => handleChange('goalProgress', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="prognosis" className="text-sm text-valorwell-700 font-semibold">Prognosis</Label>
                <Select 
                  value={formState.prognosis}
                  onValueChange={(value) => handleChange('prognosis', value)}
                >
                  <SelectTrigger id="prognosis">
                    <SelectValue placeholder="Select prognosis" />
                  </SelectTrigger>
                  <SelectContent>
                    {prognosisOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress" className="text-sm text-valorwell-700 font-semibold">Progress</Label>
                <Select 
                  value={formState.progress}
                  onValueChange={(value) => handleChange('progress', value)}
                >
                  <SelectTrigger id="progress">
                    <SelectValue placeholder="Select progress" />
                  </SelectTrigger>
                  <SelectContent>
                    {progressOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="signature" className="text-sm text-valorwell-700 font-semibold">Signature</Label>
              <Input 
                id="signature" 
                value={formState.signature}
                onChange={(e) => handleChange('signature', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="mr-2" disabled={isSaving}>Close</Button>
            <Button 
              className="bg-valorwell-700 hover:bg-valorwell-800" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Session Note"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionNoteTemplate;
