import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { PHQ9AssessmentSection } from './PHQ9AssessmentSection';
import {
  SubstanceAbuseRiskEnum,
  SuicidalIdeationEnum,
  HomicidalIdeationEnum
} from '@/packages/core/types/sessionNote/assessment';

interface SessionAssessmentSectionProps {
  formState: any;
  handleChange: (field: string, value: string) => void;
  phq9Data?: any;
}

export const SessionAssessmentSection: React.FC<SessionAssessmentSectionProps> = ({
  formState,
  handleChange,
  phq9Data
}) => {
  // Options for the dropdown menus
  const functioningOptions = [
    "Excellent - Fully capable in all areas of life",
    "Good - Managing well with minimal impairment",
    "Satisfactory - Some challenges but maintaining essential functions",
    "Fair - Moderate impairment in one or more areas",
    "Limited - Significant impairment in multiple areas",
    "Poor - Severe impairment in daily functioning",
    "Very poor - Unable to function independently in most areas",
    "Crisis - Immediate intervention needed"
  ];

  const prognosisOptions = [
    "Excellent - Highly likely to achieve all treatment goals",
    "Very Good - Strong likelihood of achieving most treatment goals",
    "Good - Likely to achieve primary treatment goals",
    "Fair - May achieve some treatment goals with consistent effort",
    "Guarded - Limited expectation of achieving treatment goals",
    "Poor - Significant barriers to achieving treatment goals",
    "Uncertain - Unable to determine likelihood at this time"
  ];

  const progressOptions = [
    "Exceptional - Exceeding expectations in all goal areas",
    "Substantial - Significant improvement toward most goals",
    "Steady - Consistent improvement at expected pace",
    "Moderate - Some improvement in key areas",
    "Minimal - Slight improvements noted",
    "Fluctuating - Inconsistent progress with periods of improvement and regression",
    "Stalled - No significant changes since last assessment",
    "Early stage - Too early in treatment to evaluate progress",
    "Regression - Decline in functioning or symptoms worsening"
  ];

  return (
    <>
      <h4 className="text-md font-medium text-gray-800 mb-4">Session Assessment</h4>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Symptoms</label>
        <Textarea
          placeholder="Describe current symptoms"
          className="min-h-[100px] resize-y"
          value={formState.currentSymptoms}
          onChange={(e) => handleChange('currentSymptoms', e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Functioning</label>
        <Select 
          value={formState.functioning || ""}
          onValueChange={(value) => handleChange('functioning', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select client's level of functioning" />
          </SelectTrigger>
          <SelectContent>
            {functioningOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Prognosis</label>
        <Select 
          value={formState.prognosis || ""}
          onValueChange={(value) => handleChange('prognosis', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select client's prognosis" />
          </SelectTrigger>
          <SelectContent>
            {prognosisOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
        <Select 
          value={formState.progress || ""}
          onValueChange={(value) => handleChange('progress', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select client's progress level" />
          </SelectTrigger>
          <SelectContent>
            {progressOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Session Narrative</label>
        <Textarea
          placeholder="Provide a detailed narrative of the session"
          className="min-h-[100px] resize-y"
          value={formState.sessionNarrative}
          onChange={(e) => handleChange('sessionNarrative', e.target.value)}
        />
      </div>
      
      {/* PHQ-9 Assessment Section - Now positioned right before the Plan & Signature */}
      {phq9Data && <PHQ9AssessmentSection phq9Data={phq9Data} />}

      <h4 className="text-md font-medium text-gray-800 mb-4">Plan & Signature</h4>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Next Treatment Plan Update</label>
        <Input
          placeholder="When will this plan be reviewed next"
          value={formState.nextTreatmentPlanUpdate}
          onChange={(e) => handleChange('nextTreatmentPlanUpdate', e.target.value)}
          readOnly
          className="bg-gray-100"
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

      {/* Private Note Field - Add private-note-container class for PDF exclusion */}
      <div className="mb-6 private-note-container">
        <label className="block text-sm font-medium text-gray-700 mb-1">Private Note</label>
        <Textarea
          placeholder="Add a private note that only clinicians can see"
          className="min-h-[100px] resize-y"
          value={formState.privateNote}
          onChange={(e) => handleChange('privateNote', e.target.value)}
        />
      </div>
    </>
  );
};
