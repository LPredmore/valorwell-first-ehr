
import React from 'react';
import { Input } from "@/components/ui/input";
import { DiagnosisSelector } from "@/components/DiagnosisSelector";

interface ClientInfoSectionProps {
  formState: any;
  handleChange: (field: string, value: string | string[]) => void;
  fieldErrors?: Record<string, string>;
}

export const ClientInfoSection: React.FC<ClientInfoSectionProps> = ({
  formState,
  handleChange,
  fieldErrors = {}
}) => {
  // Convert string diagnosis to array if needed for DiagnosisSelector
  const diagnosisArray = formState.diagnosis ? 
    (typeof formState.diagnosis === 'string' ? 
      formState.diagnosis.split(',').map((d: string) => d.trim()).filter(Boolean) : 
      formState.diagnosis) : 
    [];
  
  const isDiagnosisEmpty = !diagnosisArray.length;

  const getInputClassName = (field: string) => {
    const baseClass = "bg-gray-100";
    return fieldErrors[field] ? `${baseClass} border-red-500` : baseClass;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patient Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="patientName"
            placeholder="Enter patient name"
            value={formState.patientName}
            onChange={(e) => handleChange('patientName', e.target.value)}
            readOnly
            className={getInputClassName('patientName')}
          />
          {fieldErrors.patientName && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.patientName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patient DOB <span className="text-red-500">*</span>
          </label>
          <Input
            id="patientDOB"
            placeholder="MM/DD/YYYY"
            value={formState.patientDOB}
            onChange={(e) => handleChange('patientDOB', e.target.value)}
            readOnly
            className={getInputClassName('patientDOB')}
          />
          {fieldErrors.patientDOB && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.patientDOB}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clinician Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="clinicianName"
            placeholder="Enter clinician name"
            value={formState.clinicianName}
            onChange={(e) => handleChange('clinicianName', e.target.value)}
            readOnly
            className={getInputClassName('clinicianName')}
          />
          {fieldErrors.clinicianName && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.clinicianName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis <span className="text-red-500">*</span>
          </label>
          {isDiagnosisEmpty ? (
            <div>
              <DiagnosisSelector 
                value={diagnosisArray}
                onChange={(value) => handleChange('diagnosis', value)}
              />
              {fieldErrors.diagnosis && (
                <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.diagnosis}</p>
              )}
            </div>
          ) : (
            <div>
              <Input
                id="diagnosis"
                placeholder="Select diagnosis code"
                value={formState.diagnosis}
                readOnly
                className={getInputClassName('diagnosis')}
              />
              {fieldErrors.diagnosis && (
                <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.diagnosis}</p>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan Type <span className="text-red-500">*</span>
          </label>
          <Input
            id="planType"
            placeholder="Select plan length"
            value={formState.planType}
            onChange={(e) => handleChange('planType', e.target.value)}
            readOnly
            className={getInputClassName('planType')}
          />
          {fieldErrors.planType && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.planType}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Treatment Frequency <span className="text-red-500">*</span>
          </label>
          <Input
            id="treatmentFrequency"
            placeholder="Select frequency"
            value={formState.treatmentFrequency}
            onChange={(e) => handleChange('treatmentFrequency', e.target.value)}
            readOnly
            className={getInputClassName('treatmentFrequency')}
          />
          {fieldErrors.treatmentFrequency && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.treatmentFrequency}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="sessionDate"
            type="date"
            value={formState.sessionDate}
            onChange={(e) => handleChange('sessionDate', e.target.value)}
            placeholder="Select date"
            readOnly
            className={getInputClassName('sessionDate')}
          />
          {fieldErrors.sessionDate && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.sessionDate}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medications <span className="text-red-500">*</span>
          </label>
          <Input
            id="medications"
            placeholder="List current medications"
            value={formState.medications}
            onChange={(e) => handleChange('medications', e.target.value)}
            className={fieldErrors.medications ? "border-red-500" : ""}
          />
          {fieldErrors.medications && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.medications}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Type <span className="text-red-500">*</span>
          </label>
          <Input
            id="sessionType"
            placeholder="Enter session type"
            value={formState.sessionType}
            onChange={(e) => handleChange('sessionType', e.target.value)}
            className={fieldErrors.sessionType ? "border-red-500" : ""}
          />
          {fieldErrors.sessionType && (
            <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.sessionType}</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Person's in Attendance <span className="text-red-500">*</span>
        </label>
        <Input
          id="personsInAttendance"
          placeholder="List all attendees"
          value={formState.personsInAttendance}
          onChange={(e) => handleChange('personsInAttendance', e.target.value)}
          className={fieldErrors.personsInAttendance ? "border-red-500" : ""}
        />
        {fieldErrors.personsInAttendance && (
          <p className="text-sm font-medium text-red-500 mt-1">{fieldErrors.personsInAttendance}</p>
        )}
      </div>
    </>
  );
};
