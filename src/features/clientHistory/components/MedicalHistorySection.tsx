
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { UseFormReturn, Controller, useFieldArray } from "react-hook-form";
import { ClientHistoryFormData } from '../types';
import { X, Plus } from 'lucide-react';

interface MedicalHistorySectionProps {
  form: UseFormReturn<ClientHistoryFormData>;
}

export const MedicalHistorySection: React.FC<MedicalHistorySectionProps> = ({ form }) => {
  const { register, control, watch } = form;
  const showTreatments = watch('hasReceivedTreatment');
  const showMedications = watch('takesMedications');
  
  const treatmentsArray = useFieldArray({
    control,
    name: "pastTreatments"
  });
  
  const medicationsArray = useFieldArray({
    control,
    name: "medications"
  });
  
  const medicalConditions = [
    "Recent Surgery",
    "Thyroid Issues",
    "Chronic Pain",
    "Hormone Problems",
    "Head Injury",
    "Treatment for Drug/Alcohol Abuse",
    "Headaches",
    "Infertility",
    "Seizures",
    "Neurological Problems",
    "Miscarriage",
    "High blood pressure",
    "Gastritis or esophagitis",
    "Angina or chest pain",
    "Irritable bowel",
    "Heart attack",
    "Bone or joint problems",
    "Kidney-related issues",
    "Chronic fatigue",
    "Heart Conditions",
    "Diabetes",
    "Cancer",
    "Dizziness",
    "Faintness",
    "Urinary Tract Problems",
    "Fibromyalgia",
    "Numbness & Tingling",
    "Shortness of Breath/Asthma",
    "Hepatitis",
    "Arthritis",
    "HIV/AIDS",
    "Other"
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Medical and Mental Health History</CardTitle>
        <CardDescription>Information about your medical and mental health background</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-2 block">Have you ever received Mental Health Treatment before?</Label>
          <Controller
            control={control}
            name="hasReceivedTreatment"
            render={({ field }) => (
              <RadioGroup 
                value={field.value ? "yes" : "no"}
                onValueChange={(value) => field.onChange(value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="mentalHealth-yes" />
                  <Label htmlFor="mentalHealth-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="mentalHealth-no" />
                  <Label htmlFor="mentalHealth-no">No</Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
        
        {showTreatments && (
          <div>
            <Label className="mb-4 block">Please list any current or past mental health professionals who have treated you as well as any psychiatric hospitalizations or addiction treatment facilities you have experienced</Label>
            {treatmentsArray.fields.map((treatment, index) => (
              <div key={treatment.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`treatmentYear-${index}`}>Last Year Treatment was Received</Label>
                    <Input
                      id={`treatmentYear-${index}`}
                      placeholder="Enter year"
                      {...register(`pastTreatments.${index}.year`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`treatmentReason-${index}`}>Reason for Treatment</Label>
                    <Input
                      id={`treatmentReason-${index}`}
                      placeholder="Enter reason"
                      {...register(`pastTreatments.${index}.reason`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`treatmentLength-${index}`}>Treatment Length</Label>
                    <Input
                      id={`treatmentLength-${index}`}
                      placeholder="Enter length"
                      {...register(`pastTreatments.${index}.length`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`treatmentProvider-${index}`}>Provider/Hospital Name</Label>
                    <Input
                      id={`treatmentProvider-${index}`}
                      placeholder="Enter provider name"
                      {...register(`pastTreatments.${index}.provider`)}
                    />
                  </div>
                </div>
                {treatmentsArray.fields.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => treatmentsArray.remove(index)}
                  >
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              className="mt-2" 
              onClick={() => treatmentsArray.append({
                id: Date.now().toString(),
                year: '',
                reason: '',
                length: '',
                provider: ''
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Treatment
            </Button>
          </div>
        )}
        
        <div>
          <Label className="mb-2 block">Please Check any of the following that apply</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {medicalConditions.map((condition) => (
              <Controller
                key={condition}
                control={control}
                name="medicalConditions"
                render={({ field }) => {
                  const isChecked = field.value?.includes(condition) || false;
                  return (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`medical-${condition}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, condition]);
                          } else {
                            field.onChange(current.filter(c => c !== condition));
                          }
                        }}
                      />
                      <Label htmlFor={`medical-${condition}`}>{condition}</Label>
                    </div>
                  );
                }}
              />
            ))}
          </div>
        </div>
        
        <div>
          <Label htmlFor="chronicHealth">List any other chronic health problems or concerns</Label>
          <Textarea
            id="chronicHealth"
            placeholder="Describe any chronic health problems..."
            className="min-h-[120px]"
            {...register('chronicHealthProblems')}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="sleepHours">Average hours slept each night?</Label>
            <Input
              id="sleepHours"
              placeholder="Enter hours"
              {...register('sleepHours')}
            />
          </div>
          <div>
            <Label htmlFor="alcoholUse">Average Weekly Alcoholic Beverages Consumed</Label>
            <Input
              id="alcoholUse"
              placeholder="Enter number"
              {...register('alcoholUse')}
            />
          </div>
          <div>
            <Label htmlFor="tobaccoUse">Tobacco Use per Day</Label>
            <Input
              id="tobaccoUse"
              placeholder="Enter amount"
              {...register('tobaccoUse')}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="drugUse">Recreational Drugs used in the Past Year</Label>
          <Textarea
            id="drugUse"
            placeholder="List any drugs used..."
            {...register('drugUse')}
          />
        </div>
        
        <div>
          <Label className="mb-2 block">Do you take any prescription medications?</Label>
          <Controller
            control={control}
            name="takesMedications"
            render={({ field }) => (
              <RadioGroup 
                value={field.value ? "yes" : "no"}
                onValueChange={(value) => field.onChange(value === "yes")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="medications-yes" />
                  <Label htmlFor="medications-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="medications-no" />
                  <Label htmlFor="medications-no">No</Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>
        
        {showMedications && (
          <div>
            <Label className="mb-4 block">Medications</Label>
            {medicationsArray.fields.map((medication, index) => (
              <div key={medication.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`medicationName-${index}`}>Name of Medication</Label>
                    <Input
                      id={`medicationName-${index}`}
                      placeholder="Enter medication name"
                      {...register(`medications.${index}.name`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`medicationPurpose-${index}`}>Purpose</Label>
                    <Input
                      id={`medicationPurpose-${index}`}
                      placeholder="Enter purpose"
                      {...register(`medications.${index}.purpose`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`medicationDuration-${index}`}>How long have you taken this?</Label>
                    <Input
                      id={`medicationDuration-${index}`}
                      placeholder="Enter duration"
                      {...register(`medications.${index}.duration`)}
                    />
                  </div>
                </div>
                {medicationsArray.fields.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => medicationsArray.remove(index)}
                  >
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              className="mt-2" 
              onClick={() => medicationsArray.append({
                id: Date.now().toString(),
                name: '',
                purpose: '',
                duration: ''
              })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Medication
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
