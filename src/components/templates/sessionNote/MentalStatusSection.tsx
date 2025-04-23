
import React from 'react';
import { Input } from "@/components/ui/input";

interface MentalStatusSectionProps {
  formState: any;
  handleChange: (field: string, value: string) => void;
  fieldErrors?: Record<string, string>;
}

export const MentalStatusSection: React.FC<MentalStatusSectionProps> = ({
  formState,
  handleChange,
  fieldErrors = {}
}) => {
  const getInputClassName = (field: string) => {
    return fieldErrors[field] ? "border-red-500" : "";
  };

  return (
    <div className="mb-6 mt-6">
      <h4 className="text-md font-medium text-gray-800 mb-4">Mental Status Exam</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Appearance <span className="text-red-500">*</span>
          </label>
          <Input
            id="appearance"
            placeholder="Describe appearance"
            value={formState.appearance}
            onChange={(e) => handleChange('appearance', e.target.value)}
            className={getInputClassName('appearance')}
          />
          {fieldErrors.appearance && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.appearance}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attitude <span className="text-red-500">*</span>
          </label>
          <Input
            id="attitude"
            placeholder="Describe attitude"
            value={formState.attitude}
            onChange={(e) => handleChange('attitude', e.target.value)}
            className={getInputClassName('attitude')}
          />
          {fieldErrors.attitude && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.attitude}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Behavior <span className="text-red-500">*</span>
          </label>
          <Input
            id="behavior"
            placeholder="Describe behavior"
            value={formState.behavior}
            onChange={(e) => handleChange('behavior', e.target.value)}
            className={getInputClassName('behavior')}
          />
          {fieldErrors.behavior && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.behavior}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Speech <span className="text-red-500">*</span>
          </label>
          <Input
            id="speech"
            placeholder="Describe speech"
            value={formState.speech}
            onChange={(e) => handleChange('speech', e.target.value)}
            className={getInputClassName('speech')}
          />
          {fieldErrors.speech && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.speech}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Affect <span className="text-red-500">*</span>
          </label>
          <Input
            id="affect"
            placeholder="Describe affect"
            value={formState.affect}
            onChange={(e) => handleChange('affect', e.target.value)}
            className={getInputClassName('affect')}
          />
          {fieldErrors.affect && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.affect}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thought Process <span className="text-red-500">*</span>
          </label>
          <Input
            id="thoughtProcess"
            placeholder="Describe thought process"
            value={formState.thoughtProcess}
            onChange={(e) => handleChange('thoughtProcess', e.target.value)}
            className={getInputClassName('thoughtProcess')}
          />
          {fieldErrors.thoughtProcess && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.thoughtProcess}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Perception <span className="text-red-500">*</span>
          </label>
          <Input
            id="perception"
            placeholder="Describe perception"
            value={formState.perception}
            onChange={(e) => handleChange('perception', e.target.value)}
            className={getInputClassName('perception')}
          />
          {fieldErrors.perception && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.perception}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Orientation <span className="text-red-500">*</span>
          </label>
          <Input
            id="orientation"
            placeholder="Describe orientation"
            value={formState.orientation}
            onChange={(e) => handleChange('orientation', e.target.value)}
            className={getInputClassName('orientation')}
          />
          {fieldErrors.orientation && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.orientation}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Memory/Concentration <span className="text-red-500">*</span>
          </label>
          <Input
            id="memoryConcentration"
            placeholder="Describe memory/concentration"
            value={formState.memoryConcentration}
            onChange={(e) => handleChange('memoryConcentration', e.target.value)}
            className={getInputClassName('memoryConcentration')}
          />
          {fieldErrors.memoryConcentration && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.memoryConcentration}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Insight/Judgement <span className="text-red-500">*</span>
          </label>
          <Input
            id="insightJudgement"
            placeholder="Describe insight/judgement"
            value={formState.insightJudgement}
            onChange={(e) => handleChange('insightJudgement', e.target.value)}
            className={getInputClassName('insightJudgement')}
          />
          {fieldErrors.insightJudgement && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.insightJudgement}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mood <span className="text-red-500">*</span>
          </label>
          <Input
            id="mood"
            placeholder="Describe mood"
            value={formState.mood}
            onChange={(e) => handleChange('mood', e.target.value)}
            className={getInputClassName('mood')}
          />
          {fieldErrors.mood && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.mood}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Substance Abuse Risk <span className="text-red-500">*</span>
          </label>
          <Input
            id="substanceAbuseRisk"
            placeholder="Describe substance abuse risk"
            value={formState.substanceAbuseRisk}
            onChange={(e) => handleChange('substanceAbuseRisk', e.target.value)}
            className={getInputClassName('substanceAbuseRisk')}
          />
          {fieldErrors.substanceAbuseRisk && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.substanceAbuseRisk}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Suicidal Ideation <span className="text-red-500">*</span>
          </label>
          <Input
            id="suicidalIdeation"
            placeholder="Describe suicidal ideation"
            value={formState.suicidalIdeation}
            onChange={(e) => handleChange('suicidalIdeation', e.target.value)}
            className={getInputClassName('suicidalIdeation')}
          />
          {fieldErrors.suicidalIdeation && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.suicidalIdeation}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Homicidal Ideation <span className="text-red-500">*</span>
          </label>
          <Input
            id="homicidalIdeation"
            placeholder="Describe homicidal ideation"
            value={formState.homicidalIdeation}
            onChange={(e) => handleChange('homicidalIdeation', e.target.value)}
            className={getInputClassName('homicidalIdeation')}
          />
          {fieldErrors.homicidalIdeation && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.homicidalIdeation}</p>
          )}
        </div>
      </div>
    </div>
  );
};
