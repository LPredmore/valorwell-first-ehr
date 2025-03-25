
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Clinician {
  id: string;
  clinician_professional_name: string | null;
}

interface EditClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onClientUpdated: () => void;
}

const EditClientDialog: React.FC<EditClientDialogProps> = ({ isOpen, onClose, client, onClientUpdated }) => {
  const [formData, setFormData] = useState<any>({});
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [dob, setDob] = useState<Date | undefined>(
    client?.client_date_of_birth ? new Date(client.client_date_of_birth) : undefined
  );

  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        // Ensure date is properly formatted for the calendar
        client_date_of_birth: client.client_date_of_birth ? new Date(client.client_date_of_birth) : undefined
      });
      
      if (client.client_date_of_birth) {
        setDob(new Date(client.client_date_of_birth));
      }
    }
  }, [client]);

  useEffect(() => {
    fetchClinicians();
  }, []);

  const fetchClinicians = async () => {
    try {
      const { data, error } = await supabase
        .from('clinicians')
        .select('id, clinician_professional_name');
      
      if (error) {
        throw error;
      }
      
      setClinicians(data || []);
    } catch (error) {
      console.error('Error fetching clinicians:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clinicians.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const calculateAge = (birthDate: Date | undefined) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), birthDate);
  };

  const handleDateChange = (date: Date | undefined) => {
    setDob(date);
    if (date) {
      setFormData({
        ...formData,
        client_date_of_birth: date,
        client_age: calculateAge(date)
      });
    } else {
      setFormData({
        ...formData,
        client_date_of_birth: null,
        client_age: null
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          client_first_name: formData.client_first_name,
          client_last_name: formData.client_last_name,
          client_preferred_name: formData.client_preferred_name,
          client_email: formData.client_email,
          client_phone: formData.client_phone,
          client_date_of_birth: formData.client_date_of_birth,
          client_age: calculateAge(formData.client_date_of_birth),
          client_gender: formData.client_gender,
          client_gender_identity: formData.client_gender_identity,
          client_state: formData.client_state,
          client_time_zone: formData.client_time_zone,
          client_minor: formData.client_minor,
          client_status: formData.client_status,
          client_assigned_therapist: formData.client_assigned_therapist,
          client_referral_source: formData.client_referral_source,
          client_treatment_goal: formData.client_treatment_goal
        })
        .eq('id', client.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Client information updated successfully.",
      });
      
      onClientUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // US Time Zones
  const timeZones = [
    "Eastern Time (ET)",
    "Central Time (CT)",
    "Mountain Time (MT)",
    "Pacific Time (PT)",
    "Alaska Time (AKT)",
    "Hawaii-Aleutian Time (HST)"
  ];

  // US States in alphabetical order
  const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", 
    "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
    "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  // Referral sources
  const referralSources = [
    "Family or Friend",
    "Veterans Organization", 
    "Web Search", 
    "Facebook", 
    "Instagram", 
    "Other Social Media", 
    "Other"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client Information</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div>
              <Label htmlFor="client_first_name">First Name</Label>
              <Input
                id="client_first_name"
                name="client_first_name"
                value={formData.client_first_name || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="client_preferred_name">Preferred Name</Label>
              <Input
                id="client_preferred_name"
                name="client_preferred_name"
                value={formData.client_preferred_name || ''}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="client_last_name">Last Name</Label>
              <Input
                id="client_last_name"
                name="client_last_name"
                value={formData.client_last_name || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="client_date_of_birth">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dob && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dob}
                    onSelect={handleDateChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="client_age">Age</Label>
              <Input
                id="client_age"
                name="client_age"
                value={formData.client_age || ''}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="client_gender">Birth Gender</Label>
              <Select 
                value={formData.client_gender || ''} 
                onValueChange={(value) => handleSelectChange('client_gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client_gender_identity">Gender Identity</Label>
              <Select 
                value={formData.client_gender_identity || ''} 
                onValueChange={(value) => handleSelectChange('client_gender_identity', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender identity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client_email">Email</Label>
              <Input
                id="client_email"
                name="client_email"
                type="email"
                value={formData.client_email || ''}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="client_phone">Phone</Label>
              <Input
                id="client_phone"
                name="client_phone"
                value={formData.client_phone || ''}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="client_state">State</Label>
              <Select 
                value={formData.client_state || ''} 
                onValueChange={(value) => handleSelectChange('client_state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {usStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client_time_zone">Time Zone</Label>
              <Select 
                value={formData.client_time_zone || ''} 
                onValueChange={(value) => handleSelectChange('client_time_zone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  {timeZones.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client_minor">Minor</Label>
              <Select 
                value={formData.client_minor || ''} 
                onValueChange={(value) => handleSelectChange('client_minor', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select minor status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clinical Information */}
            <div>
              <Label htmlFor="client_referral_source">Referral Source</Label>
              <Select 
                value={formData.client_referral_source || ''} 
                onValueChange={(value) => handleSelectChange('client_referral_source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select referral source" />
                </SelectTrigger>
                <SelectContent>
                  {referralSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client_status">Client Status</Label>
              <Select 
                value={formData.client_status || ''} 
                onValueChange={(value) => handleSelectChange('client_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Waiting">Waiting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="client_assigned_therapist">Assigned Therapist</Label>
              <Select 
                value={formData.client_assigned_therapist || ''} 
                onValueChange={(value) => handleSelectChange('client_assigned_therapist', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select therapist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {clinicians.map(clinician => (
                    <SelectItem key={clinician.id} value={clinician.clinician_professional_name || ''}>
                      {clinician.clinician_professional_name || 'Unnamed'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="client_treatment_goal">Treatment Goal</Label>
              <Textarea
                id="client_treatment_goal"
                name="client_treatment_goal"
                value={formData.client_treatment_goal || ''}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
