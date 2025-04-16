
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ClientHistoryFormData } from './index';

interface MedicalHistorySectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

const MedicalHistorySection: React.FC<MedicalHistorySectionProps> = ({ form }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Medical History</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="medicalHistory.currentMedications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Medications</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allergies</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.chronicIllnesses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chronic Illnesses</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.pastHospitalizations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Past Hospitalizations</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.surgeries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surgeries</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.immunizationStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Immunization Status</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.sleepPatterns"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sleep Patterns</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.dietaryHabits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dietary Habits</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.exercisePatterns"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Patterns</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="medicalHistory.substanceUse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Substance Use</FormLabel>
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

export default MedicalHistorySection;
