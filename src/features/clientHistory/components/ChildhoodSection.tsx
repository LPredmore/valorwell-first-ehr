
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn, Controller } from "react-hook-form";
import { ClientHistoryFormData } from '../types';

interface ChildhoodSectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

export const ChildhoodSection: React.FC<ChildhoodSectionProps> = ({ form }) => {
  const { register, control } = form;
  
  const childhoodExperiences = [
    "Happy Childhood",
    "Neglected",
    "Family Moved Frequently",
    "Physically Abused",
    "Sexually Abused",
    "Few Friends",
    "Over/Underweight",
    "Popular",
    "Parents Divorced",
    "Family Fights",
    "Poor Grades",
    "Conflict with Teachers",
    "Drug or Alcohol Abuse",
    "Good Grades",
    "Sexual Problems",
    "Depressed",
    "Spoiled",
    "Anxious",
    "Not Allowed to Grow Up",
    "Attention Problems",
    "Anger Problems"
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Childhood and Family History</CardTitle>
        <CardDescription>Information about your childhood and family background</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-2 block">Please check any of the following that describe your childhood experience:</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {childhoodExperiences.map((experience) => (
              <Controller
                key={experience}
                control={control}
                name="childhoodExperiences"
                render={({ field }) => {
                  const isChecked = field.value?.includes(experience) || false;
                  return (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`childhood-${experience}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, experience]);
                          } else {
                            field.onChange(current.filter(exp => exp !== experience));
                          }
                        }}
                      />
                      <Label htmlFor={`childhood-${experience}`}>{experience}</Label>
                    </div>
                  );
                }}
              />
            ))}
          </div>
        </div>
        
        <div>
          <Label htmlFor="childhoodElaboration">Please elaborate on any of the above or add any other significant childhood experiences:</Label>
          <Textarea 
            id="childhoodElaboration" 
            placeholder="Describe your childhood experiences..." 
            className="min-h-[120px]"
            {...register('childhoodElaboration')} 
          />
        </div>
      </CardContent>
    </Card>
  );
};
