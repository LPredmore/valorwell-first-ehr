
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface Client {
  client_state: string | null;
  client_age: number | null;
}

interface Therapist {
  id: string;
  clinician_first_name: string | null;
  clinician_last_name: string | null;
  clinician_professional_name: string | null;
  clinician_title: string | null;
  clinician_bio: string | null;
  clinician_bio_short: string | null;
  clinician_licensed_states: string[] | null;
  clinician_min_client_age: number | null;
  clinician_profile_image: string | null;
}

const TherapistSelection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingClient, setLoadingClient] = useState(true);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [filteringEnabled, setFilteringEnabled] = useState(true);
  
  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoadingClient(true);
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log("Not authenticated or auth error:", authError);
          setLoadingClient(false);
          return;
        }
        
        // Get client data
        const { data, error } = await supabase
          .from('clients')
          .select('client_state, client_age')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching client data:", error);
          setLoadingClient(false);
          return;
        }
        
        setClientData(data);
      } catch (error) {
        console.error("Error in fetchClientData:", error);
      } finally {
        setLoadingClient(false);
      }
    };
    
    fetchClientData();
  }, []);
  
  // Fetch therapists based on client data
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        
        // Get all active clinicians
        const { data, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('clinician_status', 'Active');
        
        if (error) {
          throw error;
        }
        
        // If filtering is enabled and we have client data, filter the results client-side
        // to handle case-insensitive matching
        if (filteringEnabled && clientData && data) {
          const filteredTherapists = data.filter(therapist => {
            let matchesState = true;
            let matchesAge = true;
            
            // Check if therapist is licensed in client's state (case-insensitive)
            if (clientData.client_state && therapist.clinician_licensed_states) {
              const clientStateNormalized = clientData.client_state.toLowerCase();
              const matchingState = therapist.clinician_licensed_states.some(
                state => state && state.toLowerCase() === clientStateNormalized
              );
              matchesState = matchingState;
            }
            
            // Check if therapist accepts client's age
            if (clientData.client_age !== null && therapist.clinician_min_client_age !== null) {
              matchesAge = therapist.clinician_min_client_age <= clientData.client_age;
            }
            
            return matchesState && matchesAge;
          });
          
          setTherapists(filteredTherapists);
        } else {
          // If filtering is disabled, show all active therapists
          setTherapists(data || []);
        }
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
  }, [toast, clientData, filteringEnabled]);
  
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
            {(loadingClient || loading) ? (
              <div className="flex justify-center py-12">
                <p>Loading available therapists...</p>
              </div>
            ) : (
              <>
                {clientData && filteringEnabled && (
                  <div className="mb-6">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Filtered Results</AlertTitle>
                      <AlertDescription>
                        {clientData.client_state && clientData.client_age ? (
                          <>
                            Showing therapists licensed in <strong>{clientData.client_state}</strong>{' '}
                            who work with clients aged <strong>{clientData.client_age}</strong> and older.
                          </>
                        ) : clientData.client_state ? (
                          <>
                            Showing therapists licensed in <strong>{clientData.client_state}</strong>.
                          </>
                        ) : clientData.client_age ? (
                          <>
                            Showing therapists who work with clients aged <strong>{clientData.client_age}</strong> and older.
                          </>
                        ) : (
                          <>Showing all available therapists.</>
                        )}
                      </AlertDescription>
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFilteringEnabled(!filteringEnabled)}
                        >
                          {filteringEnabled ? "Show All Therapists" : "Show Matching Therapists"}
                        </Button>
                      </div>
                    </Alert>
                  </div>
                )}

                {therapists.length === 0 ? (
                  <div className="text-center py-8">
                    <p>
                      {filteringEnabled && clientData?.client_state 
                        ? `No therapists are currently available in ${clientData.client_state} for your age group.`
                        : "No therapists are currently available. Please check back later."}
                    </p>
                    <div className="mt-4 space-x-2">
                      <Button 
                        className="bg-valorwell-600 hover:bg-valorwell-700"
                        onClick={() => window.location.reload()}
                      >
                        Refresh
                      </Button>
                      {filteringEnabled && (
                        <Button 
                          variant="outline"
                          onClick={() => setFilteringEnabled(false)}
                        >
                          View All Therapists
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {therapists.map((therapist) => (
                      <Card key={therapist.id} className="overflow-hidden">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/4 flex flex-col items-center">
                              <Avatar className="w-32 h-32 mb-4">
                                {therapist.clinician_profile_image ? (
                                  <AvatarImage 
                                    src={therapist.clinician_profile_image} 
                                    alt={`${therapist.clinician_first_name} ${therapist.clinician_last_name}`}
                                  />
                                ) : (
                                  <AvatarFallback className="text-4xl bg-valorwell-100 text-valorwell-600">
                                    {therapist.clinician_first_name?.[0]}{therapist.clinician_last_name?.[0]}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <h3 className="text-xl font-semibold text-center">
                                {therapist.clinician_professional_name || 
                                  `${therapist.clinician_first_name} ${therapist.clinician_last_name}`}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">{therapist.clinician_title || 'Therapist'}</p>
                              
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
                            
                            <div className="md:w-3/4">
                              <div className="prose max-w-none">
                                <h4 className="text-lg font-semibold mb-2">Biography</h4>
                                <p className="text-gray-700">
                                  {therapist.clinician_bio || 
                                    therapist.clinician_bio_short || 
                                    'No biography available for this therapist.'}
                                </p>
                                
                                {clientData?.client_state && therapist.clinician_licensed_states?.some(
                                  state => state && state.toLowerCase() === clientData.client_state?.toLowerCase()
                                ) && (
                                  <div className="mt-4 text-valorwell-700">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-valorwell-100">
                                      Licensed in your state ({clientData.client_state})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TherapistSelection;
