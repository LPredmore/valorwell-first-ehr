import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react'; // Added Loader2 for visual feedback
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext'; // Import useUser

interface Client {
  client_state: string | null;
  client_age: number | null;
  // Add other client fields if needed by this component
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
  clinician_profile_image: string | null; // Kept for potential legacy use
  clinician_image_url: string | null; // Preferred field for profile image
  // Add other therapist fields if needed
}

const TherapistSelection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, userId: authUserId, isLoading: isUserContextLoading, clientProfile: userClientProfile } = useUser(); // Use UserContext

  const [loadingTherapists, setLoadingTherapists] = useState(true); // For therapist list
  const [clientData, setClientData] = useState<Client | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [allTherapists, setAllTherapists] = useState<Therapist[]>([]); // To store the full list for fallback
  const [filteringApplied, setFilteringApplied] = useState(false); // To track if filters were active
  const [selectingTherapistId, setSelectingTherapistId] = useState<string | null>(null);


  // Effect to set clientData from UserContext once available
  useEffect(() => {
    if (!isUserContextLoading && authUserId) {
      if (userClientProfile) {
        console.log('[TherapistSelection] Using clientProfile from UserContext:', JSON.stringify({
          client_state: userClientProfile.client_state,
          client_age: userClientProfile.client_age
        }, null, 2));
        setClientData({
          client_state: userClientProfile.client_state || null,
          client_age: userClientProfile.client_age === undefined ? null : Number(userClientProfile.client_age), // Ensure age is number or null
        });
      } else {
        // This case might indicate profile setup isn't complete or UserContext isn't fully synced
        console.warn('[TherapistSelection] Client profile not available in UserContext. User might need to complete profile setup.');
        toast({
            title: "Profile Incomplete",
            description: "Please complete your profile setup to select a therapist.",
            variant: "destructive",
        });
        // Optionally navigate to profile setup if status indicates 'New'
        // if (userClientProfile?.client_status === 'New') navigate('/profile-setup');
        setClientData(null); // Ensure clientData is null if no profile
      }
    } else if (!isUserContextLoading && !authUserId) {
        console.log("[TherapistSelection] No authenticated user. Redirecting to login.");
        toast({
            title: "Authentication Required",
            description: "Please log in to view therapists.",
            variant: "destructive",
        });
        navigate('/login');
    }
  }, [authUserId, isUserContextLoading, userClientProfile, navigate, toast]);


  // Effect to fetch therapists and apply filters
  useEffect(() => {
    // Only fetch therapists if clientData has been determined (even if null, indicating no specific filters apply)
    // and user context is no longer loading.
    if (isUserContextLoading) {
        console.log("[TherapistSelection] Waiting for UserContext to load before fetching therapists.");
        return;
    }

    const fetchAndFilterTherapists = async () => {
      setLoadingTherapists(true);
      setFilteringApplied(false); // Reset filtering applied flag
      try {
        const { data: activeTherapists, error } = await supabase
          .from('clinicians')
          .select('id, clinician_first_name, clinician_last_name, clinician_professional_name, clinician_title, clinician_bio, clinician_bio_short, clinician_licensed_states, clinician_min_client_age, clinician_profile_image, clinician_image_url')
          .eq('clinician_status', 'Active');

        if (error) {
          console.error('Error fetching therapists:', error);
          throw error;
        }
        
        const fetchedTherapists = activeTherapists || [];
        console.log("[TherapistSelection] Total active therapists fetched:", fetchedTherapists.length);
        if (fetchedTherapists.length > 0) {
            console.log("[TherapistSelection] Sample therapist data from DB:", JSON.stringify(fetchedTherapists[0], null, 2));
        }
        setAllTherapists(fetchedTherapists); // Store all for potential fallback

        if (clientData && (clientData.client_state || clientData.client_age !== null)) {
          console.log('[TherapistSelection] FILTERING - Using clientData:', JSON.stringify(clientData, null, 2));
          setFilteringApplied(true);

          const filtered = fetchedTherapists.filter(therapist => {
            let matchesState = !clientData.client_state; // If client has no state, don't filter by state (or consider it a match)
            let matchesAge = true; // Default to true, will be set by specific conditions

            // State Matching Logic
            if (clientData.client_state && therapist.clinician_licensed_states && therapist.clinician_licensed_states.length > 0) {
              const clientStateNormalized = clientData.client_state.toLowerCase().trim();
              matchesState = therapist.clinician_licensed_states.some(state => {
                if (!state) return false;
                const stateNormalized = state.toLowerCase().trim();
                return stateNormalized.includes(clientStateNormalized) || clientStateNormalized.includes(stateNormalized);
              });
            } else if (clientData.client_state && (!therapist.clinician_licensed_states || therapist.clinician_licensed_states.length === 0)) {
                matchesState = false; // Client has a state, therapist has no licensed states listed
            }
            // If clientData.client_state is null/empty, matchesState remains true (or its initial value based on above)

            // Age Matching Logic
            const currentClientAge = clientData.client_age; // This is number | null
            const therapistMinAge = therapist.clinician_min_client_age; // This is number | null

            console.log(`[TherapistSelection] FILTER - Therapist ID: ${therapist.id} (${therapist.clinician_professional_name || therapist.clinician_first_name})`);
            console.log(`  Client State: ${clientData.client_state}, Therapist States: ${therapist.clinician_licensed_states}, Matches State: ${matchesState}`);
            
            if (currentClientAge !== null && currentClientAge !== undefined) {
              if (therapistMinAge !== null && therapistMinAge !== undefined) {
                matchesAge = currentClientAge >= therapistMinAge;
                console.log(`  Client Age: ${currentClientAge}, Min Therapist Age: ${therapistMinAge}, Matches Age: ${matchesAge}`);
              } else {
                // Therapist has no min age requirement, so age matches by default
                matchesAge = true;
                console.log(`  Client Age: ${currentClientAge}, Min Therapist Age: null, Matches Age: true (therapist has no min age)`);
              }
            } else {
              // Client age is null/undefined, so age filter effectively passes (therapist is considered a match age-wise)
              // This means if client_age is not set, we don't filter out therapists based on age.
              matchesAge = true;
              console.log(`  Client Age: null/undefined, Matches Age: true (client age not set - not filtering by age)`);
            }
            
            return matchesState && matchesAge;
          });

          console.log(`[TherapistSelection] FILTERING COMPLETE - Filtered count: ${filtered.length}, Total active therapists: ${fetchedTherapists.length}`);
          
          if (filtered.length === 0 && fetchedTherapists.length > 0) {
            console.log("[TherapistSelection] No matching therapists found after filtering, showing all active therapists as fallback.");
            setTherapists(fetchedTherapists); // Fallback to all therapists
            toast({
              title: "Filtered Results",
              description: "No therapists matched all your criteria. Showing all available therapists.",
              variant: "default"
            });
            setFilteringApplied(false); // Indicate that the displayed list is not the filtered list
          } else {
            setTherapists(filtered);
          }
        } else {
          // No clientData for filtering or clientData has no state/age, so show all therapists
          console.log("[TherapistSelection] No client data for filtering or no state/age provided, showing all active therapists.");
          setTherapists(fetchedTherapists);
          setFilteringApplied(false);
        }
      } catch (error: any) {
        console.error('Error fetching or filtering therapists:', error);
        toast({
          title: 'Error Loading Therapists',
          description: error.message || 'Failed to load therapists. Please try again later.',
          variant: 'destructive'
        });
        setTherapists([]); // Clear therapists on error
        setAllTherapists([]);
      } finally {
        setLoadingTherapists(false);
        console.log("[TherapistSelection] fetchAndFilterTherapists finished. loadingTherapists: false");
      }
    };

    // Only run if UserContext is initialized and we have clientData (or know it's null)
    if (!isUserContextLoading) {
        fetchAndFilterTherapists();
    }

  }, [isUserContextLoading, clientData, toast]); // Removed filteringEnabled as it was causing loops

  const handleSelectTherapist = async (therapist: Therapist) => {
    if (!authUserId) {
      toast({ title: "Authentication required", description: "Please log in to select a therapist", variant: "destructive" });
      navigate('/login');
      return;
    }
    setSelectingTherapistId(therapist.id); // Show loading state for this specific therapist
    try {
      const { error } = await supabase
        .from('clients')
        .update({ client_assigned_therapist: therapist.id, client_status: 'Therapist Selected' }) // Optionally update status
        .eq('id', authUserId);

      if (error) {
        console.error("Error selecting therapist:", error);
        toast({ title: "Error", description: "Failed to select therapist. Please try again.", variant: "destructive" });
        return;
      }
      
      toast({
        title: "Therapist Selected!",
        description: `You have selected ${therapist.clinician_professional_name || `${therapist.clinician_first_name} ${therapist.clinician_last_name}`}.`,
      });

      // Refresh user context to get updated client_status if needed by other parts of the app
      // Assuming refreshUserData is available from useUser()
      // await refreshUserData(); 

      navigate('/patient-dashboard'); // Or to a confirmation page
    } catch (error: any) {
      console.error("Exception in handleSelectTherapist:", error);
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setSelectingTherapistId(null);
    }
  };
  
  const displayTherapistName = (therapist: Therapist) => {
    return therapist.clinician_professional_name || `${therapist.clinician_first_name || ''} ${therapist.clinician_last_name || ''}`.trim();
  };

  if (isUserContextLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-6 flex justify-center items-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-valorwell-600" />
          <p className="ml-4 text-lg">Loading user information...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-6">
        <Card className="shadow-lg border-valorwell-300">
          <CardHeader className="text-center bg-gradient-to-r from-valorwell-50 to-valorwell-100 rounded-t-lg py-8">
            <CardTitle className="text-3xl md:text-4xl font-bold text-valorwell-700">Select Your Therapist</CardTitle>
            <CardDescription className="text-lg md:text-xl mt-2 text-valorwell-600">
              Choose a therapist who best fits your needs and preferences.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 px-4 md:px-6">
            {loadingTherapists ? (
              <div className="flex flex-col justify-center items-center py-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-valorwell-600" />
                <p className="mt-4 text-lg text-gray-600">Loading available therapists...</p>
              </div>
            ) : (
              <>
                {filteringApplied && clientData && (clientData.client_state || clientData.client_age !== null) && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <Alert>
                      <Info className="h-5 w-5 text-blue-600" />
                      <AlertTitle className="font-semibold text-blue-700">Filtered Results</AlertTitle>
                      <AlertDescription className="text-blue-600">
                        {clientData.client_state && clientData.client_age !== null ? (
                          <>
                            Showing therapists licensed in <strong>{clientData.client_state}</strong> who work with clients aged <strong>{clientData.client_age}</strong> and older.
                          </>
                        ) : clientData.client_state ? (
                          <>
                            Showing therapists licensed in <strong>{clientData.client_state}</strong>.
                          </>
                        ) : clientData.client_age !== null ? (
                          <>
                            Showing therapists who work with clients aged <strong>{clientData.client_age}</strong> and older.
                          </>
                        ) : null }
                         {!filteringApplied && therapists.length > 0 && therapists.length !== allTherapists.length && " (Showing all due to no exact match)"}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {therapists.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-600 mb-4">
                      {filteringApplied && (clientData?.client_state || clientData?.client_age !== null)
                        ? `No therapists currently match your specific criteria (State: ${clientData?.client_state || 'N/A'}, Age: ${clientData?.client_age ?? 'N/A'}).`
                        : "No therapists are currently available. Please check back later."}
                    </p>
                    <p className="text-gray-500">If you believe this is an error, please contact support or try refreshing.</p>
                    <Button 
                      className="mt-6 bg-valorwell-600 hover:bg-valorwell-700"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {therapists.map((therapist) => (
                      <Card key={therapist.id} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div className="p-6">
                          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                            <div className="flex-shrink-0 flex flex-col items-center sm:w-1/4">
                              <Avatar className="w-32 h-32 mb-4 border-2 border-valorwell-200">
                                <AvatarImage 
                                  src={therapist.clinician_image_url || therapist.clinician_profile_image || undefined} 
                                  alt={displayTherapistName(therapist)}
                                />
                                <AvatarFallback className="text-4xl bg-valorwell-100 text-valorwell-600">
                                  {therapist.clinician_first_name?.[0]?.toUpperCase()}
                                  {therapist.clinician_last_name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <h3 className="text-xl font-semibold text-center text-valorwell-700">
                                {displayTherapistName(therapist)}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1 text-center">{therapist.clinician_title || 'Therapist'}</p>
                              
                              <Button 
                                className="mt-4 w-full bg-valorwell-600 hover:bg-valorwell-700 text-white"
                                onClick={() => handleSelectTherapist(therapist)}
                                disabled={selectingTherapistId === therapist.id}
                              >
                                {selectingTherapistId === therapist.id ? 
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {selectingTherapistId === therapist.id ? 'Selecting...' : 'Select Therapist'}
                              </Button>
                            </div>
                            
                            <div className="sm:w-3/4">
                              <div className="prose max-w-none">
                                <h4 className="text-lg font-semibold mb-2 text-valorwell-600 border-b pb-1">Biography</h4>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {therapist.clinician_bio || 
                                   therapist.clinician_bio_short || 
                                   'No biography available for this therapist.'}
                                </p>
                                
                                {clientData?.client_state && therapist.clinician_licensed_states?.some(
                                  state => {
                                    if (!state || !clientData.client_state) return false;
                                    const stateNorm = state.toLowerCase().trim();
                                    const clientStateNorm = clientData.client_state.toLowerCase().trim();
                                    return stateNorm.includes(clientStateNorm) || clientStateNorm.includes(stateNorm);
                                  }
                                ) && (
                                  <div className="mt-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
