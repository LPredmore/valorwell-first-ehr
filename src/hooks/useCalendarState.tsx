
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { getClinicianTimeZone, getClinicianById } from '@/hooks/useClinicianData';
import { TimeZoneService } from '@/utils/timeZoneService';

interface Client {
  id: string;
  displayName: string;
}

// Helper function to ensure consistent ID format for database queries
const ensureStringId = (id: string | null): string | null => {
  if (!id) return null;
  
  // Ensure the ID is a clean string without any format issues
  return id.toString().trim();
};

// Helper function to log client-therapist assignment debug info
const logClientTherapistDebug = (message: string, data: any) => {
  console.log(`🔍 CLIENT-THERAPIST DEBUG - ${message}`, data);
};

export const useCalendarState = (initialClinicianId: string | null = null) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(initialClinicianId);
  const [clinicians, setClinicians] = useState<Array<{ id: string; clinician_professional_name: string }>>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [appointmentRefreshTrigger, setAppointmentRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clinicianTimeZone, setClinicianTimeZone] = useState<string>('America/Chicago');
  const [isLoadingTimeZone, setIsLoadingTimeZone] = useState(true);
  const [userTimeZone, setUserTimeZone] = useState<string>('');

  const formattedClinicianId = ensureStringId(selectedClinicianId);
  
  // Fetch clinician timezone
  useEffect(() => {
    const fetchClinicianTimeZone = async () => {
      if (formattedClinicianId) {
        setIsLoadingTimeZone(true);
        try {
          const timeZone = await getClinicianTimeZone(formattedClinicianId);
          console.log("Fetched clinician timezone:", timeZone);
          setClinicianTimeZone(timeZone);
        } catch (error) {
          console.error("Error fetching clinician timezone:", error);
        } finally {
          setIsLoadingTimeZone(false);
        }
      }
    };
    
    fetchClinicianTimeZone();
  }, [formattedClinicianId]);

  // Set user timezone
  useEffect(() => {
    if (clinicianTimeZone && !isLoadingTimeZone) {
      setUserTimeZone(TimeZoneService.ensureIANATimeZone(clinicianTimeZone));
    } else {
      setUserTimeZone(TimeZoneService.ensureIANATimeZone(getUserTimeZone()));
    }
  }, [clinicianTimeZone, isLoadingTimeZone]);

  // Load clinicians
  useEffect(() => {
    const fetchClinicians = async () => {
      setLoadingClinicians(true);
      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('id, clinician_professional_name')
          .order('clinician_professional_name');

        if (error) {
          console.error('Error fetching clinicians:', error);
        } else {
          console.log('Fetched clinicians:', data);
          setClinicians(data || []);
          
          // Only set default clinician if none was provided and we don't already have one
          if (data && data.length > 0 && !initialClinicianId && !selectedClinicianId) {
            console.log('Setting default clinician:', data[0].id);
            setSelectedClinicianId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingClinicians(false);
      }
    };

    fetchClinicians();
  }, [initialClinicianId]);

  // Load clients for selected clinician
  useEffect(() => {
    const fetchClientsForClinician = async () => {
      if (!formattedClinicianId) {
        console.log('Not fetching clients: clinicianId is null');
        return;
      }
      
      console.log('🔍 DEBUG - Fetching clients for clinician ID (FORMATTED):', formattedClinicianId);
      console.log('🔍 DEBUG - Original clinician ID before formatting:', selectedClinicianId);
      console.log('🔍 DEBUG - Clinician ID type:', typeof formattedClinicianId);
      setLoadingClients(true);
      setClients([]);
      
      try {
        // First, fetch the clinician record to get the correctly formatted ID from the database
        console.log('🔍 DEBUG - Calling getClinicianById with ID:', formattedClinicianId);
        const clinicianRecord = await getClinicianById(formattedClinicianId);
        console.log('🔍 DEBUG - Clinician record returned:', clinicianRecord);
        
        if (!clinicianRecord) {
          console.error('Could not find clinician with ID:', formattedClinicianId);
          setLoadingClients(false);
          return;
        }
        
        // Use the database-retrieved ID to ensure exact format match
        const databaseClinicianId = clinicianRecord.id;
        const clinicianEmail = clinicianRecord.clinician_email || '';
        console.log('🔍 DEBUG - Database-retrieved clinician ID:', databaseClinicianId);
        console.log('🔍 DEBUG - Database clinician ID type:', typeof databaseClinicianId);
        console.log('🔍 DEBUG - Clinician email:', clinicianEmail);
        
        // First, check if there are any clients with assigned therapists at all
        const { data: allClientsWithTherapists, error: allClientsError } = await supabase
          .from('clients')
          .select('id, client_first_name, client_preferred_name, client_last_name, client_assigned_therapist')
          .not('client_assigned_therapist', 'is', null)
          .limit(10);
          
        console.log('🔍 DEBUG - Sample of clients with assigned therapists:', allClientsWithTherapists);
        if (allClientsWithTherapists && allClientsWithTherapists.length > 0) {
          console.log('🔍 DEBUG - Example client_assigned_therapist value:', allClientsWithTherapists[0].client_assigned_therapist);
          console.log('🔍 DEBUG - Example therapist value type:', typeof allClientsWithTherapists[0].client_assigned_therapist);
        }
        
        // Use a more comprehensive query to find clients by either ID or email
        logClientTherapistDebug('Querying clients with OR conditions for ID and email', {
          databaseClinicianId,
          clinicianEmail,
          idType: typeof databaseClinicianId
        });
        
        // First attempt: Try exact matches with both ID and email
        const { data, error } = await supabase
          .from('clients')
          .select('id, client_first_name, client_preferred_name, client_last_name, client_assigned_therapist')
          .or(`client_assigned_therapist.eq.${databaseClinicianId},client_assigned_therapist.eq.${clinicianEmail}`)
          .order('client_last_name');
          
        if (error) {
          console.error('Error fetching clients:', error);
        } else {
          console.log('🔍 DEBUG - Clients fetched successfully. Count:', data.length);
          console.log('🔍 DEBUG - Raw client data:', data);
          console.log('🔍 DEBUG - Database clinician ID used for query:', databaseClinicianId);
          
          if (data.length === 0) {
            logClientTherapistDebug('No clients found with direct ID or email match', {
              attemptedId: databaseClinicianId,
              attemptedEmail: clinicianEmail
            });
            
            // Second attempt: Try with ILIKE for partial matching
            logClientTherapistDebug('Trying more aggressive query with ILIKE', {
              partialIdSearch: `%${databaseClinicianId}%`,
              partialEmailSearch: `%${clinicianEmail}%`
            });
            
            const { data: likeData, error: likeError } = await supabase
              .from('clients')
              .select('id, client_first_name, client_preferred_name, client_last_name, client_assigned_therapist')
              .or(`client_assigned_therapist.ilike.%${databaseClinicianId}%,client_assigned_therapist.ilike.%${clinicianEmail}%`)
              .order('client_last_name');
              
            if (!likeError && likeData && likeData.length > 0) {
              logClientTherapistDebug('Found clients with ILIKE query', {
                clientCount: likeData.length,
                firstClientTherapist: likeData[0].client_assigned_therapist,
                therapistType: typeof likeData[0].client_assigned_therapist
              });
              
              // Use these clients instead
              const formattedLikeClients = likeData.map(client => ({
                id: client.id,
                displayName: `${client.client_preferred_name || client.client_first_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
              }));
              logClientTherapistDebug('Setting clients using ILIKE match', {
                clientCount: formattedLikeClients.length,
                clients: formattedLikeClients
              });
              setClients(formattedLikeClients);
              setLoadingClients(false);
              return;
            } else {
              logClientTherapistDebug('No clients found with ILIKE query either', {
                error: likeError
              });
            }
            
            // Third attempt: Try to find ANY clients with non-null therapist assignments
            logClientTherapistDebug('Checking for ANY clients with therapist assignments', {});
            const { data: anyClients, error: anyError } = await supabase
              .from('clients')
              .select('id, client_first_name, client_preferred_name, client_last_name, client_assigned_therapist')
              .not('client_assigned_therapist', 'is', null)
              .limit(5);
              
            if (!anyError && anyClients && anyClients.length > 0) {
              logClientTherapistDebug('Found some clients with therapist assignments', {
                clientCount: anyClients.length,
                sampleAssignments: anyClients.map(c => ({
                  clientId: c.id,
                  therapistId: c.client_assigned_therapist,
                  therapistIdType: typeof c.client_assigned_therapist
                }))
              });
            } else {
              logClientTherapistDebug('No clients found with ANY therapist assignments', {
                error: anyError
              });
            }
            
            // Fourth attempt: Use the enhanced debug function to find potential matches
            logClientTherapistDebug('Running enhanced_debug_client_therapist function', {
              therapistId: databaseClinicianId
            });
            const { data: enhancedDebugData, error: enhancedDebugError } = await supabase
              .rpc('enhanced_debug_client_therapist', {
                p_therapist_id: databaseClinicianId
              });
              
            if (!enhancedDebugError && enhancedDebugData) {
              logClientTherapistDebug('Enhanced debug query results', {
                resultCount: enhancedDebugData.length,
                results: enhancedDebugData
              });
              
              // Check if we have any matches that aren't exact but could be fixed
              const exactMatches = enhancedDebugData.filter(item => item.exact_match);
              const containsMatches = enhancedDebugData.filter(item => item.contains_match);
              const emailMatches = enhancedDebugData.filter(item => item.email_match);
              
              logClientTherapistDebug('Match breakdown', {
                exactMatchCount: exactMatches.length,
                containsMatchCount: containsMatches.length,
                emailMatchCount: emailMatches.length
              });
              
              if (emailMatches.length > 0 || containsMatches.length > 0) {
                logClientTherapistDebug('Found clients with email or contains matches', {
                  emailMatches,
                  containsMatches
                });
                
                // Try to fix the client-therapist assignments
                logClientTherapistDebug('Attempting to fix client-therapist assignments', {});
                const { data: fixResults, error: fixError } = await supabase
                  .rpc('fix_client_therapist_assignments');
                  
                if (!fixError && fixResults) {
                  logClientTherapistDebug('Fix results', {
                    fixedCount: fixResults.filter(r => r.updated).length,
                    results: fixResults
                  });
                  
                  // Try the query again after fixing - use both ID and email to be safe
                  logClientTherapistDebug('Retrying client query after fix', {
                    usingId: databaseClinicianId
                  });
                  const { data: fixedData, error: fixedError } = await supabase
                    .from('clients')
                    .select('id, client_first_name, client_preferred_name, client_last_name, client_assigned_therapist')
                    .or(`client_assigned_therapist.eq.${databaseClinicianId},client_assigned_therapist.eq.${clinicianEmail}`)
                    .order('client_last_name');
                    
                  if (!fixedError && fixedData && fixedData.length > 0) {
                    logClientTherapistDebug('Found clients after fix', {
                      clientCount: fixedData.length,
                      sampleTherapistId: fixedData[0].client_assigned_therapist,
                      sampleTherapistIdType: typeof fixedData[0].client_assigned_therapist
                    });
                    
                    const formattedFixedClients = fixedData.map(client => ({
                      id: client.id,
                      displayName: `${client.client_preferred_name || client.client_first_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
                    }));
                    logClientTherapistDebug('Setting clients after fix', {
                      clientCount: formattedFixedClients.length
                    });
                    setClients(formattedFixedClients);
                    setLoadingClients(false);
                    return;
                  } else {
                    logClientTherapistDebug('No clients found after fix attempt', {
                      error: fixedError
                    });
                  }
                }
              }
            }
          }
          
          const formattedClients = data.map(client => ({
            id: client.id,
            displayName: `${client.client_preferred_name || client.client_first_name || ''} ${client.client_last_name || ''}`.trim() || 'Unnamed Client'
          }));
          logClientTherapistDebug('Formatted clients from initial query', {
            clientCount: formattedClients.length,
            clients: formattedClients
          });
          setClients(formattedClients);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClientsForClinician();
  }, [formattedClinicianId]);

  return {
    view,
    setView,
    showAvailability,
    setShowAvailability,
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    loadingClinicians,
    currentDate,
    setCurrentDate,
    clients,
    loadingClients,
    appointmentRefreshTrigger,
    setAppointmentRefreshTrigger,
    isDialogOpen,
    setIsDialogOpen,
    userTimeZone,
    isLoadingTimeZone,
  };
};
