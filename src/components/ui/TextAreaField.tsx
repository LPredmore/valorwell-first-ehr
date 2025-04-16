
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface TextAreaFieldProps {
  control: any;
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  readOnly?: boolean;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  control,
  name,
  label,
  required = false,
  helperText,
  readOnly = false
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
          <FormControl>
            <Textarea 
              {...field}
              readOnly={readOnly}
              className={readOnly ? "bg-gray-100" : ""}
            />
          </FormControl>
          {helperText && <FormDescription>{helperText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TextAreaField;
