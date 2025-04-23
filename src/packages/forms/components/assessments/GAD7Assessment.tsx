
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GAD7Question } from '../../types';

interface GAD7AssessmentProps {
  form: UseFormReturn<any>;
  readOnly?: boolean;
}

const GAD7AssessmentComponent: React.FC<GAD7AssessmentProps> = ({
  form,
  readOnly = false
}) => {
  const questions: GAD7Question[] = [
    {
      id: 1,
      text: "Feeling nervous, anxious, or on edge",
      field: "gad7_nervous",
      score: 0
    },
    {
      id: 2,
      text: "Not being able to stop or control worrying",
      field: "gad7_control",
      score: 0
    },
    {
      id: 3,
      text: "Worrying too much about different things",
      field: "gad7_worrying",
      score: 0
    },
    {
      id: 4,
      text: "Trouble relaxing",
      field: "gad7_relaxing",
      score: 0
    },
    {
      id: 5,
      text: "Being so restless that it's hard to sit still",
      field: "gad7_restless",
      score: 0
    },
    {
      id: 6,
      text: "Becoming easily annoyed or irritable",
      field: "gad7_irritable",
      score: 0
    },
    {
      id: 7,
      text: "Feeling afraid, as if something awful might happen",
      field: "gad7_afraid",
      score: 0
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Over the last 2 weeks, how often have you been bothered by the following problems?
      </div>
      
      {questions.map((question) => (
        <Card key={question.id}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="font-medium">{question.text}</div>
              <RadioGroup
                {...form.register(question.field)}
                disabled={readOnly}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { GAD7AssessmentComponent as GAD7Assessment };
