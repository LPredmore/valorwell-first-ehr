
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn, Controller, useFieldArray } from "react-hook-form";
import { ClientHistoryFormData } from '../types';
import { X, Plus } from 'lucide-react';

interface FamilySectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

export const FamilySection: React.FC<FamilySectionProps> = ({ form }) => {
  const { register, control, watch } = form;
  const isFamilySameAsHousehold = watch('isFamilySameAsHousehold');
  
  const familyArray = useFieldArray({
    control,
    name: "familyMembers"
  });
  
  const householdArray = useFieldArray({
    control,
    name: "householdMembers"
  });
  
  const relationshipTypes = [
    "Mother",
    "Father",
    "Stepmother",
    "Stepfather",
    "Sister",
    "Brother",
    "Grandmother",
    "Grandfather",
    "Aunt",
    "Uncle",
    "Cousin",
    "Foster Parent",
    "Adopted Parent",
    "Other"
  ];
  
  const householdRelationshipTypes = [
    "Spouse",
    "Partner",
    "Child",
    "Roommate",
    "Other"
  ];
  
  const educationOptions = [
    "Less than High School",
    "High School / GED",
    "Some College",
    "Associate's Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctoral Degree",
    "Professional Degree (MD, JD, etc.)",
    "Trade School / Vocational Training",
    "Other"
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Family and Household Information</CardTitle>
        <CardDescription>Information about your family and current household</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-4 block">Please list your family of origin (the family you grew up with):</Label>
          {familyArray.fields.map((member, index) => (
            <div key={member.id} className="mb-6 p-4 border rounded-md bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor={`familyType-${index}`}>Relationship Type</Label>
                  <Controller
                    control={control}
                    name={`familyMembers.${index}.relationshipType`}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id={`familyType-${index}`}>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor={`familyName-${index}`}>Name</Label>
                  <Input 
                    id={`familyName-${index}`} 
                    placeholder="Enter name" 
                    {...register(`familyMembers.${index}.name`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`familyPersonality-${index}`}>Personality</Label>
                  <Input 
                    id={`familyPersonality-${index}`} 
                    placeholder="Describe personality" 
                    {...register(`familyMembers.${index}.personality`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`familyRelationshipGrowing-${index}`}>Relationship While Growing Up</Label>
                  <Input 
                    id={`familyRelationshipGrowing-${index}`} 
                    placeholder="Describe relationship" 
                    {...register(`familyMembers.${index}.relationshipGrowing`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`familyRelationshipNow-${index}`}>Relationship Now</Label>
                  <Input 
                    id={`familyRelationshipNow-${index}`} 
                    placeholder="Describe current relationship" 
                    {...register(`familyMembers.${index}.relationshipNow`)}
                  />
                </div>
              </div>
              {familyArray.fields.length > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => familyArray.remove(index)}
                >
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>
          ))}
          <Button 
            type="button" 
            variant="outline" 
            className="mt-2" 
            onClick={() => familyArray.append({ 
              id: Date.now().toString(),
              relationshipType: '', 
              name: '', 
              personality: '', 
              relationshipGrowing: '', 
              relationshipNow: ''
            })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Family Member
          </Button>
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Controller
              control={control}
              name="isFamilySameAsHousehold"
              render={({ field }) => (
                <Checkbox 
                  id="sameHousehold" 
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="sameHousehold">My current household is the same as my family of origin</Label>
          </div>
          
          {!isFamilySameAsHousehold && (
            <div>
              <Label className="mb-4 block">Please list your current household members:</Label>
              {householdArray.fields.map((member, index) => (
                <div key={member.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`householdType-${index}`}>Relationship Type</Label>
                      <Controller
                        control={control}
                        name={`householdMembers.${index}.relationshipType`}
                        render={({ field }) => (
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id={`householdType-${index}`}>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              {householdRelationshipTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`householdName-${index}`}>Name</Label>
                      <Input 
                        id={`householdName-${index}`} 
                        placeholder="Enter name" 
                        {...register(`householdMembers.${index}.name`)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`householdPersonality-${index}`}>Personality</Label>
                      <Input 
                        id={`householdPersonality-${index}`} 
                        placeholder="Describe personality" 
                        {...register(`householdMembers.${index}.personality`)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`householdRelationship-${index}`}>Relationship</Label>
                      <Input 
                        id={`householdRelationship-${index}`} 
                        placeholder="Describe relationship" 
                        {...register(`householdMembers.${index}.relationshipNow`)}
                      />
                    </div>
                  </div>
                  {householdArray.fields.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => householdArray.remove(index)}
                    >
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                className="mt-2" 
                onClick={() => householdArray.append({ 
                  id: Date.now().toString(), 
                  relationshipType: '', 
                  name: '', 
                  personality: '', 
                  relationshipNow: '' 
                })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Household Member
              </Button>
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="occupation">Current Occupation (if student, indicate school and grade/year):</Label>
          <Textarea 
            id="occupation" 
            placeholder="Describe your occupation..." 
            {...register('occupationDetails')}
          />
        </div>
        
        <div>
          <Label className="mb-2 block">Highest Level of Education Completed:</Label>
          <Controller
            control={control}
            name="educationLevel"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {educationOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
