import React from 'react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
              <SelectItem value="Normal Appearance & Grooming">Normal Appearance & Grooming</SelectItem>
              <SelectItem value="Disheveled">Disheveled</SelectItem>
              <SelectItem value="Poor Hygiene">Poor Hygiene</SelectItem>
              <SelectItem value="Inappropriately Dressed">Inappropriately Dressed</SelectItem>
              <SelectItem value="Eccentric Appearance">Eccentric Appearance</SelectItem>
              <SelectItem value="Well-Groomed but Tense">Well-Groomed but Tense</SelectItem>
              <SelectItem value="Meticulously Groomed">Meticulously Groomed</SelectItem>
              <SelectItem value="Age-Inappropriate Appearance">Age-Inappropriate Appearance</SelectItem>
              <SelectItem value="Unusual Clothing or Adornments">Unusual Clothing or Adornments</SelectItem>
              <SelectItem value="Appears Older/Younger Than Stated Age">Appears Older/Younger Than Stated Age</SelectItem>
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
              <SelectItem value="Calm & Cooperative">Calm & Cooperative</SelectItem>
              <SelectItem value="Uncooperative">Uncooperative</SelectItem>
              <SelectItem value="Guarded">Guarded</SelectItem>
              <SelectItem value="Suspicious">Suspicious</SelectItem>
              <SelectItem value="Hostile">Hostile</SelectItem>
              <SelectItem value="Defensive">Defensive</SelectItem>
              <SelectItem value="Apathetic">Apathetic</SelectItem>
              <SelectItem value="Evasive">Evasive</SelectItem>
              <SelectItem value="Irritable">Irritable</SelectItem>
              <SelectItem value="Engaging">Engaging</SelectItem>
              <SelectItem value="Friendly">Friendly</SelectItem>
              <SelectItem value="Withdrawn">Withdrawn</SelectItem>
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
              <SelectItem value="No unusual behavior or psychomotor changes">No unusual behavior or psychomotor changes</SelectItem>
              <SelectItem value="Psychomotor Agitation">Psychomotor Agitation</SelectItem>
              <SelectItem value="Psychomotor Retardation">Psychomotor Retardation</SelectItem>
              <SelectItem value="Restlessness">Restlessness</SelectItem>
              <SelectItem value="Hyperactive">Hyperactive</SelectItem>
              <SelectItem value="Compulsive Behaviors">Compulsive Behaviors</SelectItem>
              <SelectItem value="Catatonic Features">Catatonic Features</SelectItem>
              <SelectItem value="Impulsive">Impulsive</SelectItem>
              <SelectItem value="Disorganized">Disorganized</SelectItem>
              <SelectItem value="Aggressive">Aggressive</SelectItem>
              <SelectItem value="Socially Inappropriate">Socially Inappropriate</SelectItem>
              <SelectItem value="Tremulous">Tremulous</SelectItem>
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
              <SelectItem value="Normal rate/tone/volume w/out pressure">Normal rate/tone/volume w/out pressure</SelectItem>
              <SelectItem value="Pressured Speech">Pressured Speech</SelectItem>
              <SelectItem value="Monotone">Monotone</SelectItem>
              <SelectItem value="Loud">Loud</SelectItem>
              <SelectItem value="Soft/Quiet">Soft/Quiet</SelectItem>
              <SelectItem value="Rapid">Rapid</SelectItem>
              <SelectItem value="Slow">Slow</SelectItem>
              <SelectItem value="Slurred">Slurred</SelectItem>
              <SelectItem value="Mumbled">Mumbled</SelectItem>
              <SelectItem value="Tangential">Tangential</SelectItem>
              <SelectItem value="Circumstantial">Circumstantial</SelectItem>
              <SelectItem value="Incoherent">Incoherent</SelectItem>
              <SelectItem value="Poverty of Speech">Poverty of Speech</SelectItem>
              <SelectItem value="Stuttering">Stuttering</SelectItem>
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
              <SelectItem value="Normal range/congruent">Normal range/congruent</SelectItem>
              <SelectItem value="Blunted">Blunted</SelectItem>
              <SelectItem value="Flat">Flat</SelectItem>
              <SelectItem value="Labile">Labile</SelectItem>
              <SelectItem value="Constricted">Constricted</SelectItem>
              <SelectItem value="Expansive">Expansive</SelectItem>
              <SelectItem value="Incongruent with Content">Incongruent with Content</SelectItem>
              <SelectItem value="Inappropriate">Inappropriate</SelectItem>
              <SelectItem value="Anxious">Anxious</SelectItem>
              <SelectItem value="Dysphoric">Dysphoric</SelectItem>
              <SelectItem value="Euphoric">Euphoric</SelectItem>
              <SelectItem value="Irritable">Irritable</SelectItem>
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
              <SelectItem value="Goal Oriented/Directed">Goal Oriented/Directed</SelectItem>
              <SelectItem value="Tangential">Tangential</SelectItem>
              <SelectItem value="Circumstantial">Circumstantial</SelectItem>
              <SelectItem value="Flight of Ideas">Flight of Ideas</SelectItem>
              <SelectItem value="Loose Associations">Loose Associations</SelectItem>
              <SelectItem value="Perseverative">Perseverative</SelectItem>
              <SelectItem value="Blocking">Blocking</SelectItem>
              <SelectItem value="Derailment">Derailment</SelectItem>
              <SelectItem value="Concrete">Concrete</SelectItem>
              <SelectItem value="Abstract">Abstract</SelectItem>
              <SelectItem value="Poverty of Thought">Poverty of Thought</SelectItem>
              <SelectItem value="Racing Thoughts">Racing Thoughts</SelectItem>
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
              <SelectItem value="No Hallucinations or Delusions">No Hallucinations or Delusions</SelectItem>
              <SelectItem value="Auditory Hallucinations">Auditory Hallucinations</SelectItem>
              <SelectItem value="Visual Hallucinations">Visual Hallucinations</SelectItem>
              <SelectItem value="Tactile Hallucinations">Tactile Hallucinations</SelectItem>
              <SelectItem value="Olfactory Hallucinations">Olfactory Hallucinations</SelectItem>
              <SelectItem value="Gustatory Hallucinations">Gustatory Hallucinations</SelectItem>
              <SelectItem value="Illusions">Illusions</SelectItem>
              <SelectItem value="Ideas of Reference">Ideas of Reference</SelectItem>
              <SelectItem value="Paranoid Ideation">Paranoid Ideation</SelectItem>
              <SelectItem value="Grandiose Ideation">Grandiose Ideation</SelectItem>
              <SelectItem value="Somatic Delusions">Somatic Delusions</SelectItem>
              <SelectItem value="Derealization">Derealization</SelectItem>
              <SelectItem value="Depersonalization">Depersonalization</SelectItem>
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
              <SelectItem value="Oriented x3">Oriented x3</SelectItem>
              <SelectItem value="Oriented x2">Oriented x2</SelectItem>
              <SelectItem value="Oriented x1">Oriented x1</SelectItem>
              <SelectItem value="Disoriented to Person">Disoriented to Person</SelectItem>
              <SelectItem value="Disoriented to Place">Disoriented to Place</SelectItem>
              <SelectItem value="Disoriented to Time">Disoriented to Time</SelectItem>
              <SelectItem value="Fully Disoriented">Fully Disoriented</SelectItem>
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
              <SelectItem value="Short & Long Term Intact">Short & Long Term Intact</SelectItem>
              <SelectItem value="Short-Term Memory Impaired">Short-Term Memory Impaired</SelectItem>
              <SelectItem value="Long-Term Memory Impaired">Long-Term Memory Impaired</SelectItem>
              <SelectItem value="Both Short and Long-Term Impaired">Both Short and Long-Term Impaired</SelectItem>
              <SelectItem value="Concentration Difficulty">Concentration Difficulty</SelectItem>
              <SelectItem value="Easily Distracted">Easily Distracted</SelectItem>
              <SelectItem value="Unable to Focus">Unable to Focus</SelectItem>
              <SelectItem value="Confabulation Present">Confabulation Present</SelectItem>
              <SelectItem value="Memory Gaps">Memory Gaps</SelectItem>
              <SelectItem value="Selective Memory">Selective Memory</SelectItem>
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
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Fair">Fair</SelectItem>
              <SelectItem value="Poor">Poor</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
              <SelectItem value="Limited">Limited</SelectItem>
              <SelectItem value="Impaired">Impaired</SelectItem>
              <SelectItem value="Inconsistent">Inconsistent</SelectItem>
              <SelectItem value="Distorted">Distorted</SelectItem>
              <SelectItem value="Developing">Developing</SelectItem>
              <SelectItem value="Improved">Improved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
          <Input
            placeholder="Describe mood"
            value={formState.mood}
            onChange={(e) => handleChange('mood', e.target.value)}
          />
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
          <Select
            value={formState.suicidalIdeation}
            onValueChange={(value) => handleChange('suicidalIdeation', value)}
          >
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
          <Select
            value={formState.homicidalIdeation}
            onValueChange={(value) => handleChange('homicidalIdeation', value)}
          >
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
    </>
  );
};
