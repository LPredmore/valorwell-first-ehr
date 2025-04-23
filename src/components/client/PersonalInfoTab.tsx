import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { InsuranceSection } from "@/components/ui/InsuranceSection";
import { ClientDetails } from '@/packages/core/types/client/details';
import { relationshipOptions, InsuranceType, insuranceTypeOptions } from '@/packages/core/types/client/options';
import { DiagnosisSelector } from '@/components/DiagnosisSelector';

interface PersonalInfoTabProps {
  formData: ClientDetails;
  handleInputChange: (field: string, value: string | string[]) => void;
  isProfileComplete: boolean;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ 
  formData, 
  handleInputChange,
  isProfileComplete
}) => {
  const [minorStatus, setMinorStatus] = useState(formData.client_minor === 'true');

  useEffect(() => {
    handleInputChange('client_minor', String(minorStatus));
  }, [minorStatus, handleInputChange]);

  const handleRemoveDiagnosis = (diagnosisToRemove: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    const updatedDiagnoses = formData.client_diagnosis?.filter(
      (diagnosis) => diagnosis !== diagnosisToRemove
    ) || [];
    handleInputChange('client_diagnosis', updatedDiagnoses);
  };

  return (
    <div className="grid gap-4">
      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_first_name">First Name</Label>
          <Input
            type="text"
            id="client_first_name"
            value={formData.client_first_name || ''}
            onChange={(e) => handleInputChange('client_first_name', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="client_last_name">Last Name</Label>
          <Input
            type="text"
            id="client_last_name"
            value={formData.client_last_name || ''}
            onChange={(e) => handleInputChange('client_last_name', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_date_of_birth">Date of Birth</Label>
          <DatePicker
            id="client_date_of_birth"
            selectedDate={formData.client_date_of_birth ? new Date(formData.client_date_of_birth) : undefined}
            onChange={(date: Date | undefined) => {
              if (date) {
                handleInputChange('client_date_of_birth', date.toISOString());
              }
            }}
          />
        </div>
        <div>
          <Label htmlFor="client_email">Email</Label>
          <Input
            type="email"
            id="client_email"
            value={formData.client_email || ''}
            onChange={(e) => handleInputChange('client_email', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_phone">Phone Number</Label>
          <Input
            type="tel"
            id="client_phone"
            value={formData.client_phone || ''}
            onChange={(e) => handleInputChange('client_phone', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="client_address">Address</Label>
          <Input
            type="text"
            id="client_address"
            value={formData.client_address || ''}
            onChange={(e) => handleInputChange('client_address', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_city">City</Label>
          <Input
            type="text"
            id="client_city"
            value={formData.client_city || ''}
            onChange={(e) => handleInputChange('client_city', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="client_state">State</Label>
          <Input
            type="text"
            id="client_state"
            value={formData.client_state || ''}
            onChange={(e) => handleInputChange('client_state', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_zip">Zip Code</Label>
          <Input
            type="text"
            id="client_zip"
            value={formData.client_zip || ''}
            onChange={(e) => handleInputChange('client_zip', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="client_country">Country</Label>
          <Input
            type="text"
            id="client_country"
            value={formData.client_country || ''}
            onChange={(e) => handleInputChange('client_country', e.target.value)}
          />
        </div>
      </div>

      {/* Insurance Information */}
      <InsuranceSection
        formData={formData}
        handleInputChange={handleInputChange}
      />

      {/* Emergency Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_emergency_contact_name">Emergency Contact Name</Label>
          <Input
            type="text"
            id="client_emergency_contact_name"
            value={formData.client_emergency_contact_name || ''}
            onChange={(e) => handleInputChange('client_emergency_contact_name', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="client_emergency_contact_relationship">Emergency Contact Relationship</Label>
          <Input
            type="text"
            id="client_emergency_contact_relationship"
            value={formData.client_emergency_contact_relationship || ''}
            onChange={(e) => handleInputChange('client_emergency_contact_relationship', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_emergency_contact_phone">Emergency Contact Phone</Label>
          <Input
            type="tel"
            id="client_emergency_contact_phone"
            value={formData.client_emergency_contact_phone || ''}
            onChange={(e) => handleInputChange('client_emergency_contact_phone', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="client_preferred_contact_method">Preferred Contact Method</Label>
          <Input
            type="text"
            id="client_preferred_contact_method"
            value={formData.client_preferred_contact_method || ''}
            onChange={(e) => handleInputChange('client_preferred_contact_method', e.target.value)}
          />
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <Label htmlFor="client_additional_notes">Additional Notes</Label>
        <Textarea
          id="client_additional_notes"
          value={formData.client_additional_notes || ''}
          onChange={(e) => handleInputChange('client_additional_notes', e.target.value)}
        />
      </div>

      {/* Diagnosis */}
      <div>
        <Label>Diagnosis</Label>
        <DiagnosisSelector 
          value={formData.client_diagnosis || []}
          onChange={(value) => handleInputChange('client_diagnosis', value)}
        />
        {formData.client_diagnosis && formData.client_diagnosis.length > 0 && (
          <div className="mt-2">
            {formData.client_diagnosis.map((diagnosis) => (
              <div key={diagnosis} className="inline-flex items-center mr-2 mt-1 px-3 py-0.5 rounded-full text-sm font-medium bg-secondary">
                {diagnosis}
                <button
                  className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={handleRemoveDiagnosis(diagnosis) as any}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Minor Status */}
      <div>
        <Label className="inline-flex items-center space-x-2">
          <Checkbox
            id="client_minor"
            checked={minorStatus}
            onCheckedChange={(checked) => {
              setMinorStatus(!!checked);
            }}
          />
          <span>Is this client a minor?</span>
        </Label>
      </div>

      {/* Profile Completion Status */}
      <div>
        <Label className="inline-flex items-center space-x-2">
          <Checkbox
            id="client_is_profile_complete"
            checked={isProfileComplete}
            onCheckedChange={(checked) => {
              handleInputChange('client_is_profile_complete', String(checked));
            }}
          />
          <span>Is profile complete?</span>
        </Label>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
