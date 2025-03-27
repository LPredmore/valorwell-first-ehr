
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InsuranceSectionProps {
  title: string;
  prefix: string;
  form: any;
  isEditing: boolean;
  insuranceTypes: string[];
  relationshipTypes: string[];
}

const InsuranceSection: React.FC<InsuranceSectionProps> = ({ 
  title, 
  prefix, 
  form, 
  isEditing,
  insuranceTypes,
  relationshipTypes
}) => {
  // Determine the suffix based on title
  const getSuffix = () => {
    if (title.includes('Primary')) return '_primary';
    if (title.includes('Secondary')) return '_secondary';
    if (title.includes('Tertiary')) return '_tertiary';
    return '';
  };
  
  const suffix = getSuffix();
  
  return (
    <div className="mb-8 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name={`${prefix}insurance_company${suffix}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Company</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter insurance company name" 
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name={`${prefix}insurance_type${suffix}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Type</FormLabel>
              <FormControl>
                {isEditing ? (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance type" />
                    </SelectTrigger>
                    <SelectContent>
                      {insuranceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    value={field.value || ''} 
                    readOnly 
                    className="bg-gray-100" 
                  />
                )}
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name={`${prefix}policy_number${suffix}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Number</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter policy number" 
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name={`${prefix}group_number${suffix}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Number</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter group number" 
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name={`${prefix}subscriber_name${suffix}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscriber Name</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter subscriber name" 
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name={`${prefix}subscriber_relationship${suffix}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscriber Relationship</FormLabel>
              <FormControl>
                {isEditing ? (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    value={field.value || ''} 
                    readOnly 
                    className="bg-gray-100" 
                  />
                )}
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name={`${prefix}subscriber_dob${suffix}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subscriber Date of Birth</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="MM/DD/YYYY" 
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-gray-100" : ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default InsuranceSection;
