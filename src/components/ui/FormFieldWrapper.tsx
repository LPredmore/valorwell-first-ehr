
import React, { useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormFieldWrapperProps {
  control: any;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'select';
  options?: string[];
  readOnly?: boolean;
  valueMapper?: (label: string) => string;
  labelMapper?: (value: string) => string;
  maxLength?: number;
  required?: boolean;
}

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  control,
  name,
  label,
  type = 'text',
  options = [],
  readOnly = false,
  valueMapper,
  labelMapper,
  maxLength,
  required = false
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Removed console logging for performance improvement
        
        const handleSelectChange = (selectedValue: string) => {
          // If a valueMapper is provided, map the selected option label to its actual value
          const valueToStore = valueMapper ? valueMapper(selectedValue) : selectedValue;
          field.onChange(valueToStore);
        };

        // If a labelMapper is provided and we have a value, map the value to a display label
        const displayValue = (labelMapper && field.value) ? labelMapper(field.value) : field.value;
        
        return (
          <FormItem>
            <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
            <FormControl>
              {type === 'select' ? (
                <Select
                  onValueChange={handleSelectChange}
                  value={displayValue || ''}
                  disabled={readOnly}
                  required={required}
                >
                  <SelectTrigger className={readOnly ? "bg-gray-100" : ""}>
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  {...field}
                  type={type}
                  readOnly={readOnly}
                  className={readOnly ? "bg-gray-100" : ""}
                  maxLength={maxLength}
                  required={required}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default FormFieldWrapper;
