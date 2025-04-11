import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { FileText, X, ChevronLeft, Save, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientHistoryTemplateProps {
  onSubmit: (formData: any) => void;
  isSubmitting: boolean;
  initialValues?: {
    fullName: string;
    dateOfBirth: string;
    age: string;
    state: string;
    phoneNumber: string;
    email: string;
  };
}

interface FamilyMember {
  id: string;
  relationshipType: string;
  name: string;
  personality: string;
  relationshipGrowing?: string;
  relationshipNow: string;
}

interface PastTreatment {
  id: string;
  year: string;
  reason: string;
  length: string;
  provider: string;
}

interface Medication {
  id: string;
  name: string;
  purpose: string;
  duration: string;
}

interface PastSpouse {
  id: string;
  name: string;
  personality: string;
  relationship: string;
}

interface SymptomCategories {
  mood: string[];
  physical: string[];
  behavioral: string[];
  cognitive: string[];
  lifeStressors: string[];
}

const ClientHistoryTemplate: React.FC<ClientHistoryTemplateProps> = ({ 
  onSubmit, 
  isSubmitting,
  initialValues = {
    fullName: '',
    dateOfBirth: '',
    age: '',
    state: '',
    phoneNumber: '',
    email: ''
  }
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [family, setFamily] = useState<FamilyMember[]>([
    { id: '1', relationshipType: '', name: '', personality: '', relationshipGrowing: '', relationshipNow: '' }
  ]);
  const [currentHousehold, setCurrentHousehold] = useState<FamilyMember[]>([
    { id: '1', relationshipType: '', name: '', personality: '', relationshipNow: '' }
  ]);
  const [treatments, setTreatments] = useState<PastTreatment[]>([
    { id: '1', year: '', reason: '', length: '', provider: '' }
  ]);
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: '', purpose: '', duration: '' }
  ]);
  const [pastSpouses, setPastSpouses] = useState<PastSpouse[]>([
    { id: '1', name: '', personality: '', relationship: '' }
  ]);
  
  const [showPastSpouses, setShowPastSpouses] = useState(false);
  const [showTreatments, setShowTreatments] = useState(false);
  const [showMedications, setShowMedications] = useState(false);
  const [sameHousehold, setSameHousehold] = useState(false);
  const [isMarried, setIsMarried] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedChildhoodExperiences, setSelectedChildhoodExperiences] = useState<string[]>([]);
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState<string[]>([]);

  const form = useForm();

  const symptoms: SymptomCategories = {
    mood: [
      "Depressed Mood", 
      "Anxiety/Worry", 
      "Fear", 
      "Hopelessness", 
      "Mood Swings", 
      "Irritability", 
      "Shyness", 
      "Tearful/Crying Spells", 
      "Low Self-Esteem", 
      "Low Motivation", 
      "Feelings of Guilt", 
      "Feeling Lonely", 
      "Feeling Unfairly Treated", 
      "Feeling Misunderstood", 
      "Feeling Inferior", 
      "Disappointed", 
      "Perfectionism"
    ],
    physical: [
      "Increased Appetite", 
      "Decreased Appetite", 
      "Changes in Weight", 
      "Difficulty Sleeping", 
      "Excessive Sleeping", 
      "Low Energy", 
      "Frequent Pain", 
      "Nausea", 
      "Sexual Problems", 
      "Eating Disorder", 
      "Alcohol Dependency", 
      "Recreational Drug Use", 
      "Physical Illness"
    ],
    behavioral: [
      "Angry Outbursts", 
      "Isolation from Others", 
      "Social Withdrawal", 
      "Impulsive Behavior", 
      "Relationship Difficulties", 
      "Feeling Abandoned", 
      "Boredom", 
      "Unusual/Increased Sensitivity", 
      "Suspicion", 
      "Thoughts of Harming Yourself", 
      "Thoughts of Harming Others"
    ],
    cognitive: [
      "Trouble Concentrating", 
      "Concentration Problems", 
      "Difficulty Making Decisions", 
      "Memory Problems", 
      "Feeling Confused", 
      "Unusual Thoughts", 
      "Irrational Thoughts", 
      "Hearing Strange Voices"
    ],
    lifeStressors: [
      "Legal Difficulties", 
      "Work/School Problems", 
      "Money Problems", 
      "Mourning", 
      "Boredom", 
      "Religious Concerns", 
      "Specific Fear"
    ]
  };

  const educationOptions = [
    "Less than High School",
    "High School / GED",
    "Some College",
    "Associate's Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctoral Degree",
    "Professional Degree (MD, JD, etc.)",
    "Trade School / Vocational Training",
    "Other"
  ];

  const relationshipTypes = [
    "Mother",
    "Father",
    "Stepmother",
    "Stepfather",
    "Sister",
    "Brother",
    "Grandmother",
    "Grandfather",
    "Aunt",
    "Uncle",
    "Cousin",
    "Foster Parent",
    "Adopted Parent",
    "Other"
  ];

  const childhoodExperiences = [
    "Happy Childhood",
    "Neglected",
    "Family Moved Frequently",
    "Physically Abused",
    "Sexually Abused",
    "Few Friends",
    "Over/Underweight",
    "Popular",
    "Parents Divorced",
    "Family Fights",
    "Poor Grades",
    "Conflict with Teachers",
    "Drug or Alcohol Abuse",
    "Good Grades",
    "Sexual Problems",
    "Depressed",
    "Spoiled",
    "Anxious",
    "Not Allowed to Grow Up",
    "Attention Problems",
    "Anger Problems"
  ];

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

  const handleAddFamily = () => {
    setFamily([
      ...family,
      { id: Date.now().toString(), relationshipType: '', name: '', personality: '', relationshipGrowing: '', relationshipNow: '' }
    ]);
  };

  const handleAddHousehold = () => {
    setCurrentHousehold([
      ...currentHousehold,
      { id: Date.now().toString(), relationshipType: '', name: '', personality: '', relationshipNow: '' }
    ]);
  };

  const handleAddTreatment = () => {
    setTreatments([
      ...treatments,
      { id: Date.now().toString(), year: '', reason: '', length: '', provider: '' }
    ]);
  };

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { id: Date.now().toString(), name: '', purpose: '', duration: '' }
    ]);
  };

  const handleAddSpouse = () => {
    setPastSpouses([
      ...pastSpouses,
      { id: Date.now().toString(), name: '', personality: '', relationship: '' }
    ]);
  };

  const handleSymptomChange = (symptom: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    } else {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    }
  };

  const handleChildhoodExperienceChange = (experience: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedChildhoodExperiences([...selectedChildhoodExperiences, experience]);
    } else {
      setSelectedChildhoodExperiences(selectedChildhoodExperiences.filter(exp => exp !== experience));
    }
  };

  const handleMedicalConditionChange = (condition: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedMedicalConditions([...selectedMedicalConditions, condition]);
    } else {
      setSelectedMedicalConditions(selectedMedicalConditions.filter(c => c !== condition));
    }
  };

  const handleFormSubmit = () => {
    const formData = {
      emergencyContact: {
        name: (document.getElementById('emergencyName') as HTMLInputElement)?.value,
        relationship: (document.getElementById('emergencyRelationship') as HTMLInputElement)?.value,
        phone: (document.getElementById('emergencyPhone') as HTMLInputElement)?.value,
      },
      currentIssues: (document.getElementById('currentIssues') as HTMLTextAreaElement)?.value,
      progressionOfIssues: (document.getElementById('progressionOfIssues') as HTMLTextAreaElement)?.value,
      symptoms: selectedSymptoms,
      hospitalizedPsychiatric: (document.getElementById('hospitalized-yes') as HTMLInputElement)?.checked,
      attemptedSuicide: (document.getElementById('suicide-yes') as HTMLInputElement)?.checked,
      psychHold: (document.getElementById('psychhold-yes') as HTMLInputElement)?.checked,
      lifeChanges: (document.getElementById('lifeChanges') as HTMLTextAreaElement)?.value,
      additionalInfo: (document.getElementById('additionalInfo') as HTMLTextAreaElement)?.value,
      counselingGoals: (document.getElementById('counselingGoals') as HTMLTextAreaElement)?.value,
      childhoodExperiences: selectedChildhoodExperiences,
      childhoodElaboration: (document.getElementById('childhoodElaboration') as HTMLTextAreaElement)?.value,
      isFamilySameAsHousehold: sameHousehold,
      occupationDetails: (document.getElementById('occupation') as HTMLTextAreaElement)?.value,
      educationLevel: (document.querySelector('#education .select-value') as HTMLElement)?.innerText,
      isMarried: isMarried,
      currentSpouse: isMarried ? {
        name: (document.getElementById('spouseName') as HTMLInputElement)?.value,
        personality: (document.getElementById('spousePersonality') as HTMLInputElement)?.value,
        relationship: (document.getElementById('spouseRelationship') as HTMLInputElement)?.value,
      } : null,
      hasPastSpouses: showPastSpouses,
      pastSpouses: showPastSpouses ? pastSpouses.map((spouse, index) => ({
        name: (document.getElementById(`pastSpouseName-${index}`) as HTMLInputElement)?.value,
        personality: (document.getElementById(`pastSpousePersonality-${index}`) as HTMLInputElement)?.value,
        relationship: (document.getElementById(`pastSpouseRelationship-${index}`) as HTMLInputElement)?.value,
      })) : [],
      relationshipProblems: (document.getElementById('relationshipProblems') as HTMLTextAreaElement)?.value,
      hasReceivedTreatment: showTreatments,
      pastTreatments: showTreatments ? treatments.map((treatment, index) => ({
        year: (document.getElementById(`treatmentYear-${index}`) as HTMLInputElement)?.value,
        reason: (document.getElementById(`treatmentReason-${index}`) as HTMLInputElement)?.value,
        length: (document.getElementById(`treatmentLength-${index}`) as HTMLInputElement)?.value,
        provider: (document.getElementById(`treatmentProvider-${index}`) as HTMLInputElement)?.value,
      })) : [],
      medicalConditions: selectedMedicalConditions,
      chronicHealthProblems: (document.getElementById('chronicHealth') as HTMLTextAreaElement)?.value,
      sleepHours: (document.getElementById('sleepHours') as HTMLInputElement)?.value,
      alcoholUse: (document.getElementById('alcoholUse') as HTMLInputElement)?.value,
      tobaccoUse: (document.getElementById('tobaccoUse') as HTMLInputElement)?.value,
      drugUse: (document.getElementById('drugUse') as HTMLTextAreaElement)?.value,
      takesMedications: showMedications,
      medications: showMedications ? medications.map((medication, index) => ({
        name: (document.getElementById(`medicationName-${index}`) as HTMLInputElement)?.value,
        purpose: (document.getElementById(`medicationPurpose-${index}`) as HTMLInputElement)?.value,
        duration: (document.getElementById(`medicationDuration-${index}`) as HTMLInputElement)?.value,
      })) : [],
      personalStrengths: (document.getElementById('strengths') as HTMLTextAreaElement)?.value,
      hobbies: (document.getElementById('hobbies') as HTMLTextAreaElement)?.value,
      additionalInfo2: (document.getElementById('additionalInfo2') as HTMLTextAreaElement)?.value,
      signature: (document.getElementById('signature') as HTMLInputElement)?.value,
      familyMembers: family.map((member, index) => ({
        relationshipType: document.querySelector(`#familyType-${index} .select-value`)?.textContent,
        name: (document.getElementById(`familyName-${index}`) as HTMLInputElement)?.value,
        personality: (document.getElementById(`familyPersonality-${index}`) as HTMLInputElement)?.value,
        relationshipGrowing: (document.getElementById(`familyRelationshipGrowing-${index}`) as HTMLInputElement)?.value,
        relationshipNow: (document.getElementById(`familyRelationshipNow-${index}`) as HTMLInputElement)?.value,
      })),
      householdMembers: !sameHousehold ? currentHousehold.map((member, index) => ({
        relationshipType: document.querySelector(`#householdType-${index} .select-value`)?.textContent,
        name: (document.getElementById(`householdName-${index}`) as HTMLInputElement)?.value,
        personality: (document.getElementById(`householdPersonality-${index}`) as HTMLInputElement)?.value,
        relationshipNow: (document.getElementById(`householdRelationship-${index}`) as HTMLInputElement)?.value,
      })) : [],
    };
    
    onSubmit(formData);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      navigate('/patient-dashboard');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" onClick={handleCancel} className="mr-2">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Client History Form</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-8 mb-8">
        {/* SECTION: Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Your personal information (auto-populated from your profile)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={initialValues.fullName} placeholder="Auto-populated" disabled />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" value={initialValues.dateOfBirth} placeholder="Auto-populated" disabled />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input id="age" value={initialValues.age} placeholder="Auto-populated" disabled />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={initialValues.state} placeholder="Auto-populated" disabled />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" value={initialValues.phoneNumber} placeholder="Auto-populated" disabled />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={initialValues.email} placeholder="Auto-populated" disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ... keep existing code (remaining form sections) */}
      </form>
    </div>
  );
};

export default ClientHistoryTemplate;
