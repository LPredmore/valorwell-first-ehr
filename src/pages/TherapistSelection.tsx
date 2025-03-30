
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TherapistSelection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('clinician_status', 'Active');
          
        if (error) {
          throw error;
        }
        
        setTherapists(data || []);
      } catch (error) {
        console.error('Error fetching therapists:', error);
        toast({
          title: 'Error',
          description: 'Failed to load therapists. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTherapists();
  }, [toast]);
  
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-6">
        <Card className="shadow-md">
          <CardHeader className="text-center bg-gradient-to-r from-valorwell-50 to-valorwell-100 rounded-t-lg">
            <CardTitle className="text-3xl text-valorwell-700">Select Your Therapist</CardTitle>
            <CardDescription className="text-lg mt-2">
              Choose a therapist who best fits your needs and preferences.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <p>Loading available therapists...</p>
              </div>
            ) : therapists.length === 0 ? (
              <div className="text-center py-8">
                <p>No therapists are currently available. Please check back later.</p>
                <Button 
                  className="mt-4 bg-valorwell-600 hover:bg-valorwell-700"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {therapists.map((therapist) => (
                  <Card key={therapist.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center">
                        <Avatar className="w-24 h-24 mb-4">
                          {therapist.clinician_profile_image ? (
                            <AvatarImage 
                              src={therapist.clinician_profile_image} 
                              alt={`${therapist.clinician_first_name} ${therapist.clinician_last_name}`}
                            />
                          ) : (
                            <AvatarFallback className="text-2xl bg-valorwell-100 text-valorwell-600">
                              {therapist.clinician_first_name?.[0]}{therapist.clinician_last_name?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <h3 className="text-xl font-semibold">
                          {therapist.clinician_first_name} {therapist.clinician_last_name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{therapist.clinician_title || 'Therapist'}</p>
                        <p className="text-center mt-3 text-sm">
                          {therapist.clinician_bio_short || 'No bio available'}
                        </p>
                        <Button 
                          className="mt-4 w-full bg-valorwell-600 hover:bg-valorwell-700"
                          onClick={() => {
                            // Future implementation: Handle therapist selection
                            toast({
                              title: 'Therapist Selected',
                              description: `You have selected ${therapist.clinician_first_name} ${therapist.clinician_last_name}.`,
                            });
                          }}
                        >
                          Select Therapist
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TherapistSelection;
