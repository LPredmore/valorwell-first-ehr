
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface SessionAssessmentSectionProps {
  formState: any;
  handleChange: (field: string, value: string) => void;
}

export const SessionAssessmentSection: React.FC<SessionAssessmentSectionProps> = ({
  formState,
  handleChange
}) => {
  return (
    <>
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
    </>
  );
};
