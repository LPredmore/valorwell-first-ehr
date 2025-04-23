
import React from 'react';
import { Input } from "@/components/ui/input";

interface TreatmentObjectivesSectionProps {
  formState: any;
  handleChange: (field: string, value: string) => void;
  fieldErrors?: Record<string, string>;
}

export const TreatmentObjectivesSection: React.FC<TreatmentObjectivesSectionProps> = ({
  formState,
  handleChange,
  fieldErrors = {}
}) => {
  const getInputClassName = (field: string) => {
    return fieldErrors[field] ? "border-red-500" : "";
  };

  return (
    <div className="mb-6 mt-6">
      <h4 className="text-md font-medium text-gray-800 mb-4">Treatment Objectives & Interventions</h4>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Primary Objective <span className="text-red-500">*</span>
        </label>
        <Input
          id="primaryObjective"
          placeholder="Enter primary objective"
          value={formState.primaryObjective}
          onChange={(e) => handleChange('primaryObjective', e.target.value)}
          className={getInputClassName('primaryObjective')}
        />
        {fieldErrors.primaryObjective && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.primaryObjective}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervention 1 <span className="text-red-500">*</span>
          </label>
          <Input
            id="intervention1"
            placeholder="Enter intervention"
            value={formState.intervention1}
            onChange={(e) => handleChange('intervention1', e.target.value)}
            className={getInputClassName('intervention1')}
          />
          {fieldErrors.intervention1 && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.intervention1}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervention 2 <span className="text-red-500">*</span>
          </label>
          <Input
            id="intervention2"
            placeholder="Enter intervention"
            value={formState.intervention2}
            onChange={(e) => handleChange('intervention2', e.target.value)}
            className={getInputClassName('intervention2')}
          />
          {fieldErrors.intervention2 && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.intervention2}</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Secondary Objective <span className="text-red-500">*</span>
        </label>
        <Input
          id="secondaryObjective"
          placeholder="Enter secondary objective"
          value={formState.secondaryObjective}
          onChange={(e) => handleChange('secondaryObjective', e.target.value)}
          className={getInputClassName('secondaryObjective')}
        />
        {fieldErrors.secondaryObjective && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.secondaryObjective}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervention 3 <span className="text-red-500">*</span>
          </label>
          <Input
            id="intervention3"
            placeholder="Enter intervention"
            value={formState.intervention3}
            onChange={(e) => handleChange('intervention3', e.target.value)}
            className={getInputClassName('intervention3')}
          />
          {fieldErrors.intervention3 && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.intervention3}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervention 4 <span className="text-red-500">*</span>
          </label>
          <Input
            id="intervention4"
            placeholder="Enter intervention"
            value={formState.intervention4}
            onChange={(e) => handleChange('intervention4', e.target.value)}
            className={getInputClassName('intervention4')}
          />
          {fieldErrors.intervention4 && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.intervention4}</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tertiary Objective <span className="text-red-500">*</span>
        </label>
        <Input
          id="tertiaryObjective"
          placeholder="Enter tertiary objective"
          value={formState.tertiaryObjective}
          onChange={(e) => handleChange('tertiaryObjective', e.target.value)}
          className={getInputClassName('tertiaryObjective')}
        />
        {fieldErrors.tertiaryObjective && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.tertiaryObjective}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervention 5 <span className="text-red-500">*</span>
          </label>
          <Input
            id="intervention5"
            placeholder="Enter intervention"
            value={formState.intervention5}
            onChange={(e) => handleChange('intervention5', e.target.value)}
            className={getInputClassName('intervention5')}
          />
          {fieldErrors.intervention5 && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.intervention5}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervention 6 <span className="text-red-500">*</span>
          </label>
          <Input
            id="intervention6"
            placeholder="Enter intervention"
            value={formState.intervention6}
            onChange={(e) => handleChange('intervention6', e.target.value)}
            className={getInputClassName('intervention6')}
          />
          {fieldErrors.intervention6 && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.intervention6}</p>
          )}
        </div>
      </div>
    </div>
  );
};
