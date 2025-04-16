
import React from 'react';
import { Form } from '@/components/ui/form';

export const SignupVaCcn = ({ form }: { form: any }) => {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">
            Your VA Community Care Network information has been recorded. We'll contact you with next steps after your profile is complete.
          </p>
        </div>
      </div>
    </Form>
  );
};
