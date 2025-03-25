
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type StaffProfileEditProps = {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
};

type StaffProfile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  clinician_type: string | null;
  license_type: string | null;
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
      
      // First get the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role')
        .eq('id', id)
        .single();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        throw profileError;
      }
      
      console.log('Profile data fetched:', profileData);

      // Then get the clinician data
      const { data: clinicianData, error: clinicianError } = await supabase
        .from('clinicians')
        .select('phone, clinician_type, license_type')
        .eq('id', id)
        .maybeSingle();

      if (clinicianError && clinicianError.code !== 'PGRST116') {
        console.error('Error fetching clinician data:', clinicianError);
        // We don't throw here as the clinician record might not exist yet
      }
      
      console.log('Clinician data fetched:', clinicianData);

      setProfile({
        id: profileData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role,
        phone: clinicianData?.phone || null,
        clinician_type: clinicianData?.clinician_type || null,
        license_type: clinicianData?.license_type || null
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
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Check if clinician record exists
      const { data: clinicianExists } = await supabase
        .from('clinicians')
        .select('id')
        .eq('id', profile.id)
        .maybeSingle();

      if (clinicianExists) {
        // Update existing clinician record
        const { error: clinicianError } = await supabase
          .from('clinicians')
          .update({
            phone: profile.phone,
            clinician_type: profile.clinician_type,
            license_type: profile.license_type
          })
          .eq('id', profile.id);

        if (clinicianError) throw clinicianError;
      } else {
        // Insert new clinician record if it doesn't exist
        const { error: insertError } = await supabase
          .from('clinicians')
          .insert({
            id: profile.id,
            phone: profile.phone,
            clinician_type: profile.clinician_type,
            license_type: profile.license_type
          });

        if (insertError) throw insertError;
      }

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
      <DialogContent className="sm:max-w-[500px]">
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
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={profile.email} 
                disabled 
                className="bg-gray-100"
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
              <Label htmlFor="clinician_type">Type</Label>
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
