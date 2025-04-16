
import React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientHistoryFormData } from './index';

interface FamilyMembersSectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

const FamilyMembersSection: React.FC<FamilyMembersSectionProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "familyMembers"
  });

  const addFamilyMember = () => {
    append({
      name: '',
      relationshipType: '',
      dateOfBirth: '',
      livingStatus: '',
      occupation: '',
      educationLevel: '',
      significantHistory: '',
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Family Members</h2>
      
      {fields.map((field, index) => (
        <div key={field.id} className="border p-4 rounded-md mb-4">
          <h3 className="text-xl font-semibold mb-2">Family Member #{index + 1}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name={`familyMembers.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={`familyMembers.${index}.relationshipType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Grandparent">Grandparent</SelectItem>
                      <SelectItem value="Aunt/Uncle">Aunt/Uncle</SelectItem>
                      <SelectItem value="Cousin">Cousin</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={`familyMembers.${index}.dateOfBirth`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={`familyMembers.${index}.livingStatus`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Living Status</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={`familyMembers.${index}.occupation`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={`familyMembers.${index}.educationLevel`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education Level</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name={`familyMembers.${index}.significantHistory`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Significant History</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => remove(index)}
            className="mt-2"
          >
            Remove Family Member
          </Button>
        </div>
      ))}
      
      <Button type="button" onClick={addFamilyMember}>
        Add Family Member
      </Button>
    </div>
  );
};

export default FamilyMembersSection;
