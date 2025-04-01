import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FileText, LockKeyhole, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiagnosisSelector } from '@/components/DiagnosisSelector';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientDetails } from '@/types/client';
import { Skeleton } from "@/components/ui/skeleton";

interface SessionNoteTemplateProps {
  onClose: () => void;
  clinicianName?: string;
  clinicianNameInsurance?: string;
  clientData?: ClientDetails | null;
  appointmentDate?: string;
}

const SessionNoteTemplate: React.FC<SessionNoteTemplateProps> = ({
  onClose,
  clinicianName = '',
  clinicianNameInsurance = '',
  clientData = null,
  appointmentDate = ''
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>([]);
  const [hasExistingDiagnosis, setHasExistingDiagnosis] = useState(false);
  const [sessionTypes, setSessionTypes] = useState<{code: string, name: string}[]>([]);
  const [phq9Narrative, setPhq9Narrative] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPHQ9, setIsLoadingPHQ9] = useState(false);
  const [isLoadingSessionTypes, setIsLoadingSessionTypes] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  
  const [formState, setFormState] = useState({
    sessionDate: '',
    patientName: '',
    patientDOB: '',
    clinicianName: '',
    diagnosis: '',
    planType: '',
    treatmentFrequency: '',
    medications: '',
    sessionType: '',
    personsInAttendance: '',
    appearance: '',
    attitude: '',
    behavior: '',
    speech: '',
    affect: '',
    thoughtProcess: '',
    perception: '',
    orientation: '',
    memoryConcentration: '',
    insightJudgement: '',
    mood: '',
    substanceAbuseRisk: '',
    suicidalIdeation: '',
    homicidalIdeation: '',
    primaryObjective: '',
    intervention1: '',
    intervention2: '',
    secondaryObjective: '',
    intervention3: '',
    intervention4: '',
    tertiaryObjective: '',
    intervention5: '',
    intervention6: '',
    currentSymptoms: '',
    functioning: '',
    prognosis: '',
    progress: '',
    problemNarrative: '',
    treatmentGoalNarrative: '',
    sessionNarrative: '',
    phq9Narrative: '',
    nextTreatmentPlanUpdate: '',
    privateNote: '',
    signature: ''
  });
  
  const [editModes, setEditModes] = useState({
    appearance: false,
    attitude: false,
    behavior: false,
    speech: false,
    affect: false,
    thoughtProcess: false,
    perception: false,
    orientation: false,
    memoryConcentration: false,
    insightJudgement: false
  });

  useEffect(() => {
    const fetchSessionTypes = async () => {
      try {
        setIsLoadingSessionTypes(true);
        console.log("Fetching CPT codes for session types");
        const { data, error } = await supabase
          .from('cpt_codes')
          .select('code, name')
          .eq('status', 'Active');
          
        if (error) {
          console.error('Error fetching CPT codes:', error);
          toast({
            title: "Error",
            description: "Could not load session types. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        console.log("Fetched session types:", data);
        setSessionTypes(data || []);
      } catch (error) {
        console.error('Error in fetchSessionTypes:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading session types.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingSessionTypes(false);
      }
    };
    
    fetchSessionTypes();
  }, [toast]);

  useEffect(() => {
    const fetchLatestPHQ9 = async () => {
      if (!clientData?.id) return;
      
      try {
        setIsLoadingPHQ9(true);
        console.log("Fetching latest PHQ9 assessment for client:", clientData.id);
        const { data, error } = await supabase
          .from('phq9_assessments')
          .select('phq9_narrative')
          .eq('client_id', clientData.id)
          .order('assessment_date', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error('Error fetching PHQ-9 assessment:', error);
          return;
        }
        
        console.log("Fetched PHQ9 narrative:", data);
        if (data && data.length > 0 && data[0].phq9_narrative) {
          setPhq9Narrative(data[0].phq9_narrative);
          handleChange('phq9Narrative', data[0].phq9_narrative);
        }
      } catch (error) {
        console.error('Error in fetchLatestPHQ9:', error);
      } finally {
        setIsLoadingPHQ9(false);
      }
    };
    
    if (clientData?.id) {
      fetchLatestPHQ9();
    }
  }, [clientData]);

  useEffect(() => {
    if (clientData && !dataInitialized) {
      console.log("Setting form state from client data:", clientData);
      console.log("Clinician name:", clinicianName);
      console.log("Clinician name insurance:", clinicianNameInsurance);
      console.log("Appointment date:", appointmentDate);
      
      const existingDiagnosis = clientData.client_diagnosis && clientData.client_diagnosis.length > 0;
      setHasExistingDiagnosis(existingDiagnosis);
      if (existingDiagnosis) {
        setDiagnosisCodes(clientData.client_diagnosis || []);
      }
      
      setFormState(prevState => ({
        ...prevState,
        sessionDate: appointmentDate || '',
        patientName: `${clientData.client_first_name || ''} ${clientData.client_last_name || ''}`,
        patientDOB: clientData.client_date_of_birth || '',
        diagnosis: (clientData.client_diagnosis || []).join(', '),
        planType: clientData.client_planlength || '',
        treatmentFrequency: clientData.client_treatmentfrequency || '',
        medications: clientData.client_medications || '',
        personsInAttendance: clientData.client_personsinattendance || '',
        clinicianName: clinicianNameInsurance || clinicianName || '',
        appearance: clientData.client_appearance || '',
        attitude: clientData.client_attitude || '',
        behavior: clientData.client_behavior || '',
        speech: clientData.client_speech || '',
        affect: clientData.client_affect || '',
        thoughtProcess: clientData.client_thoughtprocess || '',
        perception: clientData.client_perception || '',
        orientation: clientData.client_orientation || '',
        memoryConcentration: clientData.client_memoryconcentration || '',
        insightJudgement: clientData.client_insightjudgement || '',
        mood: clientData.client_mood || '',
        substanceAbuseRisk: clientData.client_substanceabuserisk || '',
        suicidalIdeation: clientData.client_suicidalideation || '',
        homicidalIdeation: clientData.client_homicidalideation || '',
        primaryObjective: clientData.client_primaryobjective || '',
        intervention1: clientData.client_intervention1 || '',
        intervention2: clientData.client_intervention2 || '',
        secondaryObjective: clientData.client_secondaryobjective || '',
        intervention3: clientData.client_intervention3 || '',
        intervention4: clientData.client_intervention4 || '',
        tertiaryObjective: clientData.client_tertiaryobjective || '',
        intervention5: clientData.client_intervention5 || '',
        intervention6: clientData.client_intervention6 || '',
        currentSymptoms: clientData.client_functioning || '',
        functioning: clientData.client_functioning || '',
        prognosis: clientData.client_prognosis || '',
        progress: clientData.client_progress || '',
        problemNarrative: clientData.client_problem || '',
        treatmentGoalNarrative: clientData.client_treatmentgoal || '',
        sessionNarrative: clientData.client_sessionnarrative || '',
        nextTreatmentPlanUpdate: clientData.client_nexttreatmentplanupdate || '',
        privateNote: clientData.client_privatenote || ''
      }));
      
      setEditModes({
        appearance: clientData.client_appearance && !['Normal Appearance & Grooming'].includes(clientData.client_appearance),
        attitude: clientData.client_attitude && !['Calm & Cooperative'].includes(clientData.client_attitude),
        behavior: clientData.client_behavior && !['No unusual behavior or psychomotor changes'].includes(clientData.client_behavior),
        speech: clientData.client_speech && !['Normal rate/tone/volume w/out pressure'].includes(clientData.client_speech),
        affect: clientData.client_affect && !['Normal range/congruent'].includes(clientData.client_affect),
        thoughtProcess: clientData.client_thoughtprocess && !['Goal Oriented/Directed'].includes(clientData.client_thoughtprocess),
        perception: clientData.client_perception && !['No Hallucinations or Delusions'].includes(clientData.client_perception),
        orientation: clientData.client_orientation && !['Oriented x3'].includes(clientData.client_orientation),
        memoryConcentration: clientData.client_memoryconcentration && !['Short & Long Term Intact'].includes(clientData.client_memoryconcentration),
        insightJudgement: clientData.client_insightjudgement && !['Good'].includes(clientData.client_insightjudgement)
      });
      
      setDataInitialized(true);
    }
  }, [clientData, clinicianName, clinicianNameInsurance, appointmentDate, dataInitialized]);

  useEffect(() => {
    const allDataLoaded = !isLoadingPHQ9 && !isLoadingSessionTypes && clientData !== null && dataInitialized;
    setIsLoading(!allDataLoaded);
    
    console.log("Loading states:", {
      isLoadingPHQ9,
      isLoadingSessionTypes,
      hasClientData: clientData !== null,
      dataInitialized,
      overallLoading: !allDataLoaded
    });
  }, [isLoadingPHQ9, isLoadingSessionTypes, clientData, dataInitialized]);

  useEffect(() => {
    validateForm();
  }, [formState]);

  useEffect(() => {
    if (diagnosisCodes.length > 0) {
      handleChange('diagnosis', diagnosisCodes.join(', '));
    } else {
      handleChange('diagnosis', '');
    }
  }, [diagnosisCodes]);

  const validateForm = () => {
    const requiredFields = [
      'medications', 
      'sessionType', 
      'personsInAttendance', 
      ...(formState.appearance && formState.appearance !== 'Normal Appearance & Grooming' ? ['appearance'] : []), 
      ...(formState.attitude && formState.attitude !== 'Calm & Cooperative' ? ['attitude'] : []), 
      ...(formState.behavior && formState.behavior !== 'No unusual behavior or psychomotor changes' ? ['behavior'] : []), 
      ...(formState.speech && formState.speech !== 'Normal rate/tone/volume w/out pressure' ? ['speech'] : []), 
      ...(formState.affect && formState.affect !== 'Normal range/congruent' ? ['affect'] : []), 
      ...(formState.thoughtProcess && formState.thoughtProcess !== 'Goal Oriented/Directed' ? ['thoughtProcess'] : []), 
      ...(formState.perception && formState.perception !== 'No Hallucinations or Delusions' ? ['perception'] : []), 
      ...(formState.orientation && formState.orientation !== 'Oriented x3' ? ['orientation'] : []), 
      ...(formState.memoryConcentration && formState.memoryConcentration !== 'Short & Long Term Intact' ? ['memoryConcentration'] : []), 
      ...(formState.insightJudgement && formState.insightJudgement !== 'Good' ? ['insightJudgement'] : []), 
      'mood', 
      'substanceAbuseRisk', 
      'suicidalIdeation', 
      'homicidalIdeation', 
      'currentSymptoms', 
      'functioning', 
      'prognosis', 
      'progress', 
      'sessionNarrative', 
      'signature'
    ];
    
    let valid = true;
    for (const field of requiredFields) {
      if (!formState[field] || formState[field].trim() === '') {
        valid = false;
        break;
      }
    }
    setIsFormValid(valid);
  };

  const handleChange = (field: string, value: string) => {
    setFormState({
      ...formState,
      [field]: value
    });
  };

  const handleDiagnosisChange = (codes: string[]) => {
    setDiagnosisCodes(codes);
  };

  const toggleEditMode = (field: string, value: string) => {
    if (value === 'Other') {
      setEditModes({
        ...editModes,
        [field]: true
      });
      handleChange(field, '');
    } else {
      setEditModes({
        ...editModes,
        [field]: false
      });
      handleChange(field, value);
    }
  };

  const handleSave = async () => {
    if (!clientData?.id) {
      toast({
        title: "Error",
        description: "No client ID found. Cannot save session note.",
        variant: "destructive"
      });
      return;
    }
    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before saving.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const updates: Partial<ClientDetails> = {
        client_appearance: formState.appearance,
        client_attitude: formState.attitude,
        client_behavior: formState.behavior,
        client_speech: formState.speech,
        client_affect: formState.affect,
        client_thoughtprocess: formState.thoughtProcess,
        client_perception: formState.perception,
        client_orientation: formState.orientation,
        client_memoryconcentration: formState.memoryConcentration,
        client_insightjudgement: formState.insightJudgement,
        client_mood: formState.mood,
        client_substanceabuserisk: formState.substanceAbuseRisk,
        client_suicidalideation: formState.suicidalIdeation,
        client_homicidalideation: formState.homicidalIdeation,
        client_primaryobjective: formState.primaryObjective,
        client_secondaryobjective: formState.secondaryObjective,
        client_tertiaryobjective: formState.tertiaryObjective,
        client_intervention1: formState.intervention1,
        client_intervention2: formState.intervention2,
        client_intervention3: formState.intervention3,
        client_intervention4: formState.intervention4,
        client_intervention5: formState.intervention5,
        client_intervention6: formState.intervention6,
        client_functioning: formState.functioning,
        client_prognosis: formState.prognosis,
        client_progress: formState.progress,
        client_problem: formState.problemNarrative,
        client_treatmentgoal: formState.treatmentGoalNarrative,
        client_sessionnarrative: formState.sessionNarrative,
        client_medications: formState.medications,
        client_personsinattendance: formState.personsInAttendance,
        client_privatenote: formState.privateNote,
        client_nexttreatmentplanupdate: formState.nextTreatmentPlanUpdate
      };
      if (!hasExistingDiagnosis && diagnosisCodes.length > 0) {
        updates.client_diagnosis = diagnosisCodes;
      }
      const {
        error
      } = await supabase.from('clients').update(updates).eq('id', clientData.id);
      if (error) {
        throw error;
      }
      toast({
        title: "Success",
        description: "Session note saved successfully."
      });
      onClose();
    } catch (error) {
      console.error('Error saving session note:', error);
      toast({
        title: "Error",
        description: "Failed to save session note.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnlyField = (fieldName: string) => {
    const readOnlyFields = ['patientName', 'patientDOB', 'clinicianName', 'diagnosis', 'planType', 'treatmentFrequency', 'sessionDate', 'primaryObjective', 'intervention1', 'intervention2', 'secondaryObjective', 'intervention3', 'intervention4', 'tertiaryObjective', 'intervention5', 'intervention6', 'problemNarrative', 'treatmentGoalNarrative', 'nextTreatmentPlanUpdate'];
    return readOnlyFields.includes(fieldName);
  };

  const treatmentPlanSections = [{
    title: "Primary Objective",
    objectiveValue: formState.primaryObjective,
    objectiveKey: 'primaryObjective',
    objectiveField: clientData?.client_primaryobjective,
    interventions: [{
      key: 'intervention1',
      value: formState.intervention1,
      field: clientData?.client_intervention1,
      number: 1
    }, {
      key: 'intervention2',
      value: formState.intervention2,
      field: clientData?.client_intervention2,
      number: 2
    }]
  }, {
    title: "Secondary Objective",
    objectiveValue: formState.secondaryObjective,
    objectiveKey: 'secondaryObjective',
    objectiveField: clientData?.client_secondaryobjective,
    interventions: [{
      key: 'intervention3',
      value: formState.intervention3,
      field: clientData?.client_intervention3,
      number: 3
    }, {
      key: 'intervention4',
      value: formState.intervention4,
      field: clientData?.client_intervention4,
      number: 4
    }]
  }, {
    title: "Tertiary Objective",
    objectiveValue: formState.tertiaryObjective,
    objectiveKey: 'tertiaryObjective',
    objectiveField: clientData?.client_tertiaryobjective,
    interventions: [{
      key: 'intervention5',
      value: formState.intervention5,
      field: clientData?.client_intervention5,
      number: 5
    }, {
      key: 'intervention6',
      value: formState.intervention6,
      field: clientData?.client_intervention6,
      number: 6
    }]
  }];

  const hasTreatmentPlan = !!clientData?.client_primaryobjective;

  const RequiredFieldIndicator = () => <span className="text-red-500 ml-1">*</span>;

  if (isLoading) {
    return (
      <div className="animate-fade-in p-6 space-y-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Button variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="border rounded-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-gray-700" />
            <Skeleton className="h-6 w-48" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading session data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-semibold">Session Note Template</h2>
          <p className="text-sm text-gray-600">This is the template used for client session notes. This template will be used when creating a new session note for a client.</p>
        </div>
        <Button variant="outline" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-white p-6 border rounded-md mt-4">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-medium">Therapy Session Note</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <Input placeholder="Enter patient name" value={formState.patientName} onChange={e => handleChange('patientName', e.target.value)} readOnly className="bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient DOB</label>
            <Input placeholder="MM/DD/YYYY" value={formState.patientDOB} onChange={e => handleChange('patientDOB', e.target.value)} readOnly className="bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinician Name</label>
            <Input placeholder="Enter clinician name" value={formState.clinicianName} onChange={e => handleChange('clinicianName', e.target.value)} readOnly className="bg-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
            {hasExistingDiagnosis ? <Input placeholder="Select diagnosis code" value={formState.diagnosis} onChange={e => handleChange('diagnosis', e.target.value)} readOnly className="bg-gray-100" /> : <DiagnosisSelector value={diagnosisCodes} onChange={handleDiagnosisChange} />}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
            <Input placeholder="Select plan length" value={formState.planType} onChange={e => handleChange('planType', e.target.value)} readOnly className="bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Frequency</label>
            <Input placeholder="Select frequency" value={formState.treatmentFrequency} onChange={e => handleChange('treatmentFrequency', e.target.value)} readOnly className="bg-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Date</label>
            <Input 
              type="date" 
              value={formState.sessionDate} 
              onChange={e => handleChange('sessionDate', e.target.value)} 
              placeholder="Select date" 
              readOnly 
              className="bg-gray-100" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medications<RequiredFieldIndicator />
            </label>
            <Input 
              placeholder="List current medications" 
              value={formState.medications} 
              onChange={e => handleChange('medications', e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Type<RequiredFieldIndicator />
            </label>
            <Select value={formState.sessionType} onValueChange={value => handleChange('sessionType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map(type => (
                  <SelectItem key={type.code} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Person's in Attendance<RequiredFieldIndicator />
          </label>
          <Input 
            placeholder="List all attendees" 
            value={formState.personsInAttendance} 
            onChange={e => handleChange('personsInAttendance', e.target.value)} 
          />
        </div>

        <h4 className="text-md font-medium text-gray-800 mb-4">Mental Status Examination</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appearance</label>
            {editModes.appearance ? (
              <Input 
                value={formState.appearance} 
                onChange={e => handleChange('appearance', e.target.value)} 
                placeholder="Describe appearance" 
                className="w-full" 
              />
            ) : (
              <Select value={formState.appearance} onValueChange={value => toggleEditMode('appearance', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appearance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal Appearance & Grooming">Normal Appearance & Grooming</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attitude</label>
            {editModes.attitude ? (
              <Input 
                value={formState.attitude} 
                onChange={e => handleChange('attitude', e.target.value)} 
                placeholder="Describe attitude" 
                className="w-full" 
              />
            ) : (
              <Select value={formState.attitude} onValueChange={value => toggleEditMode('attitude', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select attitude" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Calm & Cooperative">Calm & Cooperative</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Behavior</label>
            {editModes.behavior ? (
              <Input 
                value={formState.behavior} 
                onChange={e => handleChange('behavior', e.target.value)} 
                placeholder="Describe behavior" 
                className="w-full" 
              />
            ) : (
              <Select value={formState.behavior} onValueChange={value => toggleEditMode('behavior', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select behavior" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No unusual behavior or psychomotor changes">
                    No unusual behavior or psychomotor changes
                  </SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speech</label>
            {editModes.speech ? (
              <Input 
                value={formState.speech} 
                onChange={e => handleChange('speech', e.target.value)} 
                placeholder="Describe speech" 
                className="w-full" 
              />
            ) : (
              <Select value={formState.speech} onValueChange={value => toggleEditMode('speech', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select speech" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal rate/tone/volume w/out pressure">
                    Normal rate/tone/volume w/out pressure
                  </SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Affect</label>
            {editModes.affect ? (
              <Input 
                value={formState.affect} 
                onChange={e => handleChange('affect', e.target.value)} 
                placeholder="Describe affect" 
                className="w-full" 
              />
            ) : (
              <Select value={formState.affect} onValueChange={value => toggleEditMode('affect', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select affect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal range/congruent">Normal range/congruent</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thought Process</label>
            {editModes.thoughtProcess ? (
              <Input 
                value={formState.thoughtProcess} 
                onChange={e => handleChange('thoughtProcess', e.target.value)} 
                placeholder="Describe thought process" 
                className="w-full" 
              />
            ) : (
              <Select value={formState.thoughtProcess} onValueChange={value => toggleEditMode('thoughtProcess', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select thought process" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Goal Oriented/Directed">Goal Oriented/Directed</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perception</label>
            {editModes.perception ? (
              <Input 
                value={formState.perception} 
                onChange={e => handleChange('perception', e.target.value)} 
                placeholder="Describe perception" 
                className="w-full" 
              />
            ) : (
              <Select value={formState.perception} onValueChange={value => toggleEditMode('perception', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select perception" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No Hallucinations or Delusions">No Hallucinations or Delusions</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
            {editModes.orientation ? (
              <Input 
                value={formState.orientation} 
                onChange={e => handleChange('orientation', e.target.value)} 
                placeholder="Describe orientation" 
                className="w-full" 
              />
            ) : (
              <Select value={formState.orientation} onValueChange={value => toggleEditMode('orientation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oriented x3">Oriented x3</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Memory/Concentration</label>
            {editModes.memoryConcentration ? (
              <Input 
                value={formState.memoryConcentration} 
                onChange={e => handleChange('memoryConcentration', e.target.value)} 
                placeholder="Describe memory/concentration" 
                className="w-full" 
              />
            ) : (
              <Select 
                value={formState.memoryConcentration}
                onValueChange={value => toggleEditMode('memoryConcentration', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select memory/concentration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Short & Long Term Intact">Short & Long Term Intact</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insight/Judgement</label>
            {editModes.insightJudgement ? (
              <Input 
                value={formState.insightJudgement} 
                onChange={e => handleChange('insightJudgement', e.target.value)} 
                placeholder="Describe insight/judgement" 
                className="w-full" 
              />
            ) : (
              <Select 
                value={formState.insightJudgement}
                onValueChange={value => toggleEditMode('insightJudgement', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select insight/judgement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Other">Other (Free Text)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mood<RequiredFieldIndicator />
            </label>
            <Input 
              placeholder="Describe mood" 
              value={formState.mood} 
              onChange={e => handleChange('mood', e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Substance Abuse Risk<RequiredFieldIndicator />
            </label>
            <Select value={formState.substanceAbuseRisk} onValueChange={value => handleChange('substanceAbuseRisk', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suicidal Ideation<RequiredFieldIndicator />
            </label>
            <Select value={formState.suicidalIdeation} onValueChange={value => handleChange('suicidalIdeation', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select ideation level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Passive">Passive</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Homicidal Ideation<RequiredFieldIndicator />
            </label>
            <Select value={formState.homicidalIdeation} onValueChange={value => handleChange('homicidalIdeation', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select ideation level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Passive">Passive</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasTreatmentPlan && (
          <>
            <h4 className="text-md font-medium text-gray-800 mb-4">Treatment Objectives & Interventions</h4>
            
            {treatmentPlanSections.map((section, index) => 
              section.objectiveField && (
                <React.Fragment key={index}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{section.title}</label>
                    <Textarea 
                      placeholder={`Describe the ${section.title.toLowerCase()}`} 
                      className="min-h-[100px] bg-gray-100" 
                      value={section.objectiveValue} 
                      onChange={e => handleChange(section.objectiveKey, e.target.value)} 
                      readOnly 
                    />
                  </div>
                  
                  {section.interventions.some(i => i.field) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {section.interventions.map((intervention, idx) => 
                        intervention.field && (
                          <div key={idx}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {`Intervention ${intervention.number}`}
                            </label>
                            <Input 
                              placeholder="Describe intervention" 
                              value={intervention.value} 
                              onChange={e => handleChange(intervention.key, e.target.value)} 
                              readOnly 
                              className="bg-gray-100" 
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </React.Fragment>
              )
            )}
          </>
        )}

        <h4 className="text-md font-medium text-gray-800 mb-4">Session Assessment</h4>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Symptoms<RequiredFieldIndicator />
          </label>
          <Textarea 
            placeholder="Describe current symptoms" 
            className="min-h-[100px]" 
            value={formState.currentSymptoms} 
            onChange={e => handleChange('currentSymptoms', e.target.value)} 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Functioning<RequiredFieldIndicator />
          </label>
          <Textarea 
            placeholder="Describe client functioning" 
            className="min-h-[100px]" 
            value={formState.functioning} 
            onChange={e => handleChange('functioning', e.target.value)} 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prognosis<RequiredFieldIndicator />
          </label>
          <Textarea 
            placeholder="Describe prognosis" 
            className="min-h-[100px]" 
            value={formState.prognosis} 
            onChange={e => handleChange('prognosis', e.target.value)} 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Progress<RequiredFieldIndicator />
          </label>
          <Textarea 
            placeholder="Describe progress" 
            className="min-h-[100px]" 
            value={formState.progress} 
            onChange={e => handleChange('progress', e.target.value)} 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Problem Narrative</label>
          <Textarea 
            placeholder="Describe the problem narrative" 
            className="min-h-[100px] bg-gray-100" 
            value={formState.problemNarrative} 
            onChange={e => handleChange('problemNarrative', e.target.value)} 
            readOnly 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Goal Narrative</label>
          <Textarea 
            placeholder="Describe the treatment goals" 
            className="min-h-[100px] bg-gray-100" 
            value={formState.treatmentGoalNarrative} 
            onChange={e => handleChange('treatmentGoalNarrative', e.target.value)} 
            readOnly 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Narrative<RequiredFieldIndicator />
          </label>
          <Textarea 
            placeholder="Provide a detailed narrative of the session" 
            className="min-h-[100px]" 
            value={formState.sessionNarrative} 
            onChange={e => handleChange('sessionNarrative', e.target.value)} 
          />
        </div>

        {phq9Narrative && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PHQ-9 Assessment
            </label>
            <Textarea 
              className="min-h-[100px] bg-gray-100 whitespace-pre-wrap" 
              value={formState.phq9Narrative} 
              readOnly
            />
          </div>
        )}

        <h4 className="text-md font-medium text-gray-800 mb-4">Plan & Signature</h4>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Signature<RequiredFieldIndicator />
          </label>
          <Input 
            placeholder="Enter signature" 
            value={formState.signature} 
            onChange={e => handleChange('signature', e.target.value)} 
          />
        </div>

        <div className="mb-6 border-t pt-6">
          <div className="flex items-center gap-2 mb-3">
            <LockKeyhole className="h-4 w-4 text-amber-500" />
            <h4 className="text-md font-medium text-gray-800">Private Note</h4>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            This note is private and will only be visible to clinicians. It will not be included in any client-facing documentation.
          </p>
          <Textarea 
            placeholder="Enter private notes about this client" 
            className="min-h-[100px]" 
            value={formState.privateNote} 
            onChange={e => handleChange('privateNote', e.target.value)} 
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting || !isFormValid} 
            className="w-full md:w-auto"
          >
            {isSubmitting ? 'Saving...' : 'Save Session Note'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionNoteTemplate;
