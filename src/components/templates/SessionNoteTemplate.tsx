
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, FileText } from 'lucide-react';
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ClientInfoSection } from './sessionNote/ClientInfoSection';
import { MentalStatusSection } from './sessionNote/MentalStatusSection';
import { TreatmentObjectivesSection } from './sessionNote/TreatmentObjectivesSection';
import { SessionAssessmentSection } from './sessionNote/SessionAssessmentSection';
import { PHQ9AssessmentSection } from './sessionNote/PHQ9AssessmentSection';
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
    fieldErrors
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

      <style jsx global>{`
        .error-shake {
          animation: error-shake 0.5s;
        }
        
        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        
        .required-field {
          position: relative;
        }
        
        .required-field::after {
          content: '*';
          color: red;
          position: absolute;
          right: -8px;
          top: 0;
        }
      `}</style>

      <div id="session-note-content" ref={contentRef} className="bg-white p-6 border rounded-md mt-4">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <FileText className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-medium">Therapy Session Note</h3>
        </div>

        <div>
          <ClientInfoSection 
            formState={formState} 
            handleChange={handleChange}
            fieldErrors={fieldErrors}
          />
        </div>

        <div>
          <MentalStatusSection 
            formState={formState} 
            handleChange={handleChange}
            fieldErrors={fieldErrors}
          />
        </div>
        
        {showProblemTreatmentSection && (
          <div className="mb-6 mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">Problem & Treatment Goals</h4>
            
            {hasProblemNarrative && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Narrative
                  {fieldErrors?.problemNarrative && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  id="problemNarrative"
                  placeholder="Describe the problem narrative"
                  className={`min-h-[100px] bg-gray-100 resize-y ${fieldErrors?.problemNarrative ? 'border-red-500' : ''}`}
                  value={formState.problemNarrative}
                  onChange={(e) => handleChange('problemNarrative', e.target.value)}
                  readOnly
                />
                {fieldErrors?.problemNarrative && (
                  <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.problemNarrative}</p>
                )}
              </div>
            )}

            {hasTreatmentGoalNarrative && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Goal Narrative
                  {fieldErrors?.treatmentGoalNarrative && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  id="treatmentGoalNarrative"
                  placeholder="Describe the treatment goals"
                  className={`min-h-[100px] bg-gray-100 resize-y ${fieldErrors?.treatmentGoalNarrative ? 'border-red-500' : ''}`}
                  value={formState.treatmentGoalNarrative}
                  onChange={(e) => handleChange('treatmentGoalNarrative', e.target.value)}
                  readOnly
                />
                {fieldErrors?.treatmentGoalNarrative && (
                  <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.treatmentGoalNarrative}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <TreatmentObjectivesSection 
            formState={formState} 
            handleChange={handleChange}
            fieldErrors={fieldErrors}
          />
        </div>

        <div>
          <SessionAssessmentSection 
            formState={formState} 
            handleChange={handleChange}
            phq9Data={phq9Data}
            fieldErrors={fieldErrors}
          />
        </div>

        {phq9Data && (
          <PHQ9AssessmentSection phq9Data={phq9Data} />
        )}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Session Note'}
        </Button>
      </div>
    </div>
  );
};

export default SessionNoteTemplate;
