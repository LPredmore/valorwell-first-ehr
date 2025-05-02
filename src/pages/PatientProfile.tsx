
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPhoneNumber } from '@/utils/formatPhoneNumber';
import { Loader2, CalendarIcon, FileTextIcon, ClipboardIcon, UserRoundIcon, PenIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PatientDetails } from '@/components/patients/PatientDetails';
import { PatientNotes } from '@/components/patients/PatientNotes';
import { PatientAppointments } from '@/components/patients/PatientAppointments';

interface Patient {
  id: string;
  client_first_name: string;
  client_last_name: string;
  client_preferred_name?: string;
  client_email: string;
  client_phone: string;
  client_date_of_birth: string;
  client_gender?: string;
  client_status: string;
  created_at: string;
  // Add other fields as needed
}

const PatientProfile = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setPatient(data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patient information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/patients/${patientId}/edit`);
  };

  const handleSchedule = () => {
    navigate(`/calendar?patientId=${patientId}`);
  };

  const handleAddNote = () => {
    navigate(`/patients/${patientId}/notes/new`);
  };

  const handleInactivate = async () => {
    // Confirm before inactivating
    if (!window.confirm('Are you sure you want to inactivate this patient?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ client_status: 'Inactive' })
        .eq('id', patientId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Patient status updated to inactive',
      });

      // Refresh patient data
      fetchPatient();
    } catch (error) {
      console.error('Error inactivating patient:', error);
      toast({
        title: 'Error',
        description: 'Failed to update patient status',
        variant: 'destructive',
      });
    }
  };

  const handleActivate = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ client_status: 'Active' })
        .eq('id', patientId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Patient status updated to active',
      });

      // Refresh patient data
      fetchPatient();
    } catch (error) {
      console.error('Error activating patient:', error);
      toast({
        title: 'Error',
        description: 'Failed to update patient status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Patient Not Found</h2>
            <p className="mt-2">The patient you are looking for does not exist or you don't have permission to view it.</p>
            <Button onClick={() => navigate('/patients')} className="mt-4">
              Return to Patients
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isInactive = patient.client_status === 'Inactive';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Patient header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold">
                  {patient.client_first_name} {patient.client_last_name}
                  {patient.client_preferred_name && (
                    <span className="text-gray-500 text-xl ml-2">({patient.client_preferred_name})</span>
                  )}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <UserRoundIcon className="h-4 w-4 mr-1" />
                    <span>
                      {patient.client_gender || 'Not specified'} • {new Date().getFullYear() - new Date(patient.client_date_of_birth).getFullYear()} years
                    </span>
                  </div>
                  <span className="hidden sm:block">•</span>
                  <span>{formatPhoneNumber(patient.client_phone)}</span>
                  <span className="hidden sm:block">•</span>
                  <span>{patient.client_email}</span>
                </div>
                {/* Status badge */}
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    isInactive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {patient.client_status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                <Button variant="outline" onClick={handleSchedule}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button variant="outline" onClick={() => navigate(`/patients/${patientId}/documents`)}>
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Documents
                </Button>
                <Button variant="outline" onClick={handleAddNote}>
                  <ClipboardIcon className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
                <Button onClick={handleEdit}>
                  <PenIcon className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                {isInactive ? (
                  <Button variant="outline" onClick={handleActivate}>
                    Activate
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleInactivate}>
                    Inactivate
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <PatientDetails patient={patient} />
          </TabsContent>
          
          <TabsContent value="appointments">
            <PatientAppointments patientId={patientId!} />
          </TabsContent>
          
          <TabsContent value="notes">
            <PatientNotes patientId={patientId!} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PatientProfile;
