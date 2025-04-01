
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, FileText } from 'lucide-react';
import { ClientDetails, SessionNoteTemplateProps } from '@/types/client';
import { useSessionNoteForm } from './sessionNote/useSessionNoteForm';
import { ClientInfoSection } from './sessionNote/ClientInfoSection';
import { MentalStatusSection } from './sessionNote/MentalStatusSection';
import { TreatmentObjectivesSection } from './sessionNote/TreatmentObjectivesSection';
import { SessionAssessmentSection } from './sessionNote/SessionAssessmentSection';
import { PHQ9AssessmentSection } from './sessionNote/PHQ9AssessmentSection';
import { Textarea } from "@/components/ui/textarea";

const SessionNoteTemplate: React.FC<SessionNoteTemplateProps> = ({
  onClose,
  appointment,
  clinicianName = '',
  clientData = null
}) => {
  const {
    formState,
    editModes,
    isSubmitting,
    phq9Data,
    handleChange,
    toggleEditMode,
    handleSave
  } = useSessionNoteForm({
    clientData,
    clinicianName,
    appointment,
    onClose
  });

  // Check if problem and treatment goal narratives have values
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

      <div className="bg-white p-6 border rounded-md mt-4">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-medium">Therapy Session Note</h3>
        </div>

        {/* Client Information Section */}
        <ClientInfoSection 
          formState={formState} 
          handleChange={handleChange} 
        />

        {/* Mental Status Examination */}
        <MentalStatusSection 
          formState={formState} 
          editModes={editModes} 
          handleChange={handleChange} 
          toggleEditMode={toggleEditMode} 
        />
        
        {/* Problem Narrative and Treatment Goal - Only show if they have values */}
        {showProblemTreatmentSection && (
          <div className="mb-6 mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-4">Problem & Treatment Goals</h4>
            
            {hasProblemNarrative && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem Narrative</label>
                <Textarea
                  placeholder="Describe the problem narrative"
                  className="min-h-[100px] bg-gray-100"
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
                  className="min-h-[100px] bg-gray-100"
                  value={formState.treatmentGoalNarrative}
                  onChange={(e) => handleChange('treatmentGoalNarrative', e.target.value)}
                  readOnly
                />
              </div>
            )}
          </div>
        )}

        {/* Treatment Objectives & Interventions */}
        <TreatmentObjectivesSection 
          formState={formState} 
          handleChange={handleChange} 
        />

        {/* Session Assessment Section */}
        <SessionAssessmentSection 
          formState={formState} 
          handleChange={handleChange} 
        />
        
        {/* PHQ-9 Assessment Section - Moved right before Plan & Signature section */}
        {phq9Data && <PHQ9AssessmentSection phq9Data={phq9Data} />}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Close</Button>
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
