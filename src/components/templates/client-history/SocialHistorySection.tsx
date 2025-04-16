
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ClientHistoryFormData } from './index';

interface SocialHistorySectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

const SocialHistorySection: React.FC<SocialHistorySectionProps> = ({ form }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Social History</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="socialHistory.culturalBackground"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cultural Background</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialHistory.religiousBeliefs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Religious Beliefs</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialHistory.communityInvolvement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community Involvement</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialHistory.legalIssues"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Issues</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialHistory.financialSituation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Financial Situation</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialHistory.militaryService"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Military Service</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialHistory.relationshipHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship History</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="socialHistory.socialSupport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Social Support</FormLabel>
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

export default SocialHistorySection;
