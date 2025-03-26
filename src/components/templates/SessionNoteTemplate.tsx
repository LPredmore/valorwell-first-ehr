
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FileText } from 'lucide-react';

interface SessionNoteTemplateProps {
  onClose: () => void;
}

const SessionNoteTemplate: React.FC<SessionNoteTemplateProps> = ({ onClose }) => {
  const [sessionDate, setSessionDate] = useState('');

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
            <Input placeholder="Enter patient name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient DOB</label>
            <Input placeholder="MM/DD/YYYY" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinician Name</label>
            <Input placeholder="Enter clinician name" />
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
            <Input placeholder="Describe appearance" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attitude</label>
            <Input placeholder="Describe attitude" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Behavior</label>
            <Input placeholder="Describe behavior" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speech</label>
            <Input placeholder="Describe speech" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Affect</label>
            <Input placeholder="Describe affect" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thought Process</label>
            <Input placeholder="Describe thought process" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perception</label>
            <Input placeholder="Describe perception" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
            <Input placeholder="Describe orientation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Memory/Concentration</label>
            <Input placeholder="Describe memory/concentration" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insight/Judgement</label>
            <Input placeholder="Describe insight/judgement" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
            <Input placeholder="Describe mood" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Substance Abuse Risk</label>
            <Input placeholder="Describe risk" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suicidal Ideation</label>
            <Input placeholder="Describe ideation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homicidal Ideation</label>
            <Input placeholder="Describe ideation" />
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
