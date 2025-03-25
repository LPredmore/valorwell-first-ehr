import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, User, Activity } from 'lucide-react';
import ClientInsuranceTab from '@/components/ClientInsuranceTab';
import { format, differenceInYears } from 'date-fns';

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewClient = id === 'new';
  
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(!isNewClient);
  const [saving, setSaving] = useState(false);
  
  const [clientData, setClientData] = useState({
    // Profile data
    first_name: '',
    last_name: '',
    email: '',
    
    // Client specific data
    preferred_name: '',
    date_of_birth: '',
    age: '',
    gender: '',
    gender_identity: '',
    phone: '',
    state: '',
    time_zone: '',
    treatment_goal: '',
    minor: false,
    referral_source: '',
    status: 'Active',
    assigned_therapist: '',
    
    // Insurance data - Primary
    insurance_company_primary: '',
    insurance_type_primary: '',
    policy_number_primary: '',
    group_number_primary: '',
    subscriber_name_primary: '',
    subscriber_relationship_primary: '',
    subscriber_dob_primary: '',
    
    // Insurance data - Secondary
    insurance_company_secondary: '',
    insurance_type_secondary: '',
    policy_number_secondary: '',
    group_number_secondary: '',
    subscriber_name_secondary: '',
    subscriber_relationship_secondary: '',
    subscriber_dob_secondary: '',
    
    // Insurance data - Tertiary
    insurance_company_tertiary: '',
    insurance_type_tertiary: '',
    policy_number_tertiary: '',
    group_number_tertiary: '',
    subscriber_name_tertiary: '',
    subscriber_relationship_tertiary: '',
    subscriber_dob_tertiary: ''
  });
  
  // Calculate age automatically based on date of birth
  const calculatedAge = useMemo(() => {
    if (!clientData.date_of_birth) return '';
    try {
      const dob = new Date(clientData.date_of_birth);
      return differenceInYears(new Date(), dob).toString();
    } catch (e) {
      console.error('Error calculating age:', e);
      return '';
    }
  }, [clientData.date_of_birth]);
  
  // Update age whenever date of birth changes
  useEffect(() => {
    if (calculatedAge) {
      setClientData(prev => ({
        ...prev,
        age: calculatedAge
      }));
    }
  }, [calculatedAge]);
  
  useEffect(() => {
    if (!isNewClient) {
      fetchClientData();
    }
  }, [id]);
  
  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // First get client data
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clientError) throw clientError;
      
      // Then get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (profileError) throw profileError;
      
      // Combine the data
      setClientData({
        // Profile data
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        
        // Client specific data
        preferred_name: client.preferred_name || '',
        date_of_birth: client.date_of_birth || '',
        age: client.age ? String(client.age) : '',
        gender: client.gender || '',
        gender_identity: client.gender_identity || '',
        phone: client.phone || '',
        state: client.state || '',
        time_zone: client.time_zone || '',
        treatment_goal: client.treatment_goal || '',
        minor: client.minor || false,
        referral_source: client.referral_source || '',
        status: client.status || 'Active',
        assigned_therapist: client.assigned_therapist || '',
        
        // Insurance data - Primary
        insurance_company_primary: client.insurance_company_primary || '',
        insurance_type_primary: client.insurance_type_primary || '',
        policy_number_primary: client.policy_number_primary || '',
        group_number_primary: client.group_number_primary || '',
        subscriber_name_primary: client.subscriber_name_primary || '',
        subscriber_relationship_primary: client.subscriber_relationship_primary || '',
        subscriber_dob_primary: client.subscriber_dob_primary || '',
        
        // Insurance data - Secondary
        insurance_company_secondary: client.insurance_company_secondary || '',
        insurance_type_secondary: client.insurance_type_secondary || '',
        policy_number_secondary: client.policy_number_secondary || '',
        group_number_secondary: client.group_number_secondary || '',
        subscriber_name_secondary: client.subscriber_name_secondary || '',
        subscriber_relationship_secondary: client.subscriber_relationship_secondary || '',
        subscriber_dob_secondary: client.subscriber_dob_secondary || '',
        
        // Insurance data - Tertiary
        insurance_company_tertiary: client.insurance_company_tertiary || '',
        insurance_type_tertiary: client.insurance_type_tertiary || '',
        policy_number_tertiary: client.policy_number_tertiary || '',
        group_number_tertiary: client.group_number_tertiary || '',
        subscriber_name_tertiary: client.subscriber_name_tertiary || '',
        subscriber_relationship_tertiary: client.subscriber_relationship_tertiary || '',
        subscriber_dob_tertiary: client.subscriber_dob_tertiary || ''
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClientData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNewClient) {
        // Create a new user in auth with user metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: clientData.email,
          password: 'temppass1234',
          options: {
            data: {
              first_name: clientData.first_name,
              last_name: clientData.last_name,
              role: 'client'
            }
          }
        });
        
        if (authError) throw authError;
        
        // The profile and client records are created automatically by the database trigger
        // Now update the client record with additional fields
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            email: clientData.email,
            preferred_name: clientData.preferred_name,
            date_of_birth: clientData.date_of_birth,
            age: clientData.age ? parseInt(clientData.age) : null,
            gender: clientData.gender,
            gender_identity: clientData.gender_identity,
            phone: clientData.phone,
            state: clientData.state,
            time_zone: clientData.time_zone,
            treatment_goal: clientData.treatment_goal,
            status: 'Active',
            minor: Boolean(clientData.minor),
            referral_source: clientData.referral_source,
            
            // Insurance data - Primary
            insurance_company_primary: clientData.insurance_company_primary,
            insurance_type_primary: clientData.insurance_type_primary,
            policy_number_primary: clientData.policy_number_primary,
            group_number_primary: clientData.group_number_primary,
            subscriber_name_primary: clientData.subscriber_name_primary,
            subscriber_relationship_primary: clientData.subscriber_relationship_primary,
            subscriber_dob_primary: clientData.subscriber_dob_primary,
            
            // Insurance data - Secondary
            insurance_company_secondary: clientData.insurance_company_secondary,
            insurance_type_secondary: clientData.insurance_type_secondary,
            policy_number_secondary: clientData.policy_number_secondary,
            group_number_secondary: clientData.group_number_secondary,
            subscriber_name_secondary: clientData.subscriber_name_secondary,
            subscriber_relationship_secondary: clientData.subscriber_relationship_secondary,
            subscriber_dob_secondary: clientData.subscriber_dob_secondary,
            
            // Insurance data - Tertiary
            insurance_company_tertiary: clientData.insurance_company_tertiary,
            insurance_type_tertiary: clientData.insurance_type_tertiary,
            policy_number_tertiary: clientData.policy_number_tertiary,
            group_number_tertiary: clientData.group_number_tertiary,
            subscriber_name_tertiary: clientData.subscriber_name_tertiary,
            subscriber_relationship_tertiary: clientData.subscriber_relationship_tertiary,
            subscriber_dob_tertiary: clientData.subscriber_dob_tertiary
          })
          .eq('id', authData.user.id);
          
        if (updateError) throw updateError;
        
        toast.success('Client created successfully');
        navigate(`/clients/${authData.user.id}`);
      } else {
        // Update profiles - sync the duplicated fields
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            email: clientData.email,
            profile_type: 'client'
          })
          .eq('id', id);
          
        if (profileError) throw profileError;
        
        // Update clients with all fields
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            email: clientData.email,
            preferred_name: clientData.preferred_name,
            date_of_birth: clientData.date_of_birth,
            age: clientData.age ? parseInt(clientData.age) : null,
            gender: clientData.gender,
            gender_identity: clientData.gender_identity,
            phone: clientData.phone,
            state: clientData.state,
            time_zone: clientData.time_zone,
            treatment_goal: clientData.treatment_goal,
            minor: Boolean(clientData.minor),
            referral_source: clientData.referral_source,
            status: clientData.status,
            assigned_therapist: clientData.assigned_therapist,
            
            // Insurance data - Primary
            insurance_company_primary: clientData.insurance_company_primary,
            insurance_type_primary: clientData.insurance_type_primary,
            policy_number_primary: clientData.policy_number_primary,
            group_number_primary: clientData.group_number_primary,
            subscriber_name_primary: clientData.subscriber_name_primary,
            subscriber_relationship_primary: clientData.subscriber_relationship_primary,
            subscriber_dob_primary: clientData.subscriber_dob_primary,
            
            // Insurance data - Secondary
            insurance_company_secondary: clientData.insurance_company_secondary,
            insurance_type_secondary: clientData.insurance_type_secondary,
            policy_number_secondary: clientData.policy_number_secondary,
            group_number_secondary: clientData.group_number_secondary,
            subscriber_name_secondary: clientData.subscriber_name_secondary,
            subscriber_relationship_secondary: clientData.subscriber_relationship_secondary,
            subscriber_dob_secondary: clientData.subscriber_dob_secondary,
            
            // Insurance data - Tertiary
            insurance_company_tertiary: clientData.insurance_company_tertiary,
            insurance_type_tertiary: clientData.insurance_type_tertiary,
            policy_number_tertiary: clientData.policy_number_tertiary,
            group_number_tertiary: clientData.group_number_tertiary,
            subscriber_name_tertiary: clientData.subscriber_name_tertiary,
            subscriber_relationship_tertiary: clientData.subscriber_relationship_tertiary,
            subscriber_dob_tertiary: clientData.subscriber_dob_tertiary
          })
          .eq('id', id);
          
        if (clientError) throw clientError;
        
        toast.success('Client updated successfully');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Failed to save client data');
    } finally {
      setSaving(false);
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
            {isNewClient ? 'New Client' : `${clientData.first_name} ${clientData.last_name}`}
          </h1>
        </div>
        
        <Button onClick={handleSave} disabled={loading || saving}>
          {isNewClient ? 'Create Client' : 'Save Changes'}
        </Button>
      </div>
      
      <Tabs defaultValue="personal" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 border-b w-full justify-start rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="personal" 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-valorwell-700 data-[state=active]:text-valorwell-700 px-4 py-2"
          >
            Personal Information
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
        
        <TabsContent value="personal" className="space-y-6">
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
                  value={clientData.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Name</label>
                <Input 
                  name="preferred_name"
                  value={clientData.preferred_name}
                  onChange={handleChange}
                  placeholder="Preferred Name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input 
                  name="last_name"
                  value={clientData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input 
                  name="date_of_birth"
                  type="date"
                  value={clientData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Age (auto-calculated)</label>
                <Input 
                  name="age"
                  type="number"
                  value={clientData.age}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <select
                  name="gender"
                  value={clientData.gender || ''}
                  onChange={handleChange}
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
                  value={clientData.gender_identity || ''}
                  onChange={handleChange}
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
                  value={clientData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  name="phone"
                  value={clientData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <select
                  name="state"
                  value={clientData.state || ''}
                  onChange={handleChange}
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
                  value={clientData.time_zone || ''}
                  onChange={handleChange}
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
                  value={clientData.minor === true ? 'Yes' : 'No'}
                  onChange={(e) => {
                    setClientData(prev => ({
                      ...prev,
                      minor: e.target.value === 'Yes'
                    }));
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </Card>
          
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
                  value={clientData.referral_source || ''}
                  onChange={handleChange}
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
                  value={clientData.status || 'Active'}
                  onChange={handleChange}
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
                  value={clientData.assigned_therapist || ''}
                  onChange={handleChange}
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
                  value={clientData.treatment_goal || ''}
                  onChange={handleChange}
                  placeholder="Client's treatment goal"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="insurance">
          <div className="space-y-6">
            {/* Primary Insurance */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <Activity className="mr-2 h-5 w-5" />
                <h2 className="font-semibold text-lg">Primary Insurance</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Insurance Company</label>
                  <Input 
                    name="insurance_company_primary"
                    value={clientData.insurance_company_primary || ''}
                    onChange={handleChange}
                    placeholder="Insurance Company"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Policy Number</label>
                  <Input 
                    name="policy_number_primary"
                    value={clientData.policy_number_primary || ''}
                    onChange={handleChange}
                    placeholder="Policy Number"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Group Number</label>
                  <Input 
                    name="group_number_primary"
                    value={clientData.group_number_primary || ''}
                    onChange={handleChange}
                    placeholder="Group Number"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Policy Holder Name</label>
                  <Input 
                    name="subscriber_name_primary"
                    value={clientData.subscriber_name_primary || ''}
                    onChange={handleChange}
                    placeholder="Policy Holder Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Relationship to Subscriber</label>
                  <select
                    name="subscriber_relationship_primary"
                    value={clientData.subscriber_relationship_primary || ''}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-
