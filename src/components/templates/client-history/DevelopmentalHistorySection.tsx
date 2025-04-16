
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ClientHistoryFormData } from './index';

interface DevelopmentalHistorySectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

const DevelopmentalHistorySection: React.FC<DevelopmentalHistorySectionProps> = ({ form }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Developmental History</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="developmentalHistory.earlyChildhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Early Childhood</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="developmentalHistory.milestones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Milestones</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="developmentalHistory.schoolExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School Experience</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="developmentalHistory.socialRelationships"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Social Relationships</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="developmentalHistory.significantEvents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Significant Events</FormLabel>
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

export default DevelopmentalHistorySection;
