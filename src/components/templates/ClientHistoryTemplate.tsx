import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const ClientHistoryTemplate = () => {
  const { toast } = useToast();

  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: undefined,
    gender: '',
    sexualOrientation: '',
    relationshipStatus: '',
    livingSituation: '',
    occupation: '',
    educationLevel: '',
    primaryLanguage: '',
    secondaryLanguage: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
  });

  const [familyMembers, setFamilyMembers] = useState([
    {
      name: '',
      relationshipType: '',
      dateOfBirth: undefined,
      livingStatus: '',
      occupation: '',
      educationLevel: '',
      significantHistory: '',
    },
  ]);

  const [householdMembers, setHouseholdMembers] = useState([
    {
      name: '',
      relationshipType: '',
      dateOfBirth: undefined,
      livingStatus: '',
      occupation: '',
      educationLevel: '',
      significantHistory: '',
    },
  ]);

  const [presentingProblems, setPresentingProblems] = useState({
    chiefComplaint: '',
    symptoms: '',
    triggers: '',
    duration: '',
    severity: '',
    impactOnFunctioning: '',
    previousTreatment: '',
    currentTreatment: '',
    goalsForTreatment: '',
  });

  const [medicalHistory, setMedicalHistory] = useState({
    currentMedications: '',
    allergies: '',
    chronicIllnesses: '',
    pastHospitalizations: '',
    surgeries: '',
    immunizationStatus: '',
    sleepPatterns: '',
    dietaryHabits: '',
    exercisePatterns: '',
    substanceUse: '',
  });

  const [mentalHealthHistory, setMentalHealthHistory] = useState({
    previousDiagnoses: '',
    previousTherapy: '',
    previousMedications: '',
    hospitalizations: '',
    suicideAttempts: '',
    selfHarmBehaviors: '',
    traumaHistory: '',
    familyMentalHealthHistory: '',
  });

  const [developmentalHistory, setDevelopmentalHistory] = useState({
    earlyChildhood: '',
    milestones: '',
    schoolExperience: '',
    socialRelationships: '',
    significantEvents: '',
  });

  const [socialHistory, setSocialHistory] = useState({
    culturalBackground: '',
    religiousBeliefs: '',
    communityInvolvement: '',
    legalIssues: '',
    financialSituation: '',
    militaryService: '',
    relationshipHistory: '',
    socialSupport: '',
  });

  const [vocationalHistory, setVocationalHistory] = useState({
    employmentHistory: '',
    jobSatisfaction: '',
    careerGoals: '',
    workEnvironment: '',
  });

  const [educationalHistory, setEducationalHistory] = useState({
    academicPerformance: '',
    learningStyle: '',
    specialEducation: '',
    educationalGoals: '',
  });

  const [riskAssessment, setRiskAssessment] = useState({
    suicideRisk: '',
    homicideRisk: '',
    selfNeglectRisk: '',
    vulnerabilityRisk: '',
  });

  const [strengthsResources, setStrengthsResources] = useState({
    personalStrengths: '',
    supportSystem: '',
    copingSkills: '',
    communityResources: '',
  });

  const [culturalConsiderations, setCulturalConsiderations] = useState({
    culturalBackground: '',
    languageBarriers: '',
    culturalBeliefs: '',
    discriminationExperiences: '',
  });

  const [additionalInformation, setAdditionalInformation] = useState({
    anythingElse: '',
  });

  const [date, setDate] = useState<Date | undefined>(new Date());

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmergencyContact(prev => ({ ...prev, [name]: value }));
  };

  const handleFamilyMemberChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFamilyMembers(prev => {
      const newFamilyMembers = [...prev];
      newFamilyMembers[index][name] = value;
      return newFamilyMembers;
    });
  };

  const handleHouseholdMemberChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHouseholdMembers(prev => {
      const newHouseholdMembers = [...prev];
      newHouseholdMembers[index][name] = value;
      return newHouseholdMembers;
    });
  };

  const handlePresentingProblemsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPresentingProblems(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicalHistoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMedicalHistory(prev => ({ ...prev, [name]: value }));
  };

  const handleMentalHealthHistoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMentalHealthHistory(prev => ({ ...prev, [name]: value }));
  };

  const handleDevelopmentalHistoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDevelopmentalHistory(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialHistoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSocialHistory(prev => ({ ...prev, [name]: value }));
  };

  const handleVocationalHistoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVocationalHistory(prev => ({ ...prev, [name]: value }));
  };

  const handleEducationalHistoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEducationalHistory(prev => ({ ...prev, [name]: value }));
  };

  const handleRiskAssessmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRiskAssessment(prev => ({ ...prev, [name]: value }));
  };

  const handleStrengthsResourcesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStrengthsResources(prev => ({ ...prev, [name]: value }));
  };

  const handleCulturalConsiderationsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCulturalConsiderations(prev => ({ ...prev, [name]: value }));
  };

  const handleAdditionalInformationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdditionalInformation(prev => ({ ...prev, [name]: value }));
  };

  const addFamilyMember = () => {
    setFamilyMembers(prev => [
      ...prev,
      {
        name: '',
        relationshipType: '',
        dateOfBirth: undefined,
        livingStatus: '',
        occupation: '',
        educationLevel: '',
        significantHistory: '',
      },
    ]);
  };

  const addHouseholdMember = () => {
    setHouseholdMembers(prev => [
      ...prev,
      {
        name: '',
        relationshipType: '',
        dateOfBirth: undefined,
        livingStatus: '',
        occupation: '',
        educationLevel: '',
        significantHistory: '',
      },
    ]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(prev => prev.filter((_, i) => i !== index));
  };

  const removeHouseholdMember = (index: number) => {
    setHouseholdMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Client History Submitted",
      description: "Your client history has been successfully submitted.",
    })
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              type="text"
              id="firstName"
              name="firstName"
              value={personalInfo.firstName}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              type="text"
              id="lastName"
              name="lastName"
              value={personalInfo.lastName}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="preferredName">Preferred Name</Label>
            <Input
              type="text"
              id="preferredName"
              name="preferredName"
              value={personalInfo.preferredName}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Input
              type="text"
              id="gender"
              name="gender"
              value={personalInfo.gender}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="sexualOrientation">Sexual Orientation</Label>
            <Input
              type="text"
              id="sexualOrientation"
              name="sexualOrientation"
              value={personalInfo.sexualOrientation}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="relationshipStatus">Relationship Status</Label>
            <Input
              type="text"
              id="relationshipStatus"
              name="relationshipStatus"
              value={personalInfo.relationshipStatus}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="livingSituation">Living Situation</Label>
            <Input
              type="text"
              id="livingSituation"
              name="livingSituation"
              value={personalInfo.livingSituation}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              type="text"
              id="occupation"
              name="occupation"
              value={personalInfo.occupation}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="educationLevel">Education Level</Label>
            <Input
              type="text"
              id="educationLevel"
              name="educationLevel"
              value={personalInfo.educationLevel}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="primaryLanguage">Primary Language</Label>
            <Input
              type="text"
              id="primaryLanguage"
              name="primaryLanguage"
              value={personalInfo.primaryLanguage}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="secondaryLanguage">Secondary Language</Label>
            <Input
              type="text"
              id="secondaryLanguage"
              name="secondaryLanguage"
              value={personalInfo.secondaryLanguage}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={personalInfo.email}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={personalInfo.phone}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              type="text"
              id="address"
              name="address"
              value={personalInfo.address}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              type="text"
              id="city"
              name="city"
              value={personalInfo.city}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              type="text"
              id="state"
              name="state"
              value={personalInfo.state}
              onChange={handlePersonalInfoChange}
            />
          </div>
          <div>
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input
              type="text"
              id="zipCode"
              name="zipCode"
              value={personalInfo.zipCode}
              onChange={handlePersonalInfoChange}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Emergency Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyName">Name</Label>
            <Input
              type="text"
              id="emergencyName"
              name="name"
              value={emergencyContact.name}
              onChange={handleEmergencyContactChange}
            />
          </div>
          <div>
            <Label htmlFor="emergencyRelationship">Relationship</Label>
            <Input
              type="text"
              id="emergencyRelationship"
              name="relationship"
              value={emergencyContact.relationship}
              onChange={handleEmergencyContactChange}
            />
          </div>
          <div>
            <Label htmlFor="emergencyPhone">Phone</Label>
            <Input
              type="tel"
              id="emergencyPhone"
              name="phone"
              value={emergencyContact.phone}
              onChange={handleEmergencyContactChange}
            />
          </div>
          <div>
            <Label htmlFor="emergencyEmail">Email</Label>
            <Input
              type="email"
              id="emergencyEmail"
              name="email"
              value={emergencyContact.email}
              onChange={handleEmergencyContactChange}
            />
          </div>
          <div>
            <Label htmlFor="emergencyAddress">Address</Label>
            <Input
              type="text"
              id="emergencyAddress"
              name="address"
              value={emergencyContact.address}
              onChange={handleEmergencyContactChange}
            />
          </div>
        </div>
      </div>

      {/* Family Members */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Family Members</h2>
        {familyMembers.map((member, index) => (
          <div key={index} className="border p-4 rounded-md mb-4">
            <h3 className="text-xl font-semibold mb-2">Family Member #{index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor={`familyName-${index}`}>Name</Label>
                <Input
                  type="text"
                  id={`familyName-${index}`}
                  name="name"
                  value={member.name}
                  onChange={(e) => handleFamilyMemberChange(index, e)}
                />
              </div>
              <div>
                <Label htmlFor={`familyType-${index}`}>Relationship Type</Label>
                <Select>
                  <SelectTrigger id={`familyType-${index}`}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Grandparent">Grandparent</SelectItem>
                    <SelectItem value="Aunt/Uncle">Aunt/Uncle</SelectItem>
                    <SelectItem value="Cousin">Cousin</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`familyDOB-${index}`}>Date of Birth</Label>
                <Input
                  type="date"
                  id={`familyDOB-${index}`}
                  name="dateOfBirth"
                  value={member.dateOfBirth}
                  onChange={(e) => handleFamilyMemberChange(index, e)}
                />
              </div>
              <div>
                <Label htmlFor={`familyLiving-${index}`}>Living Status</Label>
                <Input
                  type="text"
                  id={`familyLiving-${index}`}
                  name="livingStatus"
                  value={member.livingStatus}
                  onChange={(e) => handleFamilyMemberChange(index, e)}
                />
              </div>
              <div>
                <Label htmlFor={`familyOccupation-${index}`}>Occupation</Label>
                <Input
                  type="text"
                  id={`familyOccupation-${index}`}
                  name="occupation"
                  value={member.occupation}
                  onChange={(e) => handleFamilyMemberChange(index, e)}
                />
              </div>
              <div>
                <Label htmlFor={`familyEducation-${index}`}>Education Level</Label>
                <Input
                  type="text"
                  id={`familyEducation-${index}`}
                  name="educationLevel"
                  value={member.educationLevel}
                  onChange={(e) => handleFamilyMemberChange(index, e)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`familyHistory-${index}`}>Significant History</Label>
              <Textarea
                id={`familyHistory-${index}`}
                name="significantHistory"
                value={member.significantHistory}
                onChange={(e) => handleFamilyMemberChange(index, e)}
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => removeFamilyMember(index)}>
              Remove Family Member
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addFamilyMember}>
          Add Family Member
        </Button>
      </div>

      {/* Household Members */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Household Members</h2>
        {householdMembers.map((member, index) => (
          <div key={index} className="border p-4 rounded-md mb-4">
            <h3 className="text-xl font-semibold mb-2">Household Member #{index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor={`householdName-${index}`}>Name</Label>
                <Input
                  type="text"
                  id={`householdName-${index}`}
                  name="name"
                  value={member.name}
                  onChange={(e) => handleHouseholdMemberChange(index, e)}
                />
              </div>
              <div>
                <Label htmlFor={`householdType-${index}`}>Relationship Type</Label>
                <Select>
                  <SelectTrigger id={`householdType-${index}`}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Roommate">Roommate</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`householdDOB-${index}`}>Date of Birth</Label>
                <Input
                  type="date"
                  id={`householdDOB-${index}`}
                  name="dateOfBirth"
                  value={member.dateOfBirth}
                  onChange={(e) => handleHouseholdMemberChange(index, e)}
                />
              </div>
              <div>
                <Label htmlFor={`householdLiving-${index}`}>Living Status</Label>
                <Input
                  type="text"
                  id={`householdLiving-${index}`}
                  name="livingStatus"
                  value={member.livingStatus}
                  onChange={(e) => handleHouseholdMemberChange(index, e)}
                />
              </div>
              <div>
                <Label htmlFor={`householdOccupation-${index}`}>Occupation</Label>
                <Input
                  type="text"
                  id={`householdOccupation-${index}`}
                  name="occupation"
                  value={member.occupation}
                  onChange={(e) => handleHouseholdMemberChange(index, e)}
                />
              </div>
              <div>
                <Label htmlFor={`householdEducation-${index}`}>Education Level</Label>
                <Input
                  type="text"
                  id={`householdEducation-${index}`}
                  name="educationLevel"
                  value={member.educationLevel}
                  onChange={(e) => handleHouseholdMemberChange(index, e)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`householdHistory-${index}`}>Significant History</Label>
              <Textarea
                id={`householdHistory-${index}`}
                name="significantHistory"
                value={member.significantHistory}
                onChange={(e) => handleHouseholdMemberChange(index, e)}
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => removeHouseholdMember(index)}>
              Remove Household Member
            </Button>
          </div>
        ))}
        <Button type="button" onClick={addHouseholdMember}>
          Add Household Member
        </Button>
      </div>

      {/* Presenting Problems */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Presenting Problems</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="chiefComplaint">Chief Complaint</Label>
            <Input
              type="text"
              id="chiefComplaint"
              name="chiefComplaint"
              value={presentingProblems.chiefComplaint}
              onChange={handlePresentingProblemsChange}
            />
          </div>
          <div>
            <Label htmlFor="symptoms">Symptoms</Label>
            <Input
              type="text"
              id="symptoms"
              name="symptoms"
              value={presentingProblems.symptoms}
              onChange={handlePresentingProblemsChange}
            />
          </div>
          <div>
            <Label htmlFor="triggers">Triggers</Label>
            <Input
              type="text"
              id="triggers"
              name="triggers"
              value={presentingProblems.triggers}
              onChange={handlePresentingProblemsChange}
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Input
              type="text"
              id="duration"
              name="duration"
              value={presentingProblems.duration}
              onChange={handlePresentingProblemsChange}
            />
          </div>
          <div>
            <Label htmlFor="severity">Severity</Label>
            <Input
              type="text"
              id="severity"
              name="severity"
              value={presentingProblems.severity}
              onChange={handlePresentingProblemsChange}
            />
          </div>
          <div>
            <Label htmlFor="impactOnFunctioning">Impact on Functioning</Label>
            <Input
              type="text"
              id="impactOnFunctioning"
              name="impactOnFunctioning"
              value={presentingProblems.impactOnFunctioning}
              onChange={handlePresentingProblemsChange}
            />
          </div>
          <div>
            <Label htmlFor="previousTreatment">Previous Treatment</Label>
            <Input
              type="text"
              id="previousTreatment"
              name="previousTreatment"
              value={presentingProblems.previousTreatment}
              onChange={handlePresentingProblemsChange}
            />
          </div>
          <div>
            <Label htmlFor="currentTreatment">Current Treatment</Label>
            <Input
              type="text"
              id="currentTreatment"
              name="currentTreatment"
              value={presentingProblems.currentTreatment}
              onChange={handlePresentingProblemsChange}
            />
          </div>
          <div>
            <Label htmlFor="goalsForTreatment">Goals for Treatment</Label>
            <Input
              type="text"
              id="goalsForTreatment"
              name="goalsForTreatment"
              value={presentingProblems.goalsForTreatment}
              onChange={handlePresentingProblemsChange}
            />
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Medical History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentMedications">Current Medications</Label>
            <Input
              type="text"
              id="currentMedications"
              name="currentMedications"
              value={medicalHistory.currentMedications}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              type="text"
              id="allergies"
              name="allergies"
              value={medicalHistory.allergies}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="chronicIllnesses">Chronic Illnesses</Label>
            <Input
              type="text"
              id="chronicIllnesses"
              name="chronicIllnesses"
              value={medicalHistory.chronicIllnesses}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="pastHospitalizations">Past Hospitalizations</Label>
            <Input
              type="text"
              id="pastHospitalizations"
              name="pastHospitalizations"
              value={medicalHistory.pastHospitalizations}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="surgeries">Surgeries</Label>
            <Input
              type="text"
              id="surgeries"
              name="surgeries"
              value={medicalHistory.surgeries}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="immunizationStatus">Immunization Status</Label>
            <Input
              type="text"
              id="immunizationStatus"
              name="immunizationStatus"
              value={medicalHistory.immunizationStatus}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="sleepPatterns">Sleep Patterns</Label>
            <Input
              type="text"
              id="sleepPatterns"
              name="sleepPatterns"
              value={medicalHistory.sleepPatterns}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="dietaryHabits">Dietary Habits</Label>
            <Input
              type="text"
              id="dietaryHabits"
              name="dietaryHabits"
              value={medicalHistory.dietaryHabits}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="exercisePatterns">Exercise Patterns</Label>
            <Input
              type="text"
              id="exercisePatterns"
              name="exercisePatterns"
              value={medicalHistory.exercisePatterns}
              onChange={handleMedicalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="substanceUse">Substance Use</Label>
            <Input
              type="text"
              id="substanceUse"
              name="substanceUse"
              value={medicalHistory.substanceUse}
              onChange={handleMedicalHistoryChange}
            />
          </div>
        </div>
      </div>

      {/* Mental Health History */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Mental Health History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="previousDiagnoses">Previous Diagnoses</Label>
            <Input
              type="text"
              id="previousDiagnoses"
              name="previousDiagnoses"
              value={mentalHealthHistory.previousDiagnoses}
              onChange={handleMentalHealthHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="previousTherapy">Previous Therapy</Label>
            <Input
              type="text"
              id="previousTherapy"
              name="previousTherapy"
              value={mentalHealthHistory.previousTherapy}
              onChange={handleMentalHealthHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="previousMedications">Previous Medications</Label>
            <Input
              type="text"
              id="previousMedications"
              name="previousMedications"
              value={mentalHealthHistory.previousMedications}
              onChange={handleMentalHealthHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="hospitalizations">Hospitalizations</Label>
            <Input
              type="text"
              id="hospitalizations"
              name="hospitalizations"
              value={mentalHealthHistory.hospitalizations}
              onChange={handleMentalHealthHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="suicideAttempts">Suicide Attempts</Label>
            <Input
              type="text"
              id="suicideAttempts"
              name="suicideAttempts"
              value={mentalHealthHistory.suicideAttempts}
              onChange={handleMentalHealthHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="selfHarmBehaviors">Self-Harm Behaviors</Label>
            <Input
              type="text"
              id="selfHarmBehaviors"
              name="selfHarmBehaviors"
              value={mentalHealthHistory.selfHarmBehaviors}
              onChange={handleMentalHealthHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="traumaHistory">Trauma History</Label>
            <Input
              type="text"
              id="traumaHistory"
              name="traumaHistory"
              value={mentalHealthHistory.traumaHistory}
              onChange={handleMentalHealthHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="familyMentalHealthHistory">Family Mental Health History</Label>
            <Input
              type="text"
              id="familyMentalHealthHistory"
              name="familyMentalHealthHistory"
              value={mentalHealthHistory.familyMentalHealthHistory}
              onChange={handleMentalHealthHistoryChange}
            />
          </div>
        </div>
      </div>

      {/* Developmental History */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Developmental History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="earlyChildhood">Early Childhood</Label>
            <Input
              type="text"
              id="earlyChildhood"
              name="earlyChildhood"
              value={developmentalHistory.earlyChildhood}
              onChange={handleDevelopmentalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="milestones">Milestones</Label>
            <Input
              type="text"
              id="milestones"
              name="milestones"
              value={developmentalHistory.milestones}
              onChange={handleDevelopmentalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="schoolExperience">School Experience</Label>
            <Input
              type="text"
              id="schoolExperience"
              name="schoolExperience"
              value={developmentalHistory.schoolExperience}
              onChange={handleDevelopmentalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="socialRelationships">Social Relationships</Label>
            <Input
              type="text"
              id="socialRelationships"
              name="socialRelationships"
              value={developmentalHistory.socialRelationships}
              onChange={handleDevelopmentalHistoryChange}
            />
          </div>
          <div>
            <Label htmlFor="significantEvents">Significant Events</Label>
            <Input
              type="text"
              id="significantEvents"
              name="significantEvents"
              value={developmentalHistory.significantEvents}
              onChange={handleDevelopmentalHistoryChange}
            />
          </div>
        </div>
      </div>

      {/* Social History */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Social History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
