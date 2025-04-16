
import React from 'react';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxFieldProps {
  control: any;
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  control,
  name,
  label,
  required = false,
  disabled = false
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              required={required}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <label
              htmlFor={name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        </FormItem>
      )}
    />
  );
};

export default CheckboxField;
