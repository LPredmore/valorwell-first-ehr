import React, { useState } from 'react';
import { ClientData } from '@/hooks/useClientData';
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
  clientData?: ClientData | null;
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
  clientData
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
    
    // Validate required fields
    if (!formData.signature) {
      toast({
        title: "Error",
        description: "Please provide your signature to submit the form.",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(formData);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      navigate('/patient-dashboard');
    }
  };

  // Format name for display
  const clientFullName = clientData ? 
    `${clientData.client_first_name || ''} ${clientData.client_last_name || ''}`.trim() : 
    '';
  
  // Format date of birth if needed
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Client History Form</h1>
      
      {/* Client Information Section */}
      <div className="mb-8 border p-4 rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="block text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={clientFullName}
              disabled
            />
          </div>
          
          <div className="form-group">
            <label className="block text-gray-700 mb-1">Preferred Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={clientData?.client_preferred_name || ''}
              disabled
            />
          </div>
          
          <div className="form-group">
            <label className="block text-gray-700 mb-1">Date of Birth</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={formatDate(clientData?.client_date_of_birth)}
              disabled
            />
          </div>
        </div>
      </div>
      
      {/* Emergency Contact */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Please provide information for an emergency contact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emergencyName">Name</Label>
              <Input id="emergencyName" placeholder="Enter name" />
            </div>
            <div>
              <Label htmlFor="emergencyRelationship">Relationship</Label>
              <Input id="emergencyRelationship" placeholder="Enter relationship" />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Phone Number</Label>
              <Input id="emergencyPhone" placeholder="Enter phone number" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Current Issues */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Issues</CardTitle>
          <CardDescription>Please describe your current concerns and symptoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="currentIssues">What issues or concerns bring you to therapy at this time?</Label>
            <Textarea id="currentIssues" placeholder="Describe your current issues..." className="min-h-[120px]" />
          </div>
          
          <div>
            <Label htmlFor="progressionOfIssues">How have these issues progressed over time?</Label>
            <Textarea id="progressionOfIssues" placeholder="Describe how these issues have changed..." className="min-h-[120px]" />
          </div>
          
          <div>
            <Label className="mb-2 block">Please check any symptoms you are experiencing:</Label>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Mood Symptoms</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {symptoms.mood.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`symptom-${symptom}`} 
                      onCheckedChange={(checked) => 
                        handleSymptomChange(symptom, checked === true)
                      }
                    />
                    <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Physical Symptoms</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {symptoms.physical.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`symptom-${symptom}`} 
                      onCheckedChange={(checked) => 
                        handleSymptomChange(symptom, checked === true)
                      }
                    />
                    <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Behavioral Symptoms</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {symptoms.behavioral.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`symptom-${symptom}`} 
                      onCheckedChange={(checked) => 
                        handleSymptomChange(symptom, checked === true)
                      }
                    />
                    <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Cognitive Symptoms</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {symptoms.cognitive.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`symptom-${symptom}`} 
                      onCheckedChange={(checked) => 
                        handleSymptomChange(symptom, checked === true)
                      }
                    />
                    <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Life Stressors</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {symptoms.lifeStressors.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`symptom-${symptom}`} 
                      onCheckedChange={(checked) => 
                        handleSymptomChange(symptom, checked === true)
                      }
                    />
                    <Label htmlFor={`symptom-${symptom}`}>{symptom}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block">Have you ever been hospitalized for psychiatric reasons?</Label>
            <RadioGroup defaultValue="no" className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="hospitalized-yes" />
                <Label htmlFor="hospitalized-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="hospitalized-no" />
                <Label htmlFor="hospitalized-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label className="mb-2 block">Have you ever attempted suicide?</Label>
            <RadioGroup defaultValue="no" className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="suicide-yes" />
                <Label htmlFor="suicide-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="suicide-no" />
                <Label htmlFor="suicide-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label className="mb-2 block">Have you ever been placed on a psychiatric hold?</Label>
            <RadioGroup defaultValue="no" className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="psychhold-yes" />
                <Label htmlFor="psychhold-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="psychhold-no" />
                <Label htmlFor="psychhold-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="lifeChanges">Have there been any significant life changes or stressful events that may be contributing to your current difficulties?</Label>
            <Textarea id="lifeChanges" placeholder="Describe any significant life changes..." className="min-h-[120px]" />
          </div>
          
          <div>
            <Label htmlFor="additionalInfo">Is there anything else you'd like me to know about your current situation?</Label>
            <Textarea id="additionalInfo" placeholder="Any additional information..." className="min-h-[120px]" />
          </div>
          
          <div>
            <Label htmlFor="counselingGoals">What are your goals for counseling?</Label>
            <Textarea id="counselingGoals" placeholder="Describe your goals..." className="min-h-[120px]" />
          </div>
        </CardContent>
      </Card>
      
      {/* Childhood and Family History */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Childhood and Family History</CardTitle>
          <CardDescription>Information about your childhood and family background</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">Please check any of the following that describe your childhood experience:</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {childhoodExperiences.map((experience) => (
                <div key={experience} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`childhood-${experience}`} 
                    onCheckedChange={(checked) => 
                      handleChildhoodExperienceChange(experience, checked === true)
                    }
                  />
                  <Label htmlFor={`childhood-${experience}`}>{experience}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="childhoodElaboration">Please elaborate on any of the above or add any other significant childhood experiences:</Label>
            <Textarea id="childhoodElaboration" placeholder="Describe your childhood experiences..." className="min-h-[120px]" />
          </div>
          
          <div>
            <Label className="mb-4 block">Please list your family of origin (the family you grew up with):</Label>
            {family.map((member, index) => (
              <div key={member.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`familyType-${index}`}>Relationship Type</Label>
                    <Select id={`familyType-${index}`}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`familyName-${index}`}>Name</Label>
                    <Input id={`familyName-${index}`} placeholder="Enter name" />
                  </div>
                  <div>
                    <Label htmlFor={`familyPersonality-${index}`}>Personality</Label>
                    <Input id={`familyPersonality-${index}`} placeholder="Describe personality" />
                  </div>
                  <div>
                    <Label htmlFor={`familyRelationshipGrowing-${index}`}>Relationship While Growing Up</Label>
                    <Input id={`familyRelationshipGrowing-${index}`} placeholder="Describe relationship" />
                  </div>
                  <div>
                    <Label htmlFor={`familyRelationshipNow-${index}`}>Relationship Now</Label>
                    <Input id={`familyRelationshipNow-${index}`} placeholder="Describe current relationship" />
                  </div>
                </div>
                {family.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFamily(family.filter(f => f.id !== member.id))}
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
              onClick={handleAddFamily}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Family Member
            </Button>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="sameHousehold" 
                checked={sameHousehold}
                onCheckedChange={(checked) => setSameHousehold(checked === true)}
              />
              <Label htmlFor="sameHousehold">My current household is the same as my family of origin</Label>
            </div>
            
            {!sameHousehold && (
              <div>
                <Label className="mb-4 block">Please list your current household members:</Label>
                {currentHousehold.map((member, index) => (
                  <div key={member.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor={`householdType-${index}`}>Relationship Type</Label>
                        <Select id={`householdType-${index}`}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationshipTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`householdName-${index}`}>Name</Label>
                        <Input id={`householdName-${index}`} placeholder="Enter name" />
                      </div>
                      <div>
                        <Label htmlFor={`householdPersonality-${index}`}>Personality</Label>
                        <Input id={`householdPersonality-${index}`} placeholder="Describe personality" />
                      </div>
                      <div>
                        <Label htmlFor={`householdRelationship-${index}`}>Relationship</Label>
                        <Input id={`householdRelationship-${index}`} placeholder="Describe relationship" />
                      </div>
                    </div>
                    {currentHousehold.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentHousehold(currentHousehold.filter(h => h.id !== member.id))}
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
                  onClick={handleAddHousehold}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Household Member
                </Button>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="occupation">Current Occupation (if student, indicate school and grade/year):</Label>
            <Textarea id="occupation" placeholder="Describe your occupation..." />
          </div>
          
          <div id="education">
            <Label className="mb-2 block">Highest Level of Education Completed:</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                {educationOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Relationship History */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Relationship History</CardTitle>
          <CardDescription>Information about your significant relationships</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">Are you currently married or in a committed relationship?</Label>
            <RadioGroup 
              defaultValue="no" 
              className="flex space-x-4"
              onValueChange={(value) => setIsMarried(value === "yes")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="married-yes" />
                <Label htmlFor="married-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="married-no" />
                <Label htmlFor="married-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          
          {isMarried && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="spouseName">Spouse/Partner Name</Label>
                <Input id="spouseName" placeholder="Enter name" />
              </div>
              <div>
                <Label htmlFor="spousePersonality">Personality</Label>
                <Input id="spousePersonality" placeholder="Describe personality" />
              </div>
              <div>
                <Label htmlFor="spouseRelationship">Quality of Relationship</Label>
                <Input id="spouseRelationship" placeholder="Describe relationship" />
              </div>
            </div>
          )}
          
          <div>
            <Label className="mb-2 block">Have you had any previous marriages or significant relationships?</Label>
            <RadioGroup 
              defaultValue="no" 
              className="flex space-x-4"
              onValueChange={(value) => setShowPastSpouses(value === "yes")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="pastSpouses-yes" />
                <Label htmlFor="pastSpouses-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="pastSpouses-no" />
                <Label htmlFor="pastSpouses-no">No</Label>
              </div>
            </RadioGroup>
          </div>
          
          {showPastSpouses && (
            <div>
              <Label className="mb-4 block">Previous Marriages/Significant Relationships</Label>
              {pastSpouses.map((spouse, index) => (
                <div key={spouse.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`pastSpouseName-${index}`}>Name</Label>
                      <Input id={`pastSpouseName-${index}`} placeholder="Enter name" />
                    </div>
                    <div>
                      <Label htmlFor={`pastSpousePersonality-${index}`}>Personality</Label>
                      <Input id={`pastSpousePersonality-${index}`} placeholder="Describe personality" />
                    </div>
                    <div>
                      <Label htmlFor={`pastSpouseRelationship-${index}`}>Reason for Ending</Label>
                      <Input id={`pastSpouseRelationship-${index}`} placeholder="Describe reason" />
                    </div>
                  </div>
                  {pastSpouses.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPastSpouses(pastSpouses.filter(s => s.id !== spouse.id))}
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
                onClick={handleAddSpouse}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Past Relationship
              </Button>
            </div>
          )}
          
          <div>
            <Label htmlFor="relationshipProblems">Please describe any current relationship problems:</Label>
            <Textarea id="relationshipProblems" placeholder="Describe any relationship problems..." className="min-h-[120px]" />
          </div>
        </CardContent>
      </Card>
      
      {/* Medical and Mental Health History */}
      <Card>
        <CardHeader>
          <CardTitle>Medical and Mental Health History</CardTitle>
          <CardDescription>Information about your medical and mental health background</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">Have you ever received Mental Health Treatment before?</Label>
            <RadioGroup 
              defaultValue="no" 
              className="flex space-x-4"
              onValueChange={(value) => setShowTreatments(value === "yes")}
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
          </div>
          
          {showTreatments && (
            <div>
              <Label className="mb-4 block">Please list any current or past mental health professionals who have treated you as well as any psychiatric hospitalizations or addiction treatment facilities you have experienced</Label>
              {treatments.map((treatment, index) => (
                <div key={treatment.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`treatmentYear-${index}`}>Last Year Treatment was Received</Label>
                      <Input id={`treatmentYear-${index}`} placeholder="Enter year" />
                    </div>
                    <div>
                      <Label htmlFor={`treatmentReason-${index}`}>Reason for Treatment</Label>
                      <Input id={`treatmentReason-${index}`} placeholder="Enter reason" />
                    </div>
                    <div>
                      <Label htmlFor={`treatmentLength-${index}`}>Treatment Length</Label>
                      <Input id={`treatmentLength-${index}`} placeholder="Enter length" />
                    </div>
                    <div>
                      <Label htmlFor={`treatmentProvider-${index}`}>Provider/Hospital Name</Label>
                      <Input id={`treatmentProvider-${index}`} placeholder="Enter provider name" />
                    </div>
                  </div>
                  {treatments.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTreatments(treatments.filter(t => t.id !== treatment.id))}
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
                onClick={handleAddTreatment}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Treatment
              </Button>
            </div>
          )}
          
          <div>
            <Label className="mb-2 block">Please Check any of the following that apply</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {medicalConditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`medical-${condition}`} 
                    onCheckedChange={(checked) => 
                      handleMedicalConditionChange(condition, checked === true)
                    }
                  />
                  <Label htmlFor={`medical-${condition}`}>{condition}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="chronicHealth">List any other chronic health problems or concerns</Label>
            <Textarea id="chronicHealth" placeholder="Describe any chronic health problems..." className="min-h-[120px]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sleepHours">Average hours slept each night?</Label>
              <Input id="sleepHours" placeholder="Enter hours" />
            </div>
            <div>
              <Label htmlFor="alcoholUse">Average Weekly Alcoholic Beverages Consumed</Label>
              <Input id="alcoholUse" placeholder="Enter number" />
            </div>
            <div>
              <Label htmlFor="tobaccoUse">Tobacco Use per Day</Label>
              <Input id="tobaccoUse" placeholder="Enter amount" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="drugUse">Recreational Drugs used in the Past Year</Label>
            <Textarea id="drugUse" placeholder="List any drugs used..." />
          </div>
          
          <div>
            <Label className="mb-2 block">Do you take any prescription medications?</Label>
            <RadioGroup 
              defaultValue="no" 
              className="flex space-x-4"
              onValueChange={(value) => setShowMedications(value === "yes")}
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
          </div>
          
          {showMedications && (
            <div>
              <Label className="mb-4 block">Medications</Label>
              {medications.map((medication, index) => (
                <div key={medication.id} className="mb-6 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`medicationName-${index}`}>Name of Medication</Label>
                      <Input id={`medicationName-${index}`} placeholder="Enter medication name" />
                    </div>
                    <div>
                      <Label htmlFor={`medicationPurpose-${index}`}>Purpose</Label>
                      <Input id={`medicationPurpose-${index}`} placeholder="Enter purpose" />
                    </div>
                    <div>
                      <Label htmlFor={`medicationDuration-${index}`}>How long have you taken this?</Label>
                      <Input id={`medicationDuration-${index}`} placeholder="Enter duration" />
                    </div>
                  </div>
                  {medications.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setMedications(medications.filter(m => m.id !== medication.id))}
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
                onClick={handleAddMedication}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Medication
              </Button>
            </div>
          )}
          
          <div>
            <Label htmlFor="strengths">Tell me about your personal strengths and important accomplishments</Label>
            <Textarea id="strengths" placeholder="Describe your personal strengths and accomplishments..." className="min-h-[120px]" />
          </div>
          
          <div>
            <Label htmlFor="hobbies">Please list any hobbies or activities you participate in</Label>
            <Textarea id="hobbies" placeholder="List hobbies and activities..." className="min-h-[120px]" />
          </div>
          
          <div>
            <Label htmlFor="additionalInfo2">What else would you like me to know?</Label>
            <Textarea id="additionalInfo2" placeholder="Any additional information..." className="min-h-[120px]" />
          </div>
          
          <div>
            <Label htmlFor="signature">Signature (type your name as the person signing this)</Label>
            <Input id="signature" placeholder="Type your full name" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={handleFormSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Submitting...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Submit Form
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ClientHistoryTemplate;
