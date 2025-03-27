
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface InsuranceSectionProps {
  title: string;
  prefix: string;
  form: UseFormReturn<any>;
  isEditing: boolean;
  insuranceTypes: string[];
  relationshipTypes: string[];
}

const InsuranceSection = ({
  title,
  prefix,
  form,
  isEditing,
  insuranceTypes,
  relationshipTypes
}: InsuranceSectionProps) => {
  const baseFieldName = (field: string) => `${prefix}${field}`;

  return (
    <div className="border rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Insurance Company */}
        <FormField
          control={form.control}
          name={baseFieldName('insurance_company')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Company</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value || ''}
                  readOnly={!isEditing} 
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Insurance Type */}
        <FormField
          control={form.control}
          name={baseFieldName('insurance_type')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Type</FormLabel>
              <Select 
                disabled={!isEditing} 
                value={field.value || ''} 
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className={!isEditing ? "bg-gray-100" : ""}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {insuranceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Policy Number */}
        <FormField
          control={form.control}
          name={baseFieldName('policy_number')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Number</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value || ''}
                  readOnly={!isEditing} 
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Group Number */}
        <FormField
          control={form.control}
          name={baseFieldName('group_number')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Number</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value || ''}
                  readOnly={!isEditing} 
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Subscriber Name */}
        <FormField
          control={form.control}
          name={baseFieldName('subscriber_name')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscriber Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value || ''}
                  readOnly={!isEditing} 
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Subscriber Relationship */}
        <FormField
          control={form.control}
          name={baseFieldName('subscriber_relationship')}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscriber Relationship</FormLabel>
              <Select 
                disabled={!isEditing} 
                value={field.value || ''} 
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger className={!isEditing ? "bg-gray-100" : ""}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {relationshipTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Subscriber Date of Birth */}
        <FormField
          control={form.control}
          name={baseFieldName('subscriber_dob')}
          render={({ field }) => (
            <FormItem className="col-span-1 md:col-span-2">
              <FormLabel>Subscriber Date of Birth</FormLabel>
              <FormControl>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input 
                    value={field.value ? format(new Date(field.value), 'PPP') : ''}
                    readOnly 
                    className="bg-gray-100"
                  />
                )}
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default InsuranceSection;
