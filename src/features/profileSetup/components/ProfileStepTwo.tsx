
import React from 'react';
import { Form } from '@/components/ui/form';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { DateField } from '@/components/ui/DateField';
import { timezoneOptions } from '@/utils/timezoneOptions';
import { ProfileStepProps } from '../types';

const ProfileStepTwo: React.FC<ProfileStepProps> = ({ form }) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateField
            control={form.control}
            name="client_date_of_birth"
            label="Date of Birth"
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_gender"
            label="Birth Gender"
            type="select"
            options={["Male", "Female"]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_gender_identity"
            label="Gender Identity"
            type="select"
            options={["Male", "Female", "Other"]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_state"
            label="State of Primary Residence"
            type="select"
            options={[
              "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
              "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
              "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
              "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", 
              "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
              "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", 
              "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
              "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", 
              "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
              "Wisconsin", "Wyoming"
            ]}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_time_zone"
            label="Your Time Zone"
            type="select"
            options={timezoneOptions}
            required={true}
          />
          
          <FormFieldWrapper
            control={form.control}
            name="client_vacoverage"
            label="VA Coverage"
            type="select"
            options={[
              "CHAMPVA", 
              "TRICARE", 
              "VA Community Care Network", 
              "None - I am a veteran", 
              "None - I am not a veteran"
            ]}
            required={true}
          />
        </div>
      </div>
    </Form>
  );
};

export default ProfileStepTwo;
