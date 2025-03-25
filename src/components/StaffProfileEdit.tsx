
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from "@/components/ui/textarea";

type StaffProfileEditProps = {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
};

type StaffProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  professional_name: string | null;
  phone: string | null;
  bio: string | null;
  clinician_type: string | null;
  license_type: string | null;
  npi_number: string | null;
  taxonomy_code: string | null;
};

const StaffProfileEdit = ({ isOpen, onClose, staffId }: StaffProfileEditProps) => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && staffId) {
      fetchStaffMember(staffId);
    }
  }, [isOpen, staffId]);

  const fetchStaffMember = async (id: string) => {
    setIsLoading(true);
    try {
      console.log('Fetching staff member with ID:', id);
      
      // Only get the clinician data
      const { data: clinicianData, error: clinicianError } = await supabase
        .from('clinicians')
        .select('id, email, first_name, last_name, professional_name, phone, bio, clinician_type, license_type, npi_number, taxonomy_code')
        .eq('id', id)
        .single();

      if (clinicianError) {
        console.error('Error fetching clinician data:', clinicianError);
        throw clinicianError;
      }
      
      console.log('Clinician data fetched:', clinicianData);

      setProfile({
        id: clinicianData.id,
        email: clinicianData.email,
        first_name: clinicianData.first_name,
        last_name: clinicianData.last_name,
        professional_name: clinicianData.professional_name,
        phone: clinicianData.phone,
        bio: clinicianData.bio,
        clinician_type: clinicianData.clinician_type,
        license_type: clinicianData.license_type,
        npi_number: clinicianData.npi_number,
        taxonomy_code: clinicianData.taxonomy_code
      });
    } catch (error) {
      console.error('Error fetching staff member:', error);
      toast.error('Failed to load staff member details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (!profile) return;
    
    setProfile(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      // Update clinician information only
      const { error: updateError } = await supabase
        .from('clinicians')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          professional_name: profile.professional_name,
          phone: profile.phone,
          bio: profile.bio,
          clinician_type: profile.clinician_type,
          license_type: profile.license_type,
          npi_number: profile.npi_number,
          taxonomy_code: profile.taxonomy_code
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Staff profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating staff profile:', error);
      toast.error('Failed to update staff profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile && !isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Profile</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center">Loading staff profile...</div>
        ) : profile ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input 
                  id="first_name" 
                  value={profile.first_name || ''} 
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input 
                  id="last_name" 
                  value={profile.last_name || ''} 
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="professional_name">Professional Name</Label>
              <Input 
                id="professional_name" 
                value={profile.professional_name || ''} 
                onChange={(e) => handleInputChange('professional_name', e.target.value)}
                placeholder="Professional name for display"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={profile.email || ''} 
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value={profile.phone || ''} 
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea 
                id="bio" 
                value={profile.bio || ''} 
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Clinician biography"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinician_type">Clinician Type</Label>
                <Select 
                  value={profile.clinician_type || ''} 
                  onValueChange={(value) => handleInputChange('clinician_type', value)}
                >
                  <SelectTrigger id="clinician_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mental Health">Mental Health</SelectItem>
                    <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="license_type">License Type</Label>
                <Select 
                  value={profile.license_type || ''} 
                  onValueChange={(value) => handleInputChange('license_type', value)}
                >
                  <SelectTrigger id="license_type">
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LCP">LCP</SelectItem>
                    <SelectItem value="LMHT">LMHT</SelectItem>
                    <SelectItem value="LMFT">LMFT</SelectItem>
                    <SelectItem value="LCSW">LCSW</SelectItem>
                    <SelectItem value="Psychologist">Psychologist</SelectItem>
                    <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="npi_number">NPI Number</Label>
                <Input 
                  id="npi_number" 
                  value={profile.npi_number || ''} 
                  onChange={(e) => handleInputChange('npi_number', e.target.value)}
                  placeholder="National Provider Identifier"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxonomy_code">Taxonomy Code</Label>
                <Input 
                  id="taxonomy_code" 
                  value={profile.taxonomy_code || ''} 
                  onChange={(e) => handleInputChange('taxonomy_code', e.target.value)}
                  placeholder="Healthcare Provider Taxonomy Code"
                />
              </div>
            </div>
          </div>
        ) : null}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || isLoading}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffProfileEdit;
