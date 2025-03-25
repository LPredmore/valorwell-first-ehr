
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

const ClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (clientId) {
      fetchClientDetails(clientId);
    }
  }, [clientId]);

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

  const goBackToClients = () => {
    navigate('/clients');
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

        <button className="px-4 py-2 bg-valorwell-700 text-white rounded-md flex items-center">
          <Pencil size={16} className="mr-2" />
          Edit Client
        </button>
      </div>

      {/* Tabs */}
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
          {/* Personal Information Section */}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_first_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_preferred_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_last_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_date_of_birth ? new Date(client.client_date_of_birth).toLocaleDateString() : '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_age || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Gender</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_gender || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender Identity</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_gender_identity || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_email || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_phone || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_state || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_time_zone || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minor</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_minor || 'No'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Information Section */}
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
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_referral_source || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Status</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_status || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Therapist</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    {client.client_assigned_therapist || 'None'}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Goal</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200 min-h-20">
                    {client.client_treatment_goal || '-'}
                  </div>
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
