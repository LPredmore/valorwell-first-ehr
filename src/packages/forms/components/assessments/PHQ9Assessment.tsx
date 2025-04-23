import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PHQ9Question } from '@/packages/core/types/forms/assessments';

interface PHQ9AssessmentProps {
  form: UseFormReturn<any>;
  readOnly?: boolean;
}

const questions: PHQ9Question[] = [
  {
    id: 1,
    text: "Little interest or pleasure in doing things",
    field: "phq9_interest",
    score: 0
  },
  {
    id: 2,
    text: "Feeling down, depressed, or hopeless",
    field: "phq9_depressed",
    score: 0
  },
  {
    id: 3,
    text: "Trouble falling or staying asleep, or sleeping too much",
    field: "phq9_sleep",
    score: 0
  },
  {
    id: 4,
    text: "Feeling tired or having little energy",
    field: "phq9_tired",
    score: 0
  },
  {
    id: 5,
    text: "Poor appetite or overeating",
    field: "phq9_appetite",
    score: 0
  },
  {
    id: 6,
    text: "Feeling bad about yourself or that you are a failure",
    field: "phq9_feelings",
    score: 0
  },
  {
    id: 7,
    text: "Trouble concentrating on things",
    field: "phq9_concentration",
    score: 0
  },
  {
    id: 8,
    text: "Moving or speaking slowly or being fidgety/restless",
    field: "phq9_moving",
    score: 0
  },
  {
    id: 9,
    text: "Thoughts that you would be better off dead or of hurting yourself",
    field: "phq9_thoughts",
    score: 0
  }
];

const PHQ9AssessmentComponent: React.FC<PHQ9AssessmentProps> = ({
  form,
  readOnly = false
}) => {
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

export { PHQ9AssessmentComponent as PHQ9Assessment };
