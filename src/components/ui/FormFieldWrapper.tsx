
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface FormFieldWrapperProps {
  control: any;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'select' | 'date';
  options?: (string | SelectOption)[];
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
        // Removed console.log for performance improvement
        
        const handleSelectChange = (selectedValue: string) => {
          const valueToStore = valueMapper ? valueMapper(selectedValue) : selectedValue;
          field.onChange(valueToStore);
        };

        // Handle date field type conversion
        const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.value) {
            // Convert string date to Date object for validation
            const dateValue = new Date(e.target.value);
            field.onChange(dateValue);
          } else {
            field.onChange(null);
          }
        };

        const displayValue = labelMapper && field.value ? labelMapper(field.value) : field.value;

        const renderSelectOption = (option: string | SelectOption) => {
          if (typeof option === 'string') {
            return (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            );
          }
          return (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          );
        };
        
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
                    {options.map(renderSelectOption)}
                  </SelectContent>
                </Select>
              ) : type === 'date' ? (
                <Input
                  {...field}
                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                  onChange={handleDateChange}
                  type="date"
                  readOnly={readOnly}
                  className={readOnly ? "bg-gray-100" : ""}
                  required={required}
                />
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
