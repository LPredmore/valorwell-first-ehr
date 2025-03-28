import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FileText } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ClientDetails } from "@/types/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  clientData
}) => {
  console.log("SessionNoteTemplate received clientData:", clientData); // Debug logging

  const [formState, setFormState] = useState({
    sessionDate: '',
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
    signature: ''
  });
  
  const [editModes, setEditModes] = useState({
    appearance: false,
    attitude: false,
    behavior: false,
    speech: false,
    affect: false,
    thoughtProcess: false,
    perception: false,
    orientation: false,
    memoryConcentration: false,
    insightJudgement: false
  });

  useEffect(() => {
    if (clientData) {
      console.log("Populating form state with client data:", clientData); // Debug logging
      
      setFormState(prevState => ({
        ...prevState,
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
        intervention1: clientData.client_intervention1 || '',
        intervention2: clientData.client_intervention2 || '',
        secondaryObjective: clientData.client_secondaryobjective || '',
        intervention3: clientData.client_intervention3 || '',
        intervention4: clientData.client_intervention4 || '',
        tertiaryObjective: clientData.client_tertiaryobjective || '',
        intervention5: clientData.client_intervention5 || '',
        intervention6: clientData.client_intervention6 || '',
        functioning: clientData.client_functioning || '',
        prognosis: clientData.client_prognosis || '',
        progress: clientData.client_progress || '',
        sessionNarrative: clientData.client_sessionnarrative || '',
        nextTreatmentPlanUpdate: clientData.client_nexttreatmentplanupdate || '',
        problemNarrative: clientData.client_problem || '',
        treatmentGoalNarrative: clientData.client_treatmentgoal || ''
      }));

      setEditModes({
        appearance: !!clientData.client_appearance && clientData.client_appearance !== 'Normal Appearance & Grooming',
        attitude: !!clientData.client_attitude && clientData.client_attitude !== 'Calm & Cooperative',
        behavior: !!clientData.client_behavior && clientData.client_behavior !== 'No unusual behavior or psychomotor changes',
        speech: !!clientData.client_speech && clientData.client_speech !== 'Normal rate/tone/volume w/out pressure',
        affect: !!clientData.client_affect && clientData.client_affect !== 'Normal range/congruent',
        thoughtProcess: !!clientData.client_thoughtprocess && clientData.client_thoughtprocess !== 'Goal Oriented/Directed',
        perception: !!clientData.client_perception && clientData.client_perception !== 'No Hallucinations or Delusions',
        orientation: !!clientData.client_orientation && clientData.client_orientation !== 'Oriented x3',
        memoryConcentration: !!clientData.client_memoryconcentration && clientData.client_memoryconcentration !== 'Short & Long Term Intact',
        insightJudgement: !!clientData.client_insightjudgement && clientData.client_insightjudgement !== 'Good'
      });
    }
  }, [clientData]);

  const handleChange = (field: string, value: string) => {
    setFormState(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const toggleEditMode = (field: string, value: string) => {
    if (value === 'Other') {
      setEditModes({ ...editModes, [field]: true });
      handleChange(field, '');
    } else {
      setEditModes({ ...editModes, [field]: false });
    }
  };

  const handleSave = async () => {
    if (!clientData?.id) {
      toast({
        title: "Error",
        description: "Client data is missing",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Saving session note for client ID:", clientData.id); // Debug logging
      console.log("Form state being saved:", formState); // Debug logging
      
      const updates = {
        client_medications: formState.medications,
        client_personsinattendance: formState.personsInAttendance,
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
        client_intervention1: formState.intervention1,
        client_intervention2: formState.intervention2,
        client_secondaryobjective: formState.secondaryObjective,
        client_intervention3: formState.intervention3,
        client_intervention4: formState.intervention4,
        client_tertiaryobjective: formState.tertiaryObjective,
        client_intervention5: formState.intervention5,
        client_intervention6: formState.intervention6,
        client_functioning: formState.functioning,
        client_prognosis: formState.prognosis,
        client_progress: formState.progress,
        client_sessionnarrative: formState.sessionNarrative,
        client_nexttreatmentplanupdate: formState.nextTreatmentPlanUpdate,
        client_problem: formState.problemNarrative,
        client_treatmentgoal: formState.treatmentGoalNarrative
      };

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session note saved successfully",
      });

      onClose();
    } catch (error) {
      console.error('Error saving session note:', error);
      toast({
        title: "Error",
        description: "Failed to save session note",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-semibold">Session Note Template</h2>
          <p className="text-sm text-gray-600">This is the template used for client session notes. This template will be used when creating a new session note for a client.</p>
        </div>
        <Button variant="outline" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="bg-white p-6 border rounded-md mt-4">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-medium">Therapy Session Note</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
            <Input placeholder="Enter patient name" defaultValue={clientName} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient DOB</label>
            <Input placeholder="MM/DD/YYYY" defaultValue={clientDob} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinician Name</label>
            <Input placeholder="Enter clinician name" defaultValue={clinicianName} readOnly />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
            <Input placeholder="Select diagnosis code" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
            <Input placeholder="Select plan length" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Frequency</label>
            <Input placeholder="Select frequency" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Date</label>
            <Input 
              type="date" 
              value={formState.sessionDate} 
              onChange={(e) => handleChange('sessionDate', e.target.value)}
              placeholder="Select date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>
            <Input 
              placeholder="List current medications" 
              value={formState.medications} 
              onChange={(e) => handleChange('medications', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <Input 
              placeholder="Enter session type" 
              value={formState.sessionType} 
              onChange={(e) => handleChange('sessionType', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Person's in Attendance</label>
          <Input 
            placeholder="List all attendees" 
            value={formState.personsInAttendance}
            onChange={(e) => handleChange('personsInAttendance', e.target.value)}
          />
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-4">Mental Status Examination</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appearance</label>
            {editModes.appearance ? (
              <Input 
                value={formState.appearance}
                onChange={(e) => handleChange('appearance', e.target.value)}
                placeholder="Describe appearance"
                className="w-full"
              />
            ) : (
              <Select value={formState.appearance} onValueChange={(value) => {
                handleChange('appearance', value);
                toggleEditMode('appearance', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appearance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal Appearance & Grooming">Normal Appearance & Grooming</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attitude</label>
            {editModes.attitude ? (
              <Input 
                value={formState.attitude}
                onChange={(e) => handleChange('attitude', e.target.value)}
                placeholder="Describe attitude"
                className="w-full"
              />
            ) : (
              <Select value={formState.attitude} onValueChange={(value) => {
                handleChange('attitude', value);
                toggleEditMode('attitude', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select attitude" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Calm & Cooperative">Calm & Cooperative</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Behavior</label>
            {editModes.behavior ? (
              <Input 
                value={formState.behavior}
                onChange={(e) => handleChange('behavior', e.target.value)}
                placeholder="Describe behavior"
                className="w-full"
              />
            ) : (
              <Select value={formState.behavior} onValueChange={(value) => {
                handleChange('behavior', value);
                toggleEditMode('behavior', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select behavior" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No unusual behavior or psychomotor changes">No unusual behavior or psychomotor changes</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speech</label>
            {editModes.speech ? (
              <Input 
                value={formState.speech}
                onChange={(e) => handleChange('speech', e.target.value)}
                placeholder="Describe speech"
                className="w-full"
              />
            ) : (
              <Select value={formState.speech} onValueChange={(value) => {
                handleChange('speech', value);
                toggleEditMode('speech', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select speech" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal rate/tone/volume w/out pressure">Normal rate/tone/volume w/out pressure</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Affect</label>
            {editModes.affect ? (
              <Input 
                value={formState.affect}
                onChange={(e) => handleChange('affect', e.target.value)}
                placeholder="Describe affect"
                className="w-full"
              />
            ) : (
              <Select value={formState.affect} onValueChange={(value) => {
                handleChange('affect', value);
                toggleEditMode('affect', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select affect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal range/congruent">Normal range/congruent</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thought Process</label>
            {editModes.thoughtProcess ? (
              <Input 
                value={formState.thoughtProcess}
                onChange={(e) => handleChange('thoughtProcess', e.target.value)}
                placeholder="Describe thought process"
                className="w-full"
              />
            ) : (
              <Select value={formState.thoughtProcess} onValueChange={(value) => {
                handleChange('thoughtProcess', value);
                toggleEditMode('thoughtProcess', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select thought process" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Goal Oriented/Directed">Goal Oriented/Directed</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perception</label>
            {editModes.perception ? (
              <Input 
                value={formState.perception}
                onChange={(e) => handleChange('perception', e.target.value)}
                placeholder="Describe perception"
                className="w-full"
              />
            ) : (
              <Select value={formState.perception} onValueChange={(value) => {
                handleChange('perception', value);
                toggleEditMode('perception', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select perception" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No Hallucinations or Delusions">No Hallucinations or Delusions</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
            {editModes.orientation ? (
              <Input 
                value={formState.orientation}
                onChange={(e) => handleChange('orientation', e.target.value)}
                placeholder="Describe orientation"
                className="w-full"
              />
            ) : (
              <Select value={formState.orientation} onValueChange={(value) => {
                handleChange('orientation', value);
                toggleEditMode('orientation', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oriented x3">Oriented x3</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Memory/Concentration</label>
            {editModes.memoryConcentration ? (
              <Input 
                value={formState.memoryConcentration}
                onChange={(e) => handleChange('memoryConcentration', e.target.value)}
                placeholder="Describe memory/concentration"
                className="w-full"
              />
            ) : (
              <Select value={formState.memoryConcentration} onValueChange={(value) => {
                handleChange('memoryConcentration', value);
                toggleEditMode('memoryConcentration', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select memory/concentration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Short & Long Term Intact">Short & Long Term Intact</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insight/Judgement</label>
            {editModes.insightJudgement ? (
              <Input 
                value={formState.insightJudgement}
                onChange={(e) => handleChange('insightJudgement', e.target.value)}
                placeholder="Describe insight/judgement"
                className="w-full"
              />
            ) : (
              <Select value={formState.insightJudgement} onValueChange={(value) => {
                handleChange('insightJudgement', value);
                toggleEditMode('insightJudgement', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select insight/judgement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
            <Input placeholder="Describe mood" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Substance Abuse Risk</label>
            <Select value={formState.substanceAbuseRisk} onValueChange={(value) => setFormState({ ...formState, substanceAbuseRisk: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suicidal Ideation</label>
            <Select value={formState.suicidalIdeation} onValueChange={(value) => setFormState({ ...formState, suicidalIdeation: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select ideation level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Passive">Passive</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homicidal Ideation</label>
            <Select value={formState.homicidalIdeation} onValueChange={(value) => setFormState({ ...formState, homicidalIdeation: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select ideation level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Passive">Passive</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-4">Treatment Objectives & Interventions</h4>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Objective</label>
          <Textarea 
            placeholder="Describe the primary objective" 
            className="min-h-[100px]" 
            value={formState.primaryObjective}
            onChange={(e) => handleChange('primaryObjective', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 1</label>
            <Input 
              placeholder="Describe intervention" 
              value={formState.intervention1}
              onChange={(e) => handleChange('intervention1', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 2</label>
            <Input 
              placeholder="Describe intervention" 
              value={formState.intervention2}
              onChange={(e) => handleChange('intervention2', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Objective</label>
          <Textarea 
            placeholder="Describe the secondary objective" 
            className="min-h-[100px]" 
            value={formState.secondaryObjective}
            onChange={(e) => handleChange('secondaryObjective', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 3</label>
            <Input 
              placeholder="Describe intervention" 
              value={formState.intervention3}
              onChange={(e) => handleChange('intervention3', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 4</label>
            <Input 
              placeholder="Describe intervention" 
              value={formState.intervention4}
              onChange={(e) => handleChange('intervention4', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tertiary Objective</label>
          <Textarea 
            placeholder="Describe the tertiary objective" 
            className="min-h-[100px]" 
            value={formState.tertiaryObjective}
            onChange={(e) => handleChange('tertiaryObjective', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 5</label>
            <Input 
              placeholder="Describe intervention" 
              value={formState.intervention5}
              onChange={(e) => handleChange('intervention5', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 6</label>
            <Input 
              placeholder="Describe intervention" 
              value={formState.intervention6}
              onChange={(e) => handleChange('intervention6', e.target.value)}
            />
          </div>
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-4">Session Assessment</h4>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Symptoms</label>
          <Textarea 
            placeholder="Describe current symptoms" 
            className="min-h-[100px]" 
            value={formState.currentSymptoms}
            onChange={(e) => handleChange('currentSymptoms', e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Functioning</label>
          <Textarea 
            placeholder="Describe client functioning" 
            className="min-h-[100px]" 
            value={formState.functioning}
            onChange={(e) => handleChange('functioning', e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Prognosis</label>
          <Textarea 
            placeholder="Describe prognosis" 
            className="min-h-[100px]" 
            value={formState.prognosis}
            onChange={(e) => handleChange('prognosis', e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
          <Textarea 
            placeholder="Describe progress" 
            className="min-h-[100px]" 
            value={formState.progress}
            onChange={(e) => handleChange('progress', e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Problem Narrative</label>
          <Textarea 
            placeholder="Describe the problem narrative" 
            className="min-h-[100px]" 
            value={formState.problemNarrative}
            onChange={(e) => handleChange('problemNarrative', e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Goal Narrative</label>
          <Textarea 
            placeholder="Describe the treatment goals" 
            className="min-h-[100px]" 
            value={formState.treatmentGoalNarrative}
            onChange={(e) => handleChange('treatmentGoalNarrative', e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Narrative</label>
          <Textarea 
            placeholder="Provide a detailed narrative of the session" 
            className="min-h-[100px]" 
            value={formState.sessionNarrative}
            onChange={(e) => handleChange('sessionNarrative', e.target.value)}
          />
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-4">Plan & Signature</h4>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Treatment Plan Update</label>
          <Input 
            placeholder="When will this plan be reviewed next" 
            value={formState.nextTreatmentPlanUpdate}
            onChange={(e) => handleChange('nextTreatmentPlanUpdate', e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
          <Input 
            placeholder="Digital signature" 
            value={formState.signature}
            onChange={(e) => handleChange('signature', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button className="bg-valorwell-700 hover:bg-valorwell-800" onClick={handleSave}>Save Session Note</Button>
      </div>
    </div>
  );
};

export default SessionNoteTemplate;
