
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
}

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  control,
  name,
  label,
  type = 'text',
  options = [],
  readOnly = false
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // For debugging purposes
        if (name === 'state') {
          console.log('State field value:', field.value);
        }
        
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              {type === 'select' ? (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={readOnly}
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
