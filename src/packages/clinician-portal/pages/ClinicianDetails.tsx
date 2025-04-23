import React from 'react';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label
} from '@/components/ui';
import { timezoneList } from '@/utils/timeZoneUtils';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { TimeInput } from '@/components/ui/time-input';

const ClinicianDetails = () => {
  const { clinicianId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clinicianData, setClinicianData] = useState({
    clinician_first_name: '',
    clinician_last_name: '',
    clinician_professional_name: '',
    clinician_email: '',
    clinician_phone: '',
    clinician_address: '',
    clinician_city: '',
    clinician_state: '',
    clinician_zip: '',
    clinician_license_number: '',
    clinician_license_type: '',
    clinician_license_issue_date: '',
    clinician_license_expiration_date: '',
    clinician_NPI_number: '',
    clinician_DEA_number: '',
    clinician_supervising_doctor: '',
    clinician_notes: '',
    time_zone: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchClinicianData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', clinicianId)
          .single();

        if (error) {
          console.error('Error fetching clinician data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load clinician details.',
            variant: 'destructive',
          });
        }

        if (data) {
          setClinicianData(data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicianData();
  }, [clinicianId, toast]);

  const handleInputChange = (field: string, value: string) => {
    setClinicianData(prevData => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('clinicians')
        .update(clinicianData)
        .eq('id', clinicianId);

      if (error) {
        console.error('Error updating clinician data:', error);
        toast({
          title: 'Error',
          description: 'Failed to save clinician details.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Clinician details saved successfully.',
        });
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this clinician?')) {
      try {
        const { error } = await supabase
          .from('clinicians')
          .delete()
          .eq('id', clinicianId);

        if (error) {
          console.error('Error deleting clinician:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete clinician.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Clinician deleted successfully.',
          });
          navigate('/clinicians');
        }
      } catch (error) {
        console.error('Error during deletion:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred during deletion.',
          variant: 'destructive',
        });
      }
    }
  };

  if (isLoading) {
    return <Layout><div>Loading clinician details...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Clinician Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinician_first_name">First Name</Label>
                <Input
                  id="clinician_first_name"
                  value={clinicianData.clinician_first_name}
                  onChange={(e) => handleInputChange('clinician_first_name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="clinician_last_name">Last Name</Label>
                <Input
                  id="clinician_last_name"
                  value={clinicianData.clinician_last_name}
                  onChange={(e) => handleInputChange('clinician_last_name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinician_professional_name">Professional Name</Label>
              <Input
                id="clinician_professional_name"
                value={clinicianData.clinician_professional_name}
                onChange={(e) => handleInputChange('clinician_professional_name', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinician_email">Email</Label>
                <Input
                  id="clinician_email"
                  type="email"
                  value={clinicianData.clinician_email}
                  onChange={(e) => handleInputChange('clinician_email', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="clinician_phone">Phone</Label>
                <Input
                  id="clinician_phone"
                  value={clinicianData.clinician_phone}
                  onChange={(e) => handleInputChange('clinician_phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinician_address">Address</Label>
              <Input
                id="clinician_address"
                value={clinicianData.clinician_address}
                onChange={(e) => handleInputChange('clinician_address', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="clinician_city">City</Label>
                <Input
                  id="clinician_city"
                  value={clinicianData.clinician_city}
                  onChange={(e) => handleInputChange('clinician_city', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="clinician_state">State</Label>
                <Input
                  id="clinician_state"
                  value={clinicianData.clinician_state}
                  onChange={(e) => handleInputChange('clinician_state', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="clinician_zip">Zip</Label>
                <Input
                  id="clinician_zip"
                  value={clinicianData.clinician_zip}
                  onChange={(e) => handleInputChange('clinician_zip', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinician_license_number">License Number</Label>
                <Input
                  id="clinician_license_number"
                  value={clinicianData.clinician_license_number}
                  onChange={(e) => handleInputChange('clinician_license_number', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="clinician_license_type">License Type</Label>
                <Input
                  id="clinician_license_type"
                  value={clinicianData.clinician_license_type}
                  onChange={(e) => handleInputChange('clinician_license_type', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinician_license_issue_date">License Issue Date</Label>
                <Input
                  id="clinician_license_issue_date"
                  type="date"
                  value={clinicianData.clinician_license_issue_date ? format(new Date(clinicianData.clinician_license_issue_date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleInputChange('clinician_license_issue_date', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="clinician_license_expiration_date">License Expiration Date</Label>
                <Input
                  id="clinician_license_expiration_date"
                  type="date"
                  value={clinicianData.clinician_license_expiration_date ? format(new Date(clinicianData.clinician_license_expiration_date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleInputChange('clinician_license_expiration_date', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinician_NPI_number">NPI Number</Label>
                <Input
                  id="clinician_NPI_number"
                  value={clinicianData.clinician_NPI_number}
                  onChange={(e) => handleInputChange('clinician_NPI_number', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="clinician_DEA_number">DEA Number</Label>
                <Input
                  id="clinician_DEA_number"
                  value={clinicianData.clinician_DEA_number}
                  onChange={(e) => handleInputChange('clinician_DEA_number', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinician_supervising_doctor">Supervising Doctor</Label>
              <Input
                id="clinician_supervising_doctor"
                value={clinicianData.clinician_supervising_doctor}
                onChange={(e) => handleInputChange('clinician_supervising_doctor', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="clinician_notes">Notes</Label>
              <Textarea
                id="clinician_notes"
                value={clinicianData.clinician_notes}
                onChange={(e) => handleInputChange('clinician_notes', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="time_zone">Time Zone</Label>
              <Select value={clinicianData.time_zone} onValueChange={(value) => handleInputChange('time_zone', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a time zone" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneList.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button isLoading={isSaving} onClick={handleSave}>
                    Save
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit</Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClinicianDetails;
