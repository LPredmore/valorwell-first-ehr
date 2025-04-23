
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PHQ9Question } from '../../types';

interface PHQ9AssessmentProps {
  form: UseFormReturn<any>;
  readOnly?: boolean;
}

export const PHQ9Assessment: React.FC<PHQ9AssessmentProps> = ({
  form,
  readOnly = false
}) => {
  const questions: PHQ9Question[] = [
    {
      id: 1,
      text: "Little interest or pleasure in doing things",
      field: "phq9_interest"
    },
    {
      id: 2,
      text: "Feeling down, depressed, or hopeless",
      field: "phq9_feeling_down"
    }
    // ... We'll add the rest of the questions later
  ];

  return (
    <div className="space-y-6">
      {questions.map((question) => (
        <FormField
          key={question.id}
          control={form.control}
          name={question.field}
          render={({ field }) => (
            <div className="space-y-2">
              <Label>{question.text}</Label>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={readOnly}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id={`${question.field}-0`} />
                  <Label htmlFor={`${question.field}-0`}>Not at all</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id={`${question.field}-1`} />
                  <Label htmlFor={`${question.field}-1`}>Several days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id={`${question.field}-2`} />
                  <Label htmlFor={`${question.field}-2`}>More than half the days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id={`${question.field}-3`} />
                  <Label htmlFor={`${question.field}-3`}>Nearly every day</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        />
      ))}
    </div>
  );
};
