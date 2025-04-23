
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface SessionAssessmentSectionProps {
  formState: any;
  handleChange: (field: string, value: string) => void;
  phq9Data?: any;
  fieldErrors?: Record<string, string>;
}

export const SessionAssessmentSection: React.FC<SessionAssessmentSectionProps> = ({
  formState,
  handleChange,
  phq9Data,
  fieldErrors = {}
}) => {
  const getInputClassName = (field: string, baseClass: string = "") => {
    return fieldErrors[field] ? `${baseClass} border-red-500` : baseClass;
  };

  return (
    <div className="mb-6 mt-6">
      <h4 className="text-md font-medium text-gray-800 mb-4">Session Assessment</h4>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Symptoms <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="currentSymptoms"
          placeholder="Describe current symptoms"
          className={getInputClassName('currentSymptoms', "min-h-[100px] resize-y")}
          value={formState.currentSymptoms}
          onChange={(e) => handleChange('currentSymptoms', e.target.value)}
        />
        {fieldErrors.currentSymptoms && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.currentSymptoms}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Functioning <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="functioning"
          placeholder="Describe functioning"
          className={getInputClassName('functioning', "min-h-[100px] resize-y")}
          value={formState.functioning}
          onChange={(e) => handleChange('functioning', e.target.value)}
        />
        {fieldErrors.functioning && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.functioning}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prognosis <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="prognosis"
          placeholder="Describe prognosis"
          className={getInputClassName('prognosis', "min-h-[100px] resize-y")}
          value={formState.prognosis}
          onChange={(e) => handleChange('prognosis', e.target.value)}
        />
        {fieldErrors.prognosis && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.prognosis}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Progress <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="progress"
          placeholder="Describe progress"
          className={getInputClassName('progress', "min-h-[100px] resize-y")}
          value={formState.progress}
          onChange={(e) => handleChange('progress', e.target.value)}
        />
        {fieldErrors.progress && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.progress}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Session Narrative <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="sessionNarrative"
          placeholder="Describe session narrative"
          className={getInputClassName('sessionNarrative', "min-h-[200px] resize-y")}
          value={formState.sessionNarrative}
          onChange={(e) => handleChange('sessionNarrative', e.target.value)}
        />
        {fieldErrors.sessionNarrative && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.sessionNarrative}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Next Treatment Plan Update <span className="text-red-500">*</span>
        </label>
        <Input
          id="nextTreatmentPlanUpdate"
          placeholder="Specify next treatment plan update"
          className={getInputClassName('nextTreatmentPlanUpdate')}
          value={formState.nextTreatmentPlanUpdate}
          onChange={(e) => handleChange('nextTreatmentPlanUpdate', e.target.value)}
        />
        {fieldErrors.nextTreatmentPlanUpdate && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.nextTreatmentPlanUpdate}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Signature <span className="text-red-500">*</span>
        </label>
        <Input
          id="signature"
          placeholder="Enter your signature"
          className={getInputClassName('signature')}
          value={formState.signature}
          onChange={(e) => handleChange('signature', e.target.value)}
        />
        {fieldErrors.signature && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.signature}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Private Note (Optional)</label>
        <Textarea
          id="privateNote"
          placeholder="Add a private note (optional)"
          className="min-h-[100px] resize-y"
          value={formState.privateNote || ''}
          onChange={(e) => handleChange('privateNote', e.target.value)}
        />
      </div>
    </div>
  );
};
