
import React from 'react';
import CompleteFormFieldWrapper from './CompleteFormFieldWrapper';

interface SelectOption {
  value: string;
  label: string;
}

interface FormFieldWrapperProps {
  control: any;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'select' | 'date' | 'checkbox' | 'textarea';
  options?: (string | SelectOption)[];
  readOnly?: boolean;
  valueMapper?: (label: string) => string;
  labelMapper?: (value: string) => string;
  maxLength?: number;
  required?: boolean;
  helperText?: string;
}

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = (props) => {
  // This component now simply delegates to the CompleteFormFieldWrapper
  return <CompleteFormFieldWrapper {...props} />;
};

export default FormFieldWrapper;
