
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Check } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';
import { useToast } from '@/hooks/use-toast';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Form setup
  const form = useForm({
    defaultValues: {
      firstName: '',
      preferredName: '',
      lastName: '',
      email: '',
      phone: '',
      state: '',
    }
  });

  // Get current user data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get client record associated with this user
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('client_email', user.email)
          .single();
        
        if (data) {
          setClientId(data.id);
          // Populate form with existing data
          form.reset({
            firstName: data.client_first_name || '',
            preferredName: data.client_preferred_name || '',
            lastName: data.client_last_name || '',
            email: data.client_email || '',
            phone: data.client_phone || '',
            state: data.client_state || '',
          });
        } else if (error) {
          console.error('Error fetching client data:', error);
        }
      }
    };
    
    fetchUser();
  }, [form]);

  const handleConfirm = async () => {
    const values = form.getValues();
    
    if (!clientId) {
      toast({
        title: "Error",
        description: "No client record found. Please contact support.",
        variant: "destructive"
      });
      return;
    }
    
    const { error } = await supabase
      .from('clients')
      .update({
        client_first_name: values.firstName,
        client_preferred_name: values.preferredName,
        client_last_name: values.lastName,
        client_phone: values.phone,
        client_state: values.state,
        client_status: 'Profile Complete',
        client_is_profile_complete: 'true'
      })
      .eq('id', clientId);
    
    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile confirmed!",
        description: "Your information has been saved. You can now proceed with scheduling an appointment.",
      });
      navigate('/patient-dashboard');
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6">
        <Card className="shadow-md">
          <CardHeader className="text-center bg-gradient-to-r from-valorwell-50 to-valorwell-100 rounded-t-lg">
            <CardTitle className="text-3xl text-valorwell-700">Welcome to ValorWell!</CardTitle>
            <CardDescription className="text-lg mt-2">
              We're glad you're here. Before scheduling with a therapist, 
              please confirm your information below.
            </CardDescription>
            <p className="mt-4 text-valorwell-600">
              This process will only take 5-10 minutes of your time.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormFieldWrapper
                    control={form.control}
                    name="firstName"
                    label="First Name"
                  />
                  
                  <FormFieldWrapper
                    control={form.control}
                    name="lastName"
                    label="Last Name"
                  />
                  
                  <FormFieldWrapper
                    control={form.control}
                    name="preferredName"
                    label="Preferred Name (optional)"
                  />
                  
                  <FormFieldWrapper
                    control={form.control}
                    name="email"
                    label="Email"
                    type="email"
                    readOnly={true}
                  />
                  
                  <FormFieldWrapper
                    control={form.control}
                    name="phone"
                    label="Phone"
                    type="tel"
                  />
                  
                  <FormFieldWrapper
                    control={form.control}
                    name="state"
                    label="State"
                    type="select"
                    options={[
                      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
                      "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
                      "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
                      "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", 
                      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
                      "New Hampshire", "New Jersey", "New Mexico", "New York", 
                      "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", 
                      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
                      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
                      "West Virginia", "Wisconsin", "Wyoming"
                    ]}
                  />
                </div>
                
                <div className="flex justify-center mt-8">
                  <Button 
                    type="button" 
                    size="lg" 
                    onClick={handleConfirm}
                    className="bg-valorwell-600 hover:bg-valorwell-700 text-white font-medium py-2 px-8 rounded-md flex items-center gap-2"
                  >
                    <Check className="h-5 w-5" />
                    I confirm that this is me
                  </Button>
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProfileSetup;
