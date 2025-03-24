
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User, Activity, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const isNewClient = id === 'new';
  
  // Client information state
  const [client, setClient] = useState({
    first_name: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    age: '',
    gender: '',
    gender_identity: '',
    email: '',
    phone: '',
    state: '',
    time_zone: '',
    minor: 'No',
    referral_source: '',
    status: 'Waiting',
    assigned_therapist: '',
    treatment_goal: ''
  });

  // Fetch client data if editing an existing client
  useEffect(() => {
    const fetchClient = async () => {
      if (isNewClient) return;
      
      setLoading(true);
      try {
        // First fetch the client
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (clientError) throw clientError;
        
        // Then fetch their profile info for name and email
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (profileError) throw profileError;
        
        // Combine the data
        setClient({
          ...client,
          ...clientData,
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          minor: clientData.minor ? 'Yes' : 'No',
        });
      } catch (error) {
        console.error('Error fetching client:', error);
        toast.error('Error loading client information');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let userId = id;
      
      // If creating a new user, first create auth user
      if (isNewClient) {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: client.email,
          password: 'temppass1234',
          email_confirm: true,
          user_metadata: {
            first_name: client.first_name,
            last_name: client.last_name
          }
        });
        
        if (authError) throw authError;
        userId = authData.user.id;
        
        // The user and profile will be created by a Supabase trigger,
        // but we need to ensure we have the ID for the client table update
      }
      
      // Update or create client record
      const clientData = {
        id: userId,
        preferred_name: client.preferred_name,
        date_of_birth: client.date_of_birth || null,
        age: client.age ? parseInt(client.age) : null,
        gender: client.gender,
        gender_identity: client.gender_identity,
        phone: client.phone,
        state: client.state,
        time_zone: client.time_zone,
        minor: client.minor === 'Yes',
        referral_source: client.referral_source,
        status: client.status,
        assigned_therapist: client.assigned_therapist || null,
        treatment_goal: client.treatment_goal
      };
      
      const { error: clientError } = await supabase
        .from('clients')
        .upsert([clientData], { onConflict: 'id' });
        
      if (clientError) throw clientError;
      
      // Update profile information
      const profileData = {
        id: userId,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileData], { onConflict: 'id' });
        
      if (profileError) throw profileError;
      
      toast.success(isNewClient ? 'Client created successfully' : 'Client updated successfully');
      navigate('/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(error.message || 'Error saving client information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/clients')}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            <span>Back to Clients</span>
          </Button>
          <h1 className="text-2xl font-semibold">
            {isNewClient ? 'New Client' : `${client.first_name} ${client.last_name}`}
          </h1>
        </div>
        
        <Button onClick={handleSave} disabled={loading}>
          {isNewClient ? 'Create Client' : 'Save Changes'}
        </Button>
      </div>
      
      <Tabs defaultValue="profile" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 border-b w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="profile" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-valorwell-700 data-[state=active]:text-valorwell-700 px-4 py-2"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="insurance" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-valorwell-700 data-[state=active]:text-valorwell-700 px-4 py-2"
          >
            Insurance
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-valorwell-700 data-[state=active]:text-valorwell-700 px-4 py-2"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger 
            value="appointments" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-valorwell-700 data-[state=active]:text-valorwell-700 px-4 py-2"
          >
            Appointments
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-valorwell-700 data-[state=active]:text-valorwell-700 px-4 py-2"
          >
            Notes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          {/* Personal Information Section */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <User className="mr-2 h-5 w-5" />
              <h2 className="font-semibold text-lg">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input 
                  name="first_name"
                  value={client.first_name}
                  onChange={handleInputChange}
                  placeholder="First Name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Name</label>
                <Input 
                  name="preferred_name"
                  value={client.preferred_name}
                  onChange={handleInputChange}
                  placeholder="Preferred Name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input 
                  name="last_name"
                  value={client.last_name}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input 
                  name="date_of_birth"
                  type="date"
                  value={client.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Age</label>
                <Input 
                  name="age"
                  type="number"
                  value={client.age}
                  onChange={handleInputChange}
                  placeholder="Age"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Birth Gender</label>
                <select
                  name="gender"
                  value={client.gender}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender Identity</label>
                <select
                  name="gender_identity"
                  value={client.gender_identity}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Gender Identity</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  name="email"
                  type="email"
                  value={client.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  name="phone"
                  value={client.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <select
                  name="state"
                  value={client.state}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select State</option>
                  <option value="Alabama">Alabama</option>
                  <option value="Alaska">Alaska</option>
                  <option value="Arizona">Arizona</option>
                  <option value="Arkansas">Arkansas</option>
                  <option value="California">California</option>
                  <option value="Colorado">Colorado</option>
                  <option value="Connecticut">Connecticut</option>
                  <option value="Delaware">Delaware</option>
                  <option value="Florida">Florida</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Hawaii">Hawaii</option>
                  <option value="Idaho">Idaho</option>
                  <option value="Illinois">Illinois</option>
                  <option value="Indiana">Indiana</option>
                  <option value="Iowa">Iowa</option>
                  <option value="Kansas">Kansas</option>
                  <option value="Kentucky">Kentucky</option>
                  <option value="Louisiana">Louisiana</option>
                  <option value="Maine">Maine</option>
                  <option value="Maryland">Maryland</option>
                  <option value="Massachusetts">Massachusetts</option>
                  <option value="Michigan">Michigan</option>
                  <option value="Minnesota">Minnesota</option>
                  <option value="Mississippi">Mississippi</option>
                  <option value="Missouri">Missouri</option>
                  <option value="Montana">Montana</option>
                  <option value="Nebraska">Nebraska</option>
                  <option value="Nevada">Nevada</option>
                  <option value="New Hampshire">New Hampshire</option>
                  <option value="New Jersey">New Jersey</option>
                  <option value="New Mexico">New Mexico</option>
                  <option value="New York">New York</option>
                  <option value="North Carolina">North Carolina</option>
                  <option value="North Dakota">North Dakota</option>
                  <option value="Ohio">Ohio</option>
                  <option value="Oklahoma">Oklahoma</option>
                  <option value="Oregon">Oregon</option>
                  <option value="Pennsylvania">Pennsylvania</option>
                  <option value="Rhode Island">Rhode Island</option>
                  <option value="South Carolina">South Carolina</option>
                  <option value="South Dakota">South Dakota</option>
                  <option value="Tennessee">Tennessee</option>
                  <option value="Texas">Texas</option>
                  <option value="Utah">Utah</option>
                  <option value="Vermont">Vermont</option>
                  <option value="Virginia">Virginia</option>
                  <option value="Washington">Washington</option>
                  <option value="West Virginia">West Virginia</option>
                  <option value="Wisconsin">Wisconsin</option>
                  <option value="Wyoming">Wyoming</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Zone</label>
                <select
                  name="time_zone"
                  value={client.time_zone}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Time Zone</option>
                  <option value="Eastern Time (ET)">Eastern Time (ET)</option>
                  <option value="Central Time (CT)">Central Time (CT)</option>
                  <option value="Mountain Time (MT)">Mountain Time (MT)</option>
                  <option value="Pacific Time (PT)">Pacific Time (PT)</option>
                  <option value="Alaska Time (AKT)">Alaska Time (AKT)</option>
                  <option value="Hawaii-Aleutian Time (HAT)">Hawaii-Aleutian Time (HAT)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Minor</label>
                <select
                  name="minor"
                  value={client.minor}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </Card>
          
          {/* Clinical Information Section */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Activity className="mr-2 h-5 w-5" />
              <h2 className="font-semibold text-lg">Clinical Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Referral Source</label>
                <select
                  name="referral_source"
                  value={client.referral_source}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Referral Source</option>
                  <option value="Friend/Family">Friend/Family</option>
                  <option value="Internet Search">Internet Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Healthcare Provider">Healthcare Provider</option>
                  <option value="Insurance Company">Insurance Company</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Status</label>
                <select
                  name="status"
                  value={client.status}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Waiting">Waiting</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned Therapist</label>
                <select
                  name="assigned_therapist"
                  value={client.assigned_therapist || ''}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">None</option>
                  {/* We would fetch therapists from database and map them here */}
                </select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Treatment Goal</label>
                <textarea
                  name="treatment_goal"
                  value={client.treatment_goal || ''}
                  onChange={handleInputChange}
                  placeholder="Client's treatment goal"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="insurance">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium text-gray-500 mb-2">Insurance Information</h3>
            <p className="text-gray-500">Insurance information will be displayed here.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="documents">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium text-gray-500 mb-2">Client Documents</h3>
            <p className="text-gray-500">Document management will be displayed here.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="appointments">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium text-gray-500 mb-2">Client Appointments</h3>
            <p className="text-gray-500">Appointment information will be displayed here.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="notes">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium text-gray-500 mb-2">Client Notes</h3>
            <p className="text-gray-500">Clinical notes will be displayed here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default ClientProfile;
