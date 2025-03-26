import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User, FileText, ClipboardList, Calendar as CalendarIconOutline } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase, parseDateString, formatDateForDB, getClinicianIdByName } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicians, setClinicians] = useState<any[]>([]);

  // Date fields that need to be parsed
  const [treatmentPlanStartDate, setTreatmentPlanStartDate] = useState<Date | null>(null);
  const [nextTreatmentPlanUpdate, setNextTreatmentPlanUpdate] = useState<Date | null>(null);

  // Load client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        if (!id) return;

        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setClient(data);
        
        // Parse dates from the database
        if (data.client_treatmentplan_startdate) {
          setTreatmentPlanStartDate(parseDateString(data.client_treatmentplan_startdate));
        }
        
        if (data.client_nexttreatmentplanupdate) {
          setNextTreatmentPlanUpdate(parseDateString(data.client_nexttreatmentplanupdate));
        }
        
        // Fetch all clinicians for the dropdown
        const { data: clinicianData, error: clinicianError } = await supabase
          .from('clinicians')
          .select('clinician_professional_name')
          .order('clinician_professional_name');
          
        if (clinicianError) throw clinicianError;
        
        setClinicians(clinicianData || []);
      } catch (error) {
        console.error('Error fetching client data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load client data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id, toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
  };

  // Handle dropdown changes
  const handleSelectChange = (field: string, value: string) => {
    setClient({ ...client, [field]: value });
  };

  // Save client data
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Format dates for database storage
      const updates = {
        ...client,
        client_treatmentplan_startdate: formatDateForDB(treatmentPlanStartDate),
        client_nexttreatmentplanupdate: formatDateForDB(nextTreatmentPlanUpdate),
      };
      
      // Update client record
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client information saved successfully',
      });
    } catch (error) {
      console.error('Error saving client data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save client information',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center">
            <p>Loading client information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {client?.client_first_name} {client?.client_last_name}
          </h1>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="treatment" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Treatment</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>Notes</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <CalendarIconOutline className="h-4 w-4" />
              <span>Appointments</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Client Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="client_first_name">First Name</Label>
                    <Input
                      type="text"
                      id="client_first_name"
                      name="client_first_name"
                      value={client?.client_first_name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_last_name">Last Name</Label>
                    <Input
                      type="text"
                      id="client_last_name"
                      name="client_last_name"
                      value={client?.client_last_name || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    type="email"
                    id="client_email"
                    name="client_email"
                    value={client?.client_email || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Phone</Label>
                  <Input
                    type="tel"
                    id="client_phone"
                    name="client_phone"
                    value={client?.client_phone || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_address">Address</Label>
                  <Input
                    type="text"
                    id="client_address"
                    name="client_address"
                    value={client?.client_address || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="client_city">City</Label>
                    <Input
                      type="text"
                      id="client_city"
                      name="client_city"
                      value={client?.client_city || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_state">State</Label>
                    <Input
                      type="text"
                      id="client_state"
                      name="client_state"
                      value={client?.client_state || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_zip">ZIP Code</Label>
                  <Input
                    type="text"
                    id="client_zip"
                    name="client_zip"
                    value={client?.client_zip || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatment Tab Content */}
          <TabsContent value="treatment">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assigned Therapist Field */}
                  <div className="space-y-2">
                    <Label htmlFor="client_assigned_therapist">Assigned Therapist</Label>
                    <Select 
                      value={client?.client_assigned_therapist || ''} 
                      onValueChange={(value) => handleSelectChange('client_assigned_therapist', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a therapist" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {clinicians.map((clinician) => (
                          <SelectItem 
                            key={clinician.clinician_professional_name} 
                            value={clinician.clinician_professional_name}
                          >
                            {clinician.clinician_professional_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Treatment Plan Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="client_treatmentplan_startdate">Treatment Plan Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !treatmentPlanStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {treatmentPlanStartDate ? format(treatmentPlanStartDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={treatmentPlanStartDate || undefined}
                          onSelect={setTreatmentPlanStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Plan Length */}
                  <div className="space-y-2">
                    <Label htmlFor="client_planlength">Plan Length</Label>
                    <Select 
                      value={client?.client_planlength || ''} 
                      onValueChange={(value) => handleSelectChange('client_planlength', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3 months">3 months</SelectItem>
                        <SelectItem value="6 months">6 months</SelectItem>
                        <SelectItem value="12 months">12 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Treatment Frequency */}
                  <div className="space-y-2">
                    <Label htmlFor="client_treatmentfrequency">Treatment Frequency</Label>
                    <Select 
                      value={client?.client_treatmentfrequency || ''} 
                      onValueChange={(value) => handleSelectChange('client_treatmentfrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Next Treatment Plan Update */}
                  <div className="space-y-2">
                    <Label htmlFor="client_nexttreatmentplanupdate">Next Treatment Plan Update</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !nextTreatmentPlanUpdate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nextTreatmentPlanUpdate ? format(nextTreatmentPlanUpdate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={nextTreatmentPlanUpdate || undefined}
                          onSelect={setNextTreatmentPlanUpdate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Additional treatment fields */}
                <div className="space-y-2">
                  <Label htmlFor="client_diagnosis">Diagnosis</Label>
                  <Textarea
                    id="client_diagnosis"
                    name="client_diagnosis"
                    value={client?.client_diagnosis || ''}
                    onChange={handleInputChange}
                    placeholder="Enter diagnosis details"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_presentingproblems">Presenting Problems</Label>
                  <Textarea
                    id="client_presentingproblems"
                    name="client_presentingproblems"
                    value={client?.client_presentingproblems || ''}
                    onChange={handleInputChange}
                    placeholder="Describe the client's presenting problems"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_treatmentgoals">Treatment Goals</Label>
                  <Textarea
                    id="client_treatmentgoals"
                    name="client_treatmentgoals"
                    value={client?.client_treatmentgoals || ''}
                    onChange={handleInputChange}
                    placeholder="Outline the goals of the treatment"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_progressnotes">Progress Notes</Label>
                  <Textarea
                    id="client_progressnotes"
                    name="client_progressnotes"
                    value={client?.client_progressnotes || ''}
                    onChange={handleInputChange}
                    placeholder="Record progress notes"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab Content */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Client Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Enter client notes here..." />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab Content */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Client Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Implement appointment listing or calendar here */}
                <p>Appointment details will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ClientDetails;
