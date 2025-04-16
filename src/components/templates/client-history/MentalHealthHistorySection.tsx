
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ClientHistoryFormData } from './index';

interface MentalHealthHistorySectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

const MentalHealthHistorySection: React.FC<MentalHealthHistorySectionProps> = ({ form }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Mental Health History</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="mentalHealthHistory.previousDiagnoses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous Diagnoses</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mentalHealthHistory.previousTherapy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous Therapy</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mentalHealthHistory.previousMedications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous Medications</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mentalHealthHistory.hospitalizations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hospitalizations</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mentalHealthHistory.suicideAttempts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Suicide Attempts</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mentalHealthHistory.selfHarmBehaviors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Self-Harm Behaviors</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mentalHealthHistory.traumaHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trauma History</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mentalHealthHistory.familyMentalHealthHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family Mental Health History</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default MentalHealthHistorySection;
