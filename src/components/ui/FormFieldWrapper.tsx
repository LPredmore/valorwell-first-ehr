
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormFieldWrapperProps {
  control: any;
  name: string;
  label: string;
  readOnly?: boolean;
  options?: string[];
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select';
  required?: boolean;
  className?: string;
}

/**
 * A wrapper component for form fields that ensures consistent IDs and names
 * for all form elements, fixing the console warning about missing attributes.
 */
const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  control,
  name,
  label,
  readOnly = false,
  options = [],
  placeholder = "",
  type = "text",
  required = false,
  className = "",
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            {type === 'select' ? (
              <Select
                disabled={readOnly}
                value={field.value || ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger 
                  id={`field-${name}`}
                  name={name}
                  className={readOnly ? "bg-gray-100" : ""}
                >
                  <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                {...field}
                id={`field-${name}`}
                name={name}
                type={type}
                readOnly={readOnly}
                placeholder={placeholder}
                value={field.value || ""}
                className={readOnly ? "bg-gray-100" : ""}
              />
            )}
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default FormFieldWrapper;
