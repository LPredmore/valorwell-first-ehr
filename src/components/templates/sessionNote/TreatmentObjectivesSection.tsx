
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TreatmentObjectivesSectionProps {
  formState: any;
  handleChange: (field: string, value: string) => void;
}

export const TreatmentObjectivesSection: React.FC<TreatmentObjectivesSectionProps> = ({
  formState,
  handleChange
}) => {
  // Check if an objective and its interventions have values
  const hasPrimaryObjective = !!formState.primaryObjective?.trim();
  const hasIntervention1 = !!formState.intervention1?.trim();
  const hasIntervention2 = !!formState.intervention2?.trim();
  
  const hasSecondaryObjective = !!formState.secondaryObjective?.trim();
  const hasIntervention3 = !!formState.intervention3?.trim();
  const hasIntervention4 = !!formState.intervention4?.trim();
  
  const hasTertiaryObjective = !!formState.tertiaryObjective?.trim();
  const hasIntervention5 = !!formState.intervention5?.trim();
  const hasIntervention6 = !!formState.intervention6?.trim();
  
  return (
    <>
      <h4 className="text-md font-medium text-gray-800 mb-4">Treatment Objectives & Interventions</h4>

      {/* Primary Objective Section */}
      {hasPrimaryObjective && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Objective</label>
          <Textarea
            placeholder="Describe the primary objective"
            className="min-h-[100px] bg-gray-100"
            value={formState.primaryObjective}
            onChange={(e) => handleChange('primaryObjective', e.target.value)}
            readOnly
          />
        </div>
      )}

      {/* Only show intervention fields if they have values */}
      {(hasIntervention1 || hasIntervention2) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {hasIntervention1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 1</label>
              <Input
                placeholder="Describe intervention"
                value={formState.intervention1}
                onChange={(e) => handleChange('intervention1', e.target.value)}
                readOnly
                className="bg-gray-100"
              />
            </div>
          )}
          {hasIntervention2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 2</label>
              <Input
                placeholder="Describe intervention"
                value={formState.intervention2}
                onChange={(e) => handleChange('intervention2', e.target.value)}
                readOnly
                className="bg-gray-100"
              />
            </div>
          )}
        </div>
      )}

      {/* Secondary Objective Section */}
      {hasSecondaryObjective && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Objective</label>
          <Textarea
            placeholder="Describe the secondary objective"
            className="min-h-[100px] bg-gray-100"
            value={formState.secondaryObjective}
            onChange={(e) => handleChange('secondaryObjective', e.target.value)}
            readOnly
          />
        </div>
      )}

      {/* Only show intervention fields if they have values */}
      {(hasIntervention3 || hasIntervention4) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {hasIntervention3 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 3</label>
              <Input
                placeholder="Describe intervention"
                value={formState.intervention3}
                onChange={(e) => handleChange('intervention3', e.target.value)}
                readOnly
                className="bg-gray-100"
              />
            </div>
          )}
          {hasIntervention4 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 4</label>
              <Input
                placeholder="Describe intervention"
                value={formState.intervention4}
                onChange={(e) => handleChange('intervention4', e.target.value)}
                readOnly
                className="bg-gray-100"
              />
            </div>
          )}
        </div>
      )}

      {/* Tertiary Objective Section */}
      {hasTertiaryObjective && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tertiary Objective</label>
          <Textarea
            placeholder="Describe the tertiary objective"
            className="min-h-[100px] bg-gray-100"
            value={formState.tertiaryObjective}
            onChange={(e) => handleChange('tertiaryObjective', e.target.value)}
            readOnly
          />
        </div>
      )}

      {/* Only show intervention fields if they have values */}
      {(hasIntervention5 || hasIntervention6) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {hasIntervention5 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 5</label>
              <Input
                placeholder="Describe intervention"
                value={formState.intervention5}
                onChange={(e) => handleChange('intervention5', e.target.value)}
                readOnly
                className="bg-gray-100"
              />
            </div>
          )}
          {hasIntervention6 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervention 6</label>
              <Input
                placeholder="Describe intervention"
                value={formState.intervention6}
                onChange={(e) => handleChange('intervention6', e.target.value)}
                readOnly
                className="bg-gray-100"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
