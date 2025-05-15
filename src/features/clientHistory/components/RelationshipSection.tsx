
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn, Controller, useFieldArray } from "react-hook-form";
import { ClientHistoryFormData, SpouseData } from '../types';
import { X, Plus } from 'lucide-react';

interface RelationshipSectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

export const RelationshipSection: React.FC<RelationshipSectionProps> = ({ form }) => {
  const { register, control, watch } = form;
  const isMarried = watch('isMarried');
  const hasPastSpouses = watch('hasPastSpouses');
  
  const pastSpousesArray = useFieldArray({
    control,
    name: "pastSpouses"
  });

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Relationship History</CardTitle>
        <CardDescription>Information about your significant relationships</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-2 block">Are you currently married or in a committed relationship?</Label>
          <Controller
            control={control}
            name="isMarried"
            render={({ field }) => (
              <RadioGroup 
                value={field.value ? "yes" : "no"}
                onValueChange={(value) => field.onChange(value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="married-yes" />
                  <Label htmlFor="married-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="married-no" />
                  <Label htmlFor="married-no">No</Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
        
        {isMarried && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="spouseName">Spouse/Partner Name</Label>
              <Input
                id="spouseName"
                placeholder="Enter name"
                {...register('currentSpouse.name')}
              />
            </div>
            <div>
              <Label htmlFor="spousePersonality">Personality</Label>
              <Input
                id="spousePersonality"
                placeholder="Describe personality"
                {...register('currentSpouse.personality')}
              />
            </div>
            <div>
              <Label htmlFor="spouseRelationship">Quality of Relationship</Label>
              <Input
                id="spouseRelationship"
                placeholder="Describe relationship"
                {...register('currentSpouse.relationship')}
              />
            </div>
          </div>
        )}
        
        <div>
          <Label className="mb-2 block">Have you had any previous marriages or significant relationships?</Label>
          <Controller
            control={control}
            name="hasPastSpouses"
            render={({ field }) => (
              <RadioGroup 
                value={field.value ? "yes" : "no"}
                onValueChange={(value) => field.onChange(value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="pastSpouses-yes" />
                  <Label htmlFor="pastSpouses-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="pastSpouses-no" />
                  <Label htmlFor="pastSpouses-no">No</Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
        
        {hasPastSpouses && (
          <div>
            <Label className="mb-4 block">Previous Marriages/Significant Relationships</Label>
            {pastSpousesArray.fields.map((spouse, index) => (
              <div key={spouse.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`pastSpouseName-${index}`}>Name</Label>
                    <Input
                      id={`pastSpouseName-${index}`}
                      placeholder="Enter name"
                      {...register(`pastSpouses.${index}.name`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`pastSpousePersonality-${index}`}>Personality</Label>
                    <Input
                      id={`pastSpousePersonality-${index}`}
                      placeholder="Describe personality"
                      {...register(`pastSpouses.${index}.personality`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`pastSpouseRelationship-${index}`}>Reason for Ending</Label>
                    <Input
                      id={`pastSpouseRelationship-${index}`}
                      placeholder="Describe reason"
                      {...register(`pastSpouses.${index}.relationship`)}
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => pastSpousesArray.remove(index)}
                >
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              className="mt-2" 
              onClick={() => pastSpousesArray.append({
                id: Date.now().toString(),
                name: '',
                personality: '',
                relationship: ''
              } as SpouseData)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Past Relationship
            </Button>
          </div>
        )}
        
        <div>
          <Label htmlFor="relationshipProblems">Please describe any current relationship problems:</Label>
          <Textarea
            id="relationshipProblems"
            placeholder="Describe any relationship problems..."
            className="min-h-[120px]"
            {...register('relationshipProblems')}
          />
        </div>
      </CardContent>
    </Card>
  );
};
