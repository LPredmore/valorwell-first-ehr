import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DiagnosisSelector } from "@/components/DiagnosisSelector";
import { useToast } from "@/hooks/use-toast";
import { handleFormSubmission } from "@/utils/formSubmissionUtils";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";

const TreatmentPlanTemplate = ({ clientId, onClose }: { clientId: string, onClose: () => void }) => {
  const { toast } = useToast();
  const { userId } = useUser();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formState, setFormState] = useState({
    clientName: '',
    clientDOB: '',
    clientId: '',
    clinicianName: '',
    diagnosisCodes: [] as string[],
    diagnosisDescription: '',
    presentingProblems: '',
    treatmentGoals: '',
    treatmentApproach: '',
    treatmentFrequency: '',
    treatmentDuration: '',
    dischargeGoals: '',
    additionalNotes: '',
    signature: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchClientData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (error) {
          throw error;
        }

        setClientData(data);
        setFormState(prev => ({
          ...prev,
          clientName: `${data.client_first_name || ''} ${data.client_last_name || ''}`.trim(),
          clientDOB: data.client_date_of_birth || '',
          clientId: data.id,
          diagnosisCodes: data.client_diagnosis || [],
          diagnosisDescription: data.client_diagnosis_description || '',
          presentingProblems: data.client_presenting_problems || '',
          treatmentGoals: data.client_treatment_goals || '',
          treatmentApproach: data.client_treatment_approach || '',
          treatmentFrequency: data.client_treatmentfrequency || '',
          treatmentDuration: data.client_treatment_duration || '',
          dischargeGoals: data.client_discharge_goals || '',
          additionalNotes: data.client_treatment_notes || '',
        }));

        // Fetch clinician name
        if (data.client_assigned_therapist) {
          const { data: clinicianData, error: clinicianError } = await supabase
            .from('clinicians')
            .select('clinician_professional_name')
            .eq('id', data.client_assigned_therapist)
            .single();

          if (!clinicianError && clinicianData) {
            setFormState(prev => ({
              ...prev,
              clinicianName: clinicianData.clinician_professional_name || '',
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
        toast({
          title: "Error",
          description: "Failed to load client data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchClientData();
    }
  }, [clientId, toast]);

  const handleChange = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update client data with treatment plan information
      const clientUpdates = {
        client_diagnosis: formState.diagnosisCodes,
        client_diagnosis_description: formState.diagnosisDescription,
        client_presenting_problems: formState.presentingProblems,
        client_treatment_goals: formState.treatmentGoals,
        client_treatment_approach: formState.treatmentApproach,
        client_treatmentfrequency: formState.treatmentFrequency,
        client_treatment_duration: formState.treatmentDuration,
        client_discharge_goals: formState.dischargeGoals,
        client_treatment_notes: formState.additionalNotes,
      };

      const { error: updateError } = await supabase
        .from('clients')
        .update(clientUpdates)
        .eq('id', clientId);

      if (updateError) {
        throw updateError;
      }

      // Generate and save PDF
      if (contentRef.current) {
        const documentInfo = {
          clientId: clientId,
          documentType: 'treatment_plan',
          documentDate: new Date(),
          documentTitle: 'Treatment Plan',
          createdBy: userId || undefined
        };

        const result = await handleFormSubmission(
          'treatment-plan-content',
          documentInfo,
          'Treatment Plan',
          formState
        );

        if (!result.success) {
          throw new Error(result.message || 'Failed to save treatment plan');
        }

        toast({
          title: "Success",
          description: "Treatment plan saved successfully",
        });

        onClose();
      }
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      toast({
        title: "Error",
        description: "Failed to save treatment plan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Treatment Plan</h1>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div ref={contentRef} id="treatment-plan-content" className="space-y-6 bg-white p-6 rounded-lg border">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Treatment Plan</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formState.clientName}
                  onChange={(e) => handleChange('clientName', e.target.value)}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="clientDOB">Date of Birth</Label>
                <Input
                  id="clientDOB"
                  value={formState.clientDOB}
                  onChange={(e) => handleChange('clientDOB', e.target.value)}
                  disabled
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinicianName">Clinician Name</Label>
              <Input
                id="clinicianName"
                value={formState.clinicianName}
                onChange={(e) => handleChange('clinicianName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <DiagnosisSelector 
                value={formState.diagnosisCodes} 
                onChange={(codes) => handleChange('diagnosisCodes', codes)} 
              />
            </div>

            <div>
              <Label htmlFor="diagnosisDescription">Diagnosis Description</Label>
              <Textarea
                id="diagnosisDescription"
                value={formState.diagnosisDescription}
                onChange={(e) => handleChange('diagnosisDescription', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="presentingProblems">Presenting Problems</Label>
              <Textarea
                id="presentingProblems"
                value={formState.presentingProblems}
                onChange={(e) => handleChange('presentingProblems', e.target.value)}
                rows={4}
                placeholder="Describe the client's presenting problems and symptoms"
              />
            </div>

            <div>
              <Label htmlFor="treatmentGoals">Treatment Goals</Label>
              <Textarea
                id="treatmentGoals"
                value={formState.treatmentGoals}
                onChange={(e) => handleChange('treatmentGoals', e.target.value)}
                rows={4}
                placeholder="List specific, measurable treatment goals"
              />
            </div>

            <div>
              <Label htmlFor="treatmentApproach">Treatment Approach</Label>
              <Textarea
                id="treatmentApproach"
                value={formState.treatmentApproach}
                onChange={(e) => handleChange('treatmentApproach', e.target.value)}
                rows={4}
                placeholder="Describe the therapeutic approach and interventions"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="treatmentFrequency">Treatment Frequency</Label>
                <Select
                  value={formState.treatmentFrequency}
                  onValueChange={(value) => handleChange('treatmentFrequency', value)}
                >
                  <SelectTrigger id="treatmentFrequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="asneeded">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="treatmentDuration">Expected Treatment Duration</Label>
                <Select
                  value={formState.treatmentDuration}
                  onValueChange={(value) => handleChange('treatmentDuration', value)}
                >
                  <SelectTrigger id="treatmentDuration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3 months">1-3 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="6-12 months">6-12 months</SelectItem>
                    <SelectItem value="12+ months">12+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dischargeGoals">Discharge Criteria</Label>
              <Textarea
                id="dischargeGoals"
                value={formState.dischargeGoals}
                onChange={(e) => handleChange('dischargeGoals', e.target.value)}
                rows={3}
                placeholder="Criteria for successful completion of treatment"
              />
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={formState.additionalNotes}
                onChange={(e) => handleChange('additionalNotes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="signature">Clinician Signature</Label>
                <Input
                  id="signature"
                  value={formState.signature}
                  onChange={(e) => handleChange('signature', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formState.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Treatment Plan'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TreatmentPlanTemplate;
