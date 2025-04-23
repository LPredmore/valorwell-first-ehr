
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, FileText } from 'lucide-react';
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ClientInfoSection } from './sessionNote/ClientInfoSection';
import { MentalStatusSection } from './sessionNote/MentalStatusSection';
import { TreatmentObjectivesSection } from './sessionNote/TreatmentObjectivesSection';
import { SessionAssessmentSection } from './sessionNote/SessionAssessmentSection';
import { ClientDetails, SessionNoteTemplateProps } from '@/types/client';
import { useSessionNoteForm } from './sessionNote/useSessionNoteForm';

const SessionNoteTemplate: React.FC<SessionNoteTemplateProps> = ({
  onClose,
  appointment,
  clinicianName = '',
  clientData = null
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const {
    formState,
    isSubmitting,
    phq9Data,
    handleChange,
    handleSave,
    validationErrors,
    isFormValid
  } = useSessionNoteForm({
    clientData,
    clinicianName,
    appointment,
    onClose,
    contentRef
  });

  const hasProblemNarrative = !!formState.problemNarrative?.trim();
  const hasTreatmentGoalNarrative = !!formState.treatmentGoalNarrative?.trim();
  const showProblemTreatmentSection = hasProblemNarrative || hasTreatmentGoalNarrative;

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

      <div id="session-note-content" ref={contentRef} className="bg-white p-6 border rounded-md mt-4">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <FileText className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-medium">Therapy Session Note</h3>
        </div>

        <div>
          <ClientInfoSection 
            formState={formState} 
            handleChange={handleChange} 
          />
        </div>

        <div>
          <MentalStatusSection 
            formState={formState} 
            handleChange={handleChange} 
          />
        </div>
        
        {showProblemTreatmentSection && (
          <div className="mb-6 mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">Problem & Treatment Goals</h4>
            
            {hasProblemNarrative && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem Narrative</label>
                <Textarea
                  placeholder="Describe the problem narrative"
                  className="min-h-[100px] bg-gray-100 resize-y"
                  value={formState.problemNarrative}
                  onChange={(e) => handleChange('problemNarrative', e.target.value)}
                  readOnly
                />
              </div>
            )}

            {hasTreatmentGoalNarrative && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Goal Narrative</label>
                <Textarea
                  placeholder="Describe the treatment goals"
                  className="min-h-[100px] bg-gray-100 resize-y"
                  value={formState.treatmentGoalNarrative}
                  onChange={(e) => handleChange('treatmentGoalNarrative', e.target.value)}
                  readOnly
                />
              </div>
            )}
          </div>
        )}

        <div>
          <TreatmentObjectivesSection 
            formState={formState} 
            handleChange={handleChange} 
          />
        </div>

        <div>
          <SessionAssessmentSection 
            formState={formState} 
            handleChange={handleChange}
            phq9Data={phq9Data}
          />
        </div>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <ul className="list-disc pl-4">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Close
        </Button>
        <Button
          className="bg-valorwell-700 hover:bg-valorwell-800"
          onClick={handleSave}
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? 'Saving...' : 'Save Session Note'}
        </Button>
      </div>
    </div>
  );
};

export default SessionNoteTemplate;
