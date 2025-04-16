
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ClientHistoryFormData } from './index';

interface PresentingProblemsSectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

const PresentingProblemsSection: React.FC<PresentingProblemsSectionProps> = ({ form }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Presenting Problems</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="presentingProblems.chiefComplaint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chief Complaint</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="presentingProblems.symptoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symptoms</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="presentingProblems.triggers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Triggers</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="presentingProblems.duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="presentingProblems.severity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Severity</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="presentingProblems.impactOnFunctioning"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Impact on Functioning</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="presentingProblems.previousTreatment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous Treatment</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="presentingProblems.currentTreatment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Treatment</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="presentingProblems.goalsForTreatment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goals for Treatment</FormLabel>
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

export default PresentingProblemsSection;
