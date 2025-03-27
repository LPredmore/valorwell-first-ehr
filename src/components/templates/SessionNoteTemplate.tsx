import React, { useState } from 'react';
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

interface SessionNoteTemplateProps {
  onClose: () => void;
  clinicianName?: string;
  clientName?: string;
  clientDob?: string;
}

const SessionNoteTemplate: React.FC<SessionNoteTemplateProps> = ({ 
  onClose,
  clinicianName = '',
  clientName = '',
  clientDob = ''
}) => {
  const [sessionDate, setSessionDate] = useState('');
  
  // State for the dropdown/input field values
  const [appearance, setAppearance] = useState('');
  const [attitude, setAttitude] = useState('');
  const [behavior, setBehavior] = useState('');
  const [speech, setSpeech] = useState('');
  const [affect, setAffect] = useState('');
  const [thoughtProcess, setThoughtProcess] = useState('');
  const [perception, setPerception] = useState('');
  const [orientation, setOrientation] = useState('');
  const [memoryConcentration, setMemoryConcentration] = useState('');
  const [insightJudgement, setInsightJudgement] = useState('');
  const [substanceAbuseRisk, setSubstanceAbuseRisk] = useState('');
  const [suicidalIdeation, setSuicidalIdeation] = useState('');
  const [homicidalIdeation, setHomicidalIdeation] = useState('');
  
  // State to track if fields should be in edit mode
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

  // Helper function to toggle edit mode for a field
  const toggleEditMode = (field: string, value: string) => {
    if (value === 'Other') {
      setEditModes({ ...editModes, [field]: true });
      // Clear the field when switching to edit mode
      switch (field) {
        case 'appearance': setAppearance(''); break;
        case 'attitude': setAttitude(''); break;
        case 'behavior': setBehavior(''); break;
        case 'speech': setSpeech(''); break;
        case 'affect': setAffect(''); break;
        case 'thoughtProcess': setThoughtProcess(''); break;
        case 'perception': setPerception(''); break;
        case 'orientation': setOrientation(''); break;
        case 'memoryConcentration': setMemoryConcentration(''); break;
        case 'insightJudgement': setInsightJudgement(''); break;
        default: break;
      }
    } else {
      setEditModes({ ...editModes, [field]: false });
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
            <Input placeholder="Enter patient name" defaultValue={clientName} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient DOB</label>
            <Input placeholder="MM/DD/YYYY" defaultValue={clientDob} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinician Name</label>
            <Input placeholder="Enter clinician name" defaultValue={clinicianName} />
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
              value={sessionDate} 
              onChange={(e) => setSessionDate(e.target.value)}
              placeholder="Select date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>
            <Input placeholder="List current medications" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <Input placeholder="Enter session type" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Person's in Attendance</label>
          <Input placeholder="List all attendees" />
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-4">Mental Status Examination</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appearance</label>
            {editModes.appearance ? (
              <Input 
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                placeholder="Describe appearance"
                className="w-full"
              />
            ) : (
              <Select value={appearance} onValueChange={(value) => {
                setAppearance(value);
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
                value={attitude}
                onChange={(e) => setAttitude(e.target.value)}
                placeholder="Describe attitude"
                className="w-full"
              />
            ) : (
              <Select value={attitude} onValueChange={(value) => {
                setAttitude(value);
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
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder="Describe behavior"
                className="w-full"
              />
            ) : (
              <Select value={behavior} onValueChange={(value) => {
                setBehavior(value);
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
                value={speech}
                onChange={(e) => setSpeech(e.target.value)}
                placeholder="Describe speech"
                className="w-full"
              />
            ) : (
              <Select value={speech} onValueChange={(value) => {
                setSpeech(value);
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
                value={affect}
                onChange={(e) => setAffect(e.target.value)}
                placeholder="Describe affect"
                className="w-full"
              />
            ) : (
              <Select value={affect} onValueChange={(value) => {
                setAffect(value);
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
                value={thoughtProcess}
                onChange={(e) => setThoughtProcess(e.target.value)}
                placeholder="Describe thought process"
                className="w-full"
              />
            ) : (
              <Select value={thoughtProcess} onValueChange={(value) => {
                setThoughtProcess(value);
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
                value={perception}
                onChange={(e) => setPerception(e.target.value)}
                placeholder="Describe perception"
                className="w-full"
              />
            ) : (
              <Select value={perception} onValueChange={(value) => {
                setPerception(value);
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
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                placeholder="Describe orientation"
                className="w-full"
              />
            ) : (
              <Select value={orientation} onValueChange={(value) => {
                setOrientation(value);
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
                value={memoryConcentration}
                onChange={(e) => setMemoryConcentration(e.target.value)}
                placeholder="Describe memory/concentration"
                className="w-full"
              />
            ) : (
              <Select value={memoryConcentration} onValueChange={(value) => {
                setMemoryConcentration(value);
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
                value={insightJudgement}
                onChange={(e) => setInsightJudgement(e.target.value)}
                placeholder="Describe insight/judgement"
                className="w-full"
              />
            ) : (
              <Select value={insightJudgement} onValueChange={(value) => {
                setInsightJudgement(value);
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
            <Select value={substanceAbuseRisk} onValueChange={(value) => setSubstanceAbuseRisk(value)}>
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
            <Select value={suicidalIdeation} onValueChange={(value) => setSuicidalIdeation(value)}>
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
            <Select value={homicidalIdeation} onValueChange={(value) => setHomicidalIdeation(value)}>
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
          <Textarea placeholder="Describe the primary objective" className="min-h-[100px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 1</label>
            <Input placeholder="Describe intervention" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 2</label>
            <Input placeholder="Describe intervention" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Objective</label>
          <Textarea placeholder="Describe the secondary objective" className="min-h-[100px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 3</label>
            <Input placeholder="Describe intervention" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 4</label>
            <Input placeholder="Describe intervention" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tertiary Objective</label>
          <Textarea placeholder="Describe the tertiary objective" className="min-h-[100px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 5</label>
            <Input placeholder="Describe intervention" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 6</label>
            <Input placeholder="Describe intervention" />
          </div>
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-4">Session Assessment</h4>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Symptoms</label>
          <Textarea placeholder="Describe current symptoms" className="min-h-[100px]" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Functioning</label>
          <Textarea placeholder="Describe client functioning" className="min-h-[100px]" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Prognosis</label>
          <Textarea placeholder="Describe prognosis" className="min-h-[100px]" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
          <Textarea placeholder="Describe progress" className="min-h-[100px]" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Problem Narrative</label>
          <Textarea placeholder="Describe the problem narrative" className="min-h-[100px]" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Goal Narrative</label>
          <Textarea placeholder="Describe the treatment goals" className="min-h-[100px]" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Narrative</label>
          <Textarea placeholder="Provide a detailed narrative of the session" className="min-h-[100px]" />
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-4">Plan & Signature</h4>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Treatment Plan Update</label>
          <Input placeholder="When will this plan be reviewed next" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
          <Input placeholder="Digital signature" />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button className="bg-valorwell-700 hover:bg-valorwell-800">Save Template</Button>
      </div>
    </div>
  );
};

export default SessionNoteTemplate;
