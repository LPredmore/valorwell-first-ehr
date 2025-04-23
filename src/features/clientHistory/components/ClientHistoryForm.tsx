
import React from 'react';
import { ClientData } from '@/hooks/useClientData';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useForm, FormProvider } from 'react-hook-form';
import { ClientHistoryFormData } from '../types';
import { Save, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientInfoDisplay } from './ClientInfoDisplay';
import { EmergencyContactSection } from './EmergencyContactSection';
import { CurrentIssuesSection } from './CurrentIssuesSection';
import { ChildhoodSection } from './ChildhoodSection';
import { FamilySection } from './FamilySection';
import { RelationshipSection } from './RelationshipSection';
import { MedicalHistorySection } from './MedicalHistorySection';
import { PersonalSection } from './PersonalSection';

interface ClientHistoryFormProps {
  onSubmit: (formData: ClientHistoryFormData) => void;
  isSubmitting: boolean;
  clientData?: ClientData | null;
}

const ClientHistoryForm: React.FC<ClientHistoryFormProps> = ({
  onSubmit,
  isSubmitting,
  clientData
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Initialize form with default values
  const methods = useForm<ClientHistoryFormData>({
    defaultValues: {
      emergencyContact: { name: '', relationship: '', phone: '' },
      currentIssues: '',
      progressionOfIssues: '',
      symptoms: [],
      hospitalizedPsychiatric: false,
      attemptedSuicide: false,
      psychHold: false,
      lifeChanges: '',
      additionalInfo: '',
      counselingGoals: '',
      childhoodExperiences: [],
      childhoodElaboration: '',
      isFamilySameAsHousehold: false,
      familyMembers: [
        { id: '1', relationshipType: '', name: '', personality: '', relationshipGrowing: '', relationshipNow: '' }
      ],
      householdMembers: [
        { id: '1', relationshipType: '', name: '', personality: '', relationshipNow: '' }
      ],
      occupationDetails: '',
      educationLevel: '',
      isMarried: false,
      currentSpouse: null,
      hasPastSpouses: false,
      pastSpouses: [],
      relationshipProblems: '',
      hasReceivedTreatment: false,
      pastTreatments: [],
      medicalConditions: [],
      chronicHealthProblems: '',
      sleepHours: '',
      alcoholUse: '',
      tobaccoUse: '',
      drugUse: '',
      takesMedications: false,
      medications: [],
      personalStrengths: '',
      hobbies: '',
      additionalInfo2: '',
      signature: '',
    }
  });

  const handleFormSubmit = methods.handleSubmit((data) => {
    // Validate signature as it's required
    if (!data.signature) {
      toast({
        title: "Error",
        description: "Please provide your signature to submit the form.",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure currentSpouse is properly formatted when isMarried is true
    if (data.isMarried) {
      if (!data.currentSpouse || !data.currentSpouse.name) {
        data.currentSpouse = {
          name: data.currentSpouse?.name || '',
          personality: data.currentSpouse?.personality || '',
          relationship: data.currentSpouse?.relationship || ''
        };
      }
    } else {
      data.currentSpouse = null;
    }
    
    onSubmit(data);
  });

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      navigate('/patient-dashboard');
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow" id="client-history-form">
      <h1 className="text-2xl font-bold mb-6 text-center">Client History Form</h1>
      
      {/* Display client information */}
      <ClientInfoDisplay clientData={clientData} />
      
      {/* Form with all sections */}
      <FormProvider {...methods}>
        <form onSubmit={handleFormSubmit}>
          <EmergencyContactSection form={methods} />
          <CurrentIssuesSection form={methods} />
          <ChildhoodSection form={methods} />
          <FamilySection form={methods} />
          <RelationshipSection form={methods} />
          <MedicalHistorySection form={methods} />
          <PersonalSection form={methods} />
          
          {/* Form submission buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              type="submit" 
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
        </form>
      </FormProvider>
    </div>
  );
};

export default ClientHistoryForm;
