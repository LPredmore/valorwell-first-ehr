
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { ClientHistoryFormData } from '../types';

interface PersonalSectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

export const PersonalSection: React.FC<PersonalSectionProps> = ({ form }) => {
  const { register } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information and Signature</CardTitle>
        <CardDescription>Tell us about your personal strengths and additional information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="strengths">Tell me about your personal strengths and important accomplishments</Label>
          <Textarea
            id="strengths"
            placeholder="Describe your personal strengths and accomplishments..."
            className="min-h-[120px]"
            {...register('personalStrengths')}
          />
        </div>
        
        <div>
          <Label htmlFor="hobbies">Please list any hobbies or activities you participate in</Label>
          <Textarea
            id="hobbies"
            placeholder="List hobbies and activities..."
            className="min-h-[120px]"
            {...register('hobbies')}
          />
        </div>
        
        <div>
          <Label htmlFor="additionalInfo2">What else would you like me to know?</Label>
          <Textarea
            id="additionalInfo2"
            placeholder="Any additional information..."
            className="min-h-[120px]"
            {...register('additionalInfo2')}
          />
        </div>
        
        <div>
          <Label htmlFor="signature">Signature (type your name as the person signing this)</Label>
          <Input
            id="signature"
            placeholder="Type your full name"
            {...register('signature')}
          />
        </div>
      </CardContent>
    </Card>
  );
};
