
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

const CompleteFormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
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
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // For checkbox, we need special handling
        const handleCheckboxChange = (checked: boolean) => {
          field.onChange(checked);
        };

        // For date field, we need special handling
        const handleDateChange = (date: Date | undefined) => {
          field.onChange(date);
        };

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
        
        // Based on type, render appropriate field
        switch (type) {
          case 'date':
            return (
              <FormItem className="flex flex-col">
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "MMMM d, yyyy")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={handleDateChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            );
            
          case 'select':
            return (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value || ''}
                    disabled={readOnly}
                  >
                    <SelectTrigger className={readOnly ? "bg-gray-100" : ""}>
                      <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map(renderSelectOption)}
                    </SelectContent>
                  </Select>
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            );
            
          case 'checkbox':
            return (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox 
                    checked={field.value === true}
                    onCheckedChange={handleCheckboxChange}
                    disabled={readOnly}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                  {helperText && <FormDescription>{helperText}</FormDescription>}
                </div>
                <FormMessage />
              </FormItem>
            );
            
          case 'textarea':
            return (
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
            );
            
          default: // text, email, tel
            return (
              <FormItem>
                <FormLabel>{label}{required && <span className="text-red-500 ml-1">*</span>}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type={type}
                    readOnly={readOnly}
                    className={readOnly ? "bg-gray-100" : ""}
                    maxLength={maxLength}
                    required={required}
                  />
                </FormControl>
                {helperText && <FormDescription>{helperText}</FormDescription>}
                <FormMessage />
              </FormItem>
            );
        }
      }}
    />
  );
};

export default CompleteFormFieldWrapper;
