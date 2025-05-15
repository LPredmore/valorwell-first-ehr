import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn, Controller } from "react-hook-form";
import { ClientHistoryFormData } from '../types';

interface SymptomCategories {
  mood: string[];
  physical: string[];
  behavioral: string[];
  cognitive: string[];
  lifeStressors: string[];
}

interface CurrentIssuesSectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

export const CurrentIssuesSection: React.FC<CurrentIssuesSectionProps> = ({ form }) => {
  const { register, control, watch } = form;
  
  const symptoms: SymptomCategories = {
    mood: [
      "Depressed Mood", "Anxiety/Worry", "Fear", "Hopelessness", "Mood Swings", 
      "Irritability", "Shyness", "Tearful/Crying Spells", "Low Self-Esteem", 
      "Low Motivation", "Feelings of Guilt", "Feeling Lonely", "Feeling Unfairly Treated", 
      "Feeling Misunderstood", "Feeling Inferior", "Disappointed", "Perfectionism"
    ],
    physical: [
      "Increased Appetite", "Decreased Appetite", "Changes in Weight", "Difficulty Sleeping", 
      "Excessive Sleeping", "Low Energy", "Frequent Pain", "Nausea", "Sexual Problems", 
      "Eating Disorder", "Alcohol Dependency", "Recreational Drug Use", "Physical Illness"
    ],
    behavioral: [
      "Angry Outbursts", "Isolation from Others", "Social Withdrawal", "Impulsive Behavior", 
      "Relationship Difficulties", "Feeling Abandoned", "Boredom", "Unusual/Increased Sensitivity", 
      "Suspicion", "Thoughts of Harming Yourself", "Thoughts of Harming Others"
    ],
    cognitive: [
      "Trouble Concentrating", "Concentration Problems", "Difficulty Making Decisions", 
      "Memory Problems", "Feeling Confused", "Unusual Thoughts", "Irrational Thoughts", 
      "Hearing Strange Voices"
    ],
    lifeStressors: [
      "Legal Difficulties", "Work/School Problems", "Money Problems", "Mourning", 
      "Boredom", "Religious Concerns", "Specific Fear"
    ]
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Current Issues</CardTitle>
        <CardDescription>Please describe your current concerns and symptoms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="currentIssues">What issues or concerns bring you to therapy at this time?</Label>
          <Textarea 
            id="currentIssues" 
            placeholder="Describe your current issues..." 
            className="min-h-[120px]" 
            {...register('currentIssues')}
          />
        </div>
        
        <div>
          <Label htmlFor="progressionOfIssues">How have these issues progressed over time?</Label>
          <Textarea 
            id="progressionOfIssues" 
            placeholder="Describe how these issues have changed..." 
            className="min-h-[120px]" 
            {...register('progressionOfIssues')}
          />
        </div>
        
        <div>
          <Label className="mb-2 block">Please check any symptoms you are experiencing:</Label>
          
          {/* Mood Symptoms */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Mood Symptoms</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {symptoms.mood.map((symptom) => (
                <Controller
                  key={symptom}
                  control={control}
                  name="symptoms"
                  render={({ field }) => {
                    const isChecked = field.value?.includes(symptom) || false;
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`symptom-${symptom}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentSymptoms = field.value || [];
                            if (checked) {
                              field.onChange([...currentSymptoms, symptom]);
                            } else {
                              field.onChange(currentSymptoms.filter(s => s !== symptom));
                            }
                          }}
                        />
                        <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                      </div>
                    );
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Physical Symptoms */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Physical Symptoms</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {symptoms.physical.map((symptom) => (
                <Controller
                  key={symptom}
                  control={control}
                  name="symptoms"
                  render={({ field }) => {
                    const isChecked = field.value?.includes(symptom) || false;
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`symptom-${symptom}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentSymptoms = field.value || [];
                            if (checked) {
                              field.onChange([...currentSymptoms, symptom]);
                            } else {
                              field.onChange(currentSymptoms.filter(s => s !== symptom));
                            }
                          }}
                        />
                        <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                      </div>
                    );
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Behavioral Symptoms */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Behavioral Symptoms</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {symptoms.behavioral.map((symptom) => (
                <Controller
                  key={symptom}
                  control={control}
                  name="symptoms"
                  render={({ field }) => {
                    const isChecked = field.value?.includes(symptom) || false;
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`symptom-${symptom}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentSymptoms = field.value || [];
                            if (checked) {
                              field.onChange([...currentSymptoms, symptom]);
                            } else {
                              field.onChange(currentSymptoms.filter(s => s !== symptom));
                            }
                          }}
                        />
                        <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                      </div>
                    );
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Cognitive Symptoms */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Cognitive Symptoms</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {symptoms.cognitive.map((symptom) => (
                <Controller
                  key={symptom}
                  control={control}
                  name="symptoms"
                  render={({ field }) => {
                    const isChecked = field.value?.includes(symptom) || false;
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`symptom-${symptom}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentSymptoms = field.value || [];
                            if (checked) {
                              field.onChange([...currentSymptoms, symptom]);
                            } else {
                              field.onChange(currentSymptoms.filter(s => s !== symptom));
                            }
                          }}
                        />
                        <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                      </div>
                    );
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Life Stressors */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Life Stressors</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {symptoms.lifeStressors.map((symptom) => (
                <Controller
                  key={symptom}
                  control={control}
                  name="symptoms"
                  render={({ field }) => {
                    const isChecked = field.value?.includes(symptom) || false;
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`symptom-${symptom}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentSymptoms = field.value || [];
                            if (checked) {
                              field.onChange([...currentSymptoms, symptom]);
                            } else {
                              field.onChange(currentSymptoms.filter(s => s !== symptom));
                            }
                          }}
                        />
                        <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                      </div>
                    );
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <Label className="mb-2 block">Have you ever been hospitalized for psychiatric reasons?</Label>
          <Controller
            control={control}
            name="hospitalizedPsychiatric"
            render={({ field }) => (
              <RadioGroup 
                value={field.value ? "yes" : "no"}
                onValueChange={(value) => field.onChange(value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="hospitalized-yes" />
                  <Label htmlFor="hospitalized-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="hospitalized-no" />
                  <Label htmlFor="hospitalized-no">No</Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
        
        <div>
          <Label className="mb-2 block">Have you ever attempted suicide?</Label>
          <Controller
            control={control}
            name="attemptedSuicide"
            render={({ field }) => (
              <RadioGroup 
                value={field.value ? "yes" : "no"}
                onValueChange={(value) => field.onChange(value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="suicide-yes" />
                  <Label htmlFor="suicide-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="suicide-no" />
                  <Label htmlFor="suicide-no">No</Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
        
        <div>
          <Label className="mb-2 block">Have you ever been placed on a psychiatric hold?</Label>
          <Controller
            control={control}
            name="psychHold"
            render={({ field }) => (
              <RadioGroup 
                value={field.value ? "yes" : "no"}
                onValueChange={(value) => field.onChange(value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="psychhold-yes" />
                  <Label htmlFor="psychhold-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="psychhold-no" />
                  <Label htmlFor="psychhold-no">No</Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
        
        <div>
          <Label htmlFor="lifeChanges">Have there been any significant life changes or stressful events that may be contributing to your current difficulties?</Label>
          <Textarea 
            id="lifeChanges" 
            placeholder="Describe any significant life changes..." 
            className="min-h-[120px]" 
            {...register('lifeChanges')}
          />
        </div>
        
        <div>
          <Label htmlFor="additionalInfo">Is there anything else you'd like me to know about your current situation?</Label>
          <Textarea 
            id="additionalInfo" 
            placeholder="Any additional information..." 
            className="min-h-[120px]" 
            {...register('additionalInfo')}
          />
        </div>
        
        <div>
          <Label htmlFor="counselingGoals">What are your goals for counseling?</Label>
          <Textarea 
            id="counselingGoals" 
            placeholder="Describe your goals..." 
            className="min-h-[120px]" 
            {...register('counselingGoals')}
          />
        </div>
      </CardContent>
    </Card>
  );
};
