
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UseFormReturn } from "react-hook-form";
import { ClientHistoryFormData } from '../types';

interface EmergencyContactSectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

export const EmergencyContactSection: React.FC<EmergencyContactSectionProps> = ({ form }) => {
  const { register } = form;
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Emergency Contact</CardTitle>
        <CardDescription>Please provide information for an emergency contact</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="emergencyName">Name</Label>
            <Input 
              id="emergencyName" 
              placeholder="Enter name" 
              {...register('emergencyContact.name')}
            />
          </div>
          <div>
            <Label htmlFor="emergencyRelationship">Relationship</Label>
            <Input 
              id="emergencyRelationship" 
              placeholder="Enter relationship" 
              {...register('emergencyContact.relationship')}
            />
          </div>
          <div>
            <Label htmlFor="emergencyPhone">Phone Number</Label>
            <Input 
              id="emergencyPhone" 
              placeholder="Enter phone number" 
              {...register('emergencyContact.phone')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
