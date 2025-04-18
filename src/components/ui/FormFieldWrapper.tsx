import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ensureIANATimeZone } from '@/utils/timeZoneUtils';

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
  required = false,
  helperText
}) => {
  // Special handling for time zone selection
  const isTimeZoneField = name === 'timeZone';
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const handleSelectChange = (selectedValue: string) => {
          // Handle time zone specific conversion
          if (isTimeZoneField) {
            // For time zones, ensure we're storing in IANA format
            const ianaValue = ensureIANATimeZone(selectedValue);
            field.onChange(ianaValue);
            return;
          }
          
          // For other fields, use the standard mapper if provided
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

        // Determine what value to display in the field
        let displayValue = field.value;
        
        // If it's a time zone field and we have a value, see if we need to convert from IANA to display format
        if (isTimeZoneField && field.value && field.value.includes('/')) {
          // Find the matching display name in the options array
          const matchingOption = options.find((opt) => {
            const optValue = typeof opt === 'string' ? opt : opt.value;
            const ianaValue = ensureIANATimeZone(optValue);
            return ianaValue === field.value;
          });
          
          if (matchingOption) {
            displayValue = typeof matchingOption === 'string' ? matchingOption : matchingOption.value;
          }
        } else if (labelMapper && field.value) {
          displayValue = labelMapper(field.value);
        }

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
              ) : type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={readOnly}
                  />
                  {helperText && <span className="text-sm text-gray-500">{helperText}</span>}
                </div>
              ) : type === 'textarea' ? (
                <Textarea
                  {...field}
                  readOnly={readOnly}
                  className={readOnly ? "bg-gray-100" : ""}
                  maxLength={maxLength}
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
            {helperText && type !== 'checkbox' && (
              <FormDescription>{helperText}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default FormFieldWrapper;
