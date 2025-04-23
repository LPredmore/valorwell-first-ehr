import React from 'react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AppearanceEnum,
  AttitudeEnum,
  BehaviorEnum,
  SpeechEnum,
  AffectEnum,
  ThoughtProcessEnum,
  PerceptionEnum,
  OrientationEnum,
  MemoryConcentrationEnum,
  InsightJudgementEnum,
  MoodEnum,
  SubstanceAbuseRiskEnum,
  SuicidalIdeationEnum,
  HomicidalIdeationEnum
} from "@/types/sessionNoteEnums";

interface MentalStatusSectionProps {
  formState: any;
  handleChange: (field: string, value: string) => void;
  editModes?: any;
  toggleEditMode?: (field: string, value: string) => void;
}

export const MentalStatusSection: React.FC<MentalStatusSectionProps> = ({
  formState,
  handleChange,
  editModes,
  toggleEditMode
}) => {
  // Helper to build enum dropdowns
  const renderEnumOptions = (enumObj: object) =>
    Object.values(enumObj).map((val) => (
      <SelectItem value={val} key={val}>{val}</SelectItem>
    ));

  return (
    <>
      <h4 className="text-md font-medium text-gray-800 mb-4">Mental Status Examination</h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Appearance</label>
          <Select
            value={formState.appearance}
            onValueChange={(value) => handleChange('appearance', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select appearance" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(AppearanceEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attitude</label>
          <Select
            value={formState.attitude}
            onValueChange={(value) => handleChange('attitude', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select attitude" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(AttitudeEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Behavior</label>
          <Select
            value={formState.behavior}
            onValueChange={(value) => handleChange('behavior', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select behavior" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(BehaviorEnum)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Speech</label>
          <Select
            value={formState.speech}
            onValueChange={(value) => handleChange('speech', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select speech" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(SpeechEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Affect</label>
          <Select
            value={formState.affect}
            onValueChange={(value) => handleChange('affect', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select affect" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(AffectEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thought Process</label>
          <Select
            value={formState.thoughtProcess}
            onValueChange={(value) => handleChange('thoughtProcess', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select thought process" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(ThoughtProcessEnum)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Perception</label>
          <Select
            value={formState.perception}
            onValueChange={(value) => handleChange('perception', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select perception" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(PerceptionEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
          <Select
            value={formState.orientation}
            onValueChange={(value) => handleChange('orientation', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(OrientationEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Memory/Concentration</label>
          <Select
            value={formState.memoryConcentration}
            onValueChange={(value) => handleChange('memoryConcentration', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select memory/concentration" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(MemoryConcentrationEnum)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Insight/Judgement</label>
          <Select
            value={formState.insightJudgement}
            onValueChange={(value) => handleChange('insightJudgement', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select insight/judgement" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(InsightJudgementEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
          <Select
            value={formState.mood}
            onValueChange={(value) => handleChange('mood', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(MoodEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Substance Abuse Risk</label>
          <Select
            value={formState.substanceAbuseRisk}
            onValueChange={(value) => handleChange('substanceAbuseRisk', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select risk level" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(SubstanceAbuseRiskEnum)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Suicidal Ideation</label>
          <Select
            value={formState.suicidalIdeation}
            onValueChange={(value) => handleChange('suicidalIdeation', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ideation level" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(SuicidalIdeationEnum)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Homicidal Ideation</label>
          <Select
            value={formState.homicidalIdeation}
            onValueChange={(value) => handleChange('homicidalIdeation', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ideation level" />
            </SelectTrigger>
            <SelectContent>
              {renderEnumOptions(HomicidalIdeationEnum)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
};

// Note: This file is now quite long. Consider refactoring it into smaller components in the future!
