
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Save, X, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInYears, parse, isValid } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientDetails {
  id: string;
  client_first_name: string | null;
  client_last_name: string | null;
  client_preferred_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_date_of_birth: string | null;
  client_age: number | null;
  client_gender: string | null;
  client_gender_identity: string | null;
  client_state: string | null;
  client_time_zone: string | null;
  client_minor: string | null;
  client_status: string | null;
  client_assigned_therapist: string | null;
  client_referral_source: string | null;
  client_treatment_goal: string | null;
}

interface Clinician {
  id: string;
  clinician_professional_name: string | null;
  clinician_first_name: string | null;
  clinician_last_name: string | null;
}

const ClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<ClientDetails | null>(null);
  const [dateInputText, setDateInputText] = useState('');
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (clientId) {
      fetchClientDetails(clientId);
    }
  }, [clientId]);

  useEffect(() => {
    if (isEditing) {
      fetchClinicians();
    }
  }, [isEditing]);

  const fetchClientDetails = async (id: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setClient(data);
      setEditedClient(data);
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch client details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicians = async () => {
    try {
      setLoadingClinicians(true);
      
      const { data, error } = await supabase
        .from('clinicians')
        .select('id, clinician_professional_name, clinician_first_name, clinician_last_name')
        .order('clinician_last_name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setClinicians(data || []);
    } catch (error) {
      console.error('Error fetching clinicians:', error);
      toast({
        title: "Error",
        description: "Failed to load clinicians list.",
        variant: "destructive",
      });
    } finally {
      setLoadingClinicians(false);
    }
  };

  const goBackToClients = () => {
    navigate('/clients');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedClient(client);
      setDateInputText(client?.client_date_of_birth ? format(new Date(client.client_date_of_birth), 'yyyy-MM-dd') : '');
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setDateInputText(editedClient?.client_date_of_birth ? format(new Date(editedClient.client_date_of_birth), 'yyyy-MM-dd') : '');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editedClient) {
      setEditedClient({
        ...editedClient,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    if (editedClient) {
      setEditedClient({
        ...editedClient,
        [field]: value,
      });
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date || !editedClient) return;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    const age = differenceInYears(new Date(), date);
    
    setDateInputText(formattedDate);
    setEditedClient({
      ...editedClient,
      client_date_of_birth: formattedDate,
      client_age: age,
    });
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDateInputText(inputValue);
    
    if (inputValue) {
      try {
        const parsedDate = parse(inputValue, 'yyyy-MM-dd', new Date());
        
        if (isValid(parsedDate) && editedClient) {
          const age = differenceInYears(new Date(), parsedDate);
          
          setEditedClient({
            ...editedClient,
            client_date_of_birth: format(parsedDate, 'yyyy-MM-dd'),
            client_age: age,
          });
        }
      } catch (error) {
        console.error('Invalid date format', error);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!editedClient) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .update(editedClient)
        .eq('id', clientId);
      
      if (error) {
        throw error;
      }
      
      setClient(editedClient);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Client details updated successfully.",
      });
    } catch (error) {
      console.error('Error updating client details:', error);
      toast({
        title: "Error",
        description: "Failed to update client details.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p>Loading client details...</p>
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-gray-600 mb-4">Client not found</p>
          <button 
            onClick={goBackToClients}
            className="px-4 py-2 bg-valorwell-700 text-white rounded hover:bg-valorwell-800 transition-colors"
          >
            Back to Clients
          </button>
        </div>
      </Layout>
    );
  }

  const timeZones = [
    "Hawaii-Aleutian Standard Time (HST)",
    "Alaska Standard Time (AKST)",
    "Pacific Standard Time (PST)",
    "Mountain Standard Time (MST)",
    "Central Standard Time (CST)",
    "Eastern Standard Time (EST)",
  ];

  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
    "Wisconsin", "Wyoming"
  ];

  const referralSources = [
    "Family or Friend", 
    "Veterans Organization", 
    "Web Search", 
    "Facebook", 
    "Instagram", 
    "Other Social Media", 
    "Other"
  ];

  // Helper function to display clinician name
  const getClinicianDisplayName = (clinician: Clinician) => {
    if (clinician.clinician_professional_name) {
      return clinician.clinician_professional_name;
    } else if (clinician.clinician_first_name && clinician.clinician_last_name) {
      return `${clinician.clinician_first_name} ${clinician.clinician_last_name}`;
    } else {
      return `Clinician ${clinician.id.substring(0, 8)}`;
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {client.client_first_name} {client.client_last_name}
        </h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={goBackToClients}
          className="flex items-center text-gray-600 hover:text-valorwell-700"
        >
          <ArrowLeft className="mr-1" size={16} />
          Back to Clients
        </button>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="destructive" 
                className="flex items-center" 
                onClick={handleEditToggle}
              >
                <X size={16} className="mr-2" />
                Cancel
              </Button>
              <Button 
                className="flex items-center bg-valorwell-700 hover:bg-valorwell-800" 
                onClick={handleSaveChanges}
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button 
              className="flex items-center bg-valorwell-700 hover:bg-valorwell-800" 
              onClick={handleEditToggle}
            >
              <Pencil size={16} className="mr-2" />
              Edit Client
            </Button>
          )}
        </div>
      </div>

      <div className="border-b mb-6">
        <div className="flex">
          {['profile', 'insurance', 'documents', 'appointments', 'notes'].map((tab) => (
            <button 
              key={tab}
              className={`px-6 py-3 font-medium text-sm ${activeTab === tab ? 'border-b-2 border-valorwell-700 text-valorwell-700' : 'text-gray-500'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-gray-100 rounded-full mr-2 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">👤</span>
                </div>
                <h2 className="text-lg font-semibold">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {isEditing ? (
                    <Input 
                      name="client_first_name"
                      value={editedClient?.client_first_name || ''}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_first_name || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
                  {isEditing ? (
                    <Input 
                      name="client_preferred_name"
                      value={editedClient?.client_preferred_name || ''}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_preferred_name || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  {isEditing ? (
                    <Input 
                      name="client_last_name"
                      value={editedClient?.client_last_name || ''}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_last_name || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={dateInputText}
                        onChange={handleDateInputChange}
                        placeholder="yyyy-mm-dd"
                        className="w-full"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline"
                            className="px-3"
                          >
                            <CalendarIcon className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 pointer-events-auto">
                          <Calendar
                            mode="single"
                            selected={editedClient?.client_date_of_birth ? new Date(editedClient.client_date_of_birth) : undefined}
                            onSelect={handleDateChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_date_of_birth ? new Date(client.client_date_of_birth).toLocaleDateString() : '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {isEditing ? editedClient?.client_age : client.client_age || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Gender</label>
                  {isEditing ? (
                    <Select
                      value={editedClient?.client_gender || ''}
                      onValueChange={(value) => handleSelectChange('client_gender', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_gender || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender Identity</label>
                  {isEditing ? (
                    <Select
                      value={editedClient?.client_gender_identity || ''}
                      onValueChange={(value) => handleSelectChange('client_gender_identity', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender identity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_gender_identity || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <Input 
                      name="client_email"
                      value={editedClient?.client_email || ''}
                      onChange={handleInputChange}
                      className="w-full"
                      type="email"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_email || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEditing ? (
                    <Input 
                      name="client_phone"
                      value={editedClient?.client_phone || ''}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_phone || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  {isEditing ? (
                    <Select
                      value={editedClient?.client_state || ''}
                      onValueChange={(value) => handleSelectChange('client_state', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_state || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                  {isEditing ? (
                    <Select
                      value={editedClient?.client_time_zone || ''}
                      onValueChange={(value) => handleSelectChange('client_time_zone', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeZones.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_time_zone || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minor</label>
                  {isEditing ? (
                    <Select
                      value={editedClient?.client_minor || ''}
                      onValueChange={(value) => handleSelectChange('client_minor', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_minor || 'No'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-gray-100 rounded-full mr-2 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">🩺</span>
                </div>
                <h2 className="text-lg font-semibold">Clinical Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referral Source</label>
                  {isEditing ? (
                    <Select
                      value={editedClient?.client_referral_source || ''}
                      onValueChange={(value) => handleSelectChange('client_referral_source', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select referral source" />
                      </SelectTrigger>
                      <SelectContent>
                        {referralSources.map((source) => (
                          <SelectItem key={source} value={source}>{source}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_referral_source || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Status</label>
                  {isEditing ? (
                    <Input 
                      name="client_status"
                      value={editedClient?.client_status || ''}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_status || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Therapist</label>
                  {isEditing ? (
                    <Select
                      value={editedClient?.client_assigned_therapist || ''}
                      onValueChange={(value) => handleSelectChange('client_assigned_therapist', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select therapist" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {loadingClinicians ? (
                          <SelectItem value="loading" disabled>Loading clinicians...</SelectItem>
                        ) : (
                          clinicians.map((clinician) => (
                            <SelectItem key={clinician.id} value={getClinicianDisplayName(clinician)}>
                              {getClinicianDisplayName(clinician)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      {client.client_assigned_therapist || 'None'}
                    </div>
                  )}
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Goal</label>
                  {isEditing ? (
                    <textarea
                      name="client_treatment_goal"
                      value={editedClient?.client_treatment_goal || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-white rounded-md border border-gray-300 min-h-20 resize-y"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-20">
                      {client.client_treatment_goal || '-'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'insurance' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Insurance Information</h2>
          <p className="text-gray-500">Insurance details will be displayed here.</p>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          <p className="text-gray-500">Client documents will be displayed here.</p>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Appointments</h2>
          <p className="text-gray-500">Client appointments will be displayed here.</p>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <p className="text-gray-500">Client notes will be displayed here.</p>
        </div>
      )}
    </Layout>
  );
};

export default ClientDetails;
