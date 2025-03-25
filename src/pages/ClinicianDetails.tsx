
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, Plus, Trash } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Clinician {
  id: string;
  clinician_first_name: string | null;
  clinician_last_name: string | null;
  clinician_email: string | null;
  clinician_phone: string | null;
  clinician_bio: string | null;
  clinician_professional_name: string | null;
  clinician_npi_number: string | null;
  clinician_taxonomy_code: string | null;
  clinician_license_type: string | null;
  clinician_status: string | null;
  clinician_type: string | null;
}

interface License {
  id: string;
  clinician_id: string;
  license_number: string;
  state: string;
  created_at: string;
}

const ClinicianDetails = () => {
  const { clinicianId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clinician, setClinician] = useState<Clinician | null>(null);
  const [editedClinician, setEditedClinician] = useState<Clinician | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [newLicense, setNewLicense] = useState({
    license_type: '',
    state: '',
    license_number: ''
  });

  // Time zone options
  const timeZones = [
    "Eastern Time (ET)",
    "Central Time (CT)",
    "Mountain Time (MT)",
    "Pacific Time (PT)",
    "Alaska Time (AKT)",
    "Hawaii-Aleutian Time (HAT)"
  ];

  // Role options
  const roleOptions = [
    "Admin",
    "Clinician",
    "Staff",
    "Supervisor"
  ];

  // License types
  const licenseTypes = [
    "LPC", 
    "LCSW", 
    "LMFT", 
    "PhD", 
    "PsyD", 
    "MD", 
    "NP"
  ];

  // States
  const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  useEffect(() => {
    if (clinicianId) {
      fetchClinicianData();
      fetchLicenses();
    }
  }, [clinicianId]);

  const fetchClinicianData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinicians')
        .select('*')
        .eq('id', clinicianId)
        .single();
      
      if (error) {
        throw error;
      }
      
      setClinician(data);
      setEditedClinician(data);
    } catch (error) {
      console.error('Error fetching clinician:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clinician details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch license information.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof Clinician, value: string) => {
    if (editedClinician) {
      setEditedClinician({
        ...editedClinician,
        [field]: value
      });
    }
  };

  const handleNewLicenseChange = (field: string, value: string) => {
    setNewLicense({
      ...newLicense,
      [field]: value
    });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('clinicians')
        .update(editedClinician as any)
        .eq('id', clinicianId);
      
      if (error) {
        throw error;
      }
      
      setClinician(editedClinician);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Clinician details updated successfully.",
      });
    } catch (error) {
      console.error('Error updating clinician:', error);
      toast({
        title: "Error",
        description: "Failed to update clinician details.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditedClinician(clinician);
    setIsEditing(false);
  };

  const handleAddLicense = async () => {
    if (!newLicense.license_type || !newLicense.state || !newLicense.license_number) {
      toast({
        title: "Error",
        description: "Please fill out all license fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('licenses')
        .insert({
          clinician_id: clinicianId,
          license_number: newLicense.license_number,
          state: newLicense.state
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      setLicenses([...licenses, data[0]]);
      setNewLicense({
        license_type: '',
        state: '',
        license_number: ''
      });
      
      toast({
        title: "Success",
        description: "License added successfully.",
      });
    } catch (error) {
      console.error('Error adding license:', error);
      toast({
        title: "Error",
        description: "Failed to add license.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLicense = async (licenseId: string) => {
    try {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', licenseId);
      
      if (error) {
        throw error;
      }
      
      setLicenses(licenses.filter(license => license.id !== licenseId));
      
      toast({
        title: "Success",
        description: "License deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting license:', error);
      toast({
        title: "Error",
        description: "Failed to delete license.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p>Loading clinician details...</p>
        </div>
      </Layout>
    );
  }

  if (!clinician) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p>Clinician not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {clinician.clinician_first_name} {clinician.clinician_last_name}
          </h1>
          <p className="text-gray-500">{clinician.clinician_email}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-1">
                <X size={16} /> Cancel
              </Button>
              <Button onClick={handleSave} className="flex items-center gap-1 bg-valorwell-700 hover:bg-valorwell-800">
                <Save size={16} /> Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-1">
              <Pencil size={16} /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <Input 
                    type="text" 
                    value={editedClinician?.clinician_first_name || ''} 
                    onChange={(e) => handleInputChange('clinician_first_name', e.target.value)}
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {clinician.clinician_first_name || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <Input 
                    type="text" 
                    value={editedClinician?.clinician_last_name || ''} 
                    onChange={(e) => handleInputChange('clinician_last_name', e.target.value)}
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {clinician.clinician_last_name || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name for Insurance
                </label>
                {isEditing ? (
                  <Input 
                    type="text" 
                    value={`${editedClinician?.clinician_first_name || ''} ${editedClinician?.clinician_last_name || ''}`} 
                    readOnly
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {clinician.clinician_first_name && clinician.clinician_last_name 
                      ? `${clinician.clinician_first_name} ${clinician.clinician_last_name}` 
                      : '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Name
                </label>
                {isEditing ? (
                  <Input 
                    type="text" 
                    value={editedClinician?.clinician_professional_name || ''} 
                    onChange={(e) => handleInputChange('clinician_professional_name', e.target.value)}
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {clinician.clinician_professional_name || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <Input 
                    type="email" 
                    value={editedClinician?.clinician_email || ''} 
                    onChange={(e) => handleInputChange('clinician_email', e.target.value)}
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {clinician.clinician_email || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Zone
                </label>
                {isEditing ? (
                  <Select 
                    value="Central Time (CT)" 
                    onValueChange={(value) => {}}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeZones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    Central Time (CT)
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biography
                </label>
                {isEditing ? (
                  <Textarea 
                    value={editedClinician?.clinician_bio || ''} 
                    onChange={(e) => handleInputChange('clinician_bio', e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50 min-h-[100px] whitespace-pre-wrap">
                    {clinician.clinician_bio || '—'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>License Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NPI Number
                </label>
                {isEditing ? (
                  <Input 
                    type="text" 
                    value={editedClinician?.clinician_npi_number || ''} 
                    onChange={(e) => handleInputChange('clinician_npi_number', e.target.value)}
                    placeholder="NPI number"
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {clinician.clinician_npi_number || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxonomy Code
                </label>
                {isEditing ? (
                  <Input 
                    type="text" 
                    value={editedClinician?.clinician_taxonomy_code || ''} 
                    onChange={(e) => handleInputChange('clinician_taxonomy_code', e.target.value)}
                    placeholder="Taxonomy code"
                  />
                ) : (
                  <p className="p-2 border rounded-md bg-gray-50">
                    {clinician.clinician_taxonomy_code || '—'}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">State Licenses</h3>
              {licenses.length === 0 ? (
                <p className="text-sm text-gray-500 italic mb-4">No licenses added yet.</p>
              ) : (
                <div className="border rounded-md overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left">License Type</th>
                        <th className="py-2 px-4 text-left">State</th>
                        <th className="py-2 px-4 text-left">License Number</th>
                        {isEditing && <th className="py-2 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {licenses.map((license) => (
                        <tr key={license.id} className="border-t">
                          <td className="py-2 px-4">{license.id.substring(0, 4)}</td>
                          <td className="py-2 px-4">{license.state}</td>
                          <td className="py-2 px-4">{license.license_number}</td>
                          {isEditing && (
                            <td className="py-2 px-4 text-right">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteLicense(license.id)}
                              >
                                <Trash size={14} />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isEditing && (
                <div className="border rounded-md p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Add License</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        License Type
                      </label>
                      <Select 
                        value={newLicense.license_type}
                        onValueChange={(value) => handleNewLicenseChange('license_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {licenseTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        State
                      </label>
                      <Select 
                        value={newLicense.state}
                        onValueChange={(value) => handleNewLicenseChange('state', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-700 mb-1">
                          License Number
                        </label>
                        <Input 
                          type="text" 
                          placeholder="License number" 
                          value={newLicense.license_number}
                          onChange={(e) => handleNewLicenseChange('license_number', e.target.value)}
                        />
                      </div>
                      <Button 
                        size="icon"
                        onClick={handleAddLicense}
                        className="mb-[2px]"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Role
              </label>
              {isEditing ? (
                <Select 
                  value={editedClinician?.clinician_type || 'Admin'}
                  onValueChange={(value) => handleInputChange('clinician_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="p-2 border rounded-md bg-gray-50">
                  {clinician.clinician_type || 'Admin'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-valorwell-700 hover:bg-valorwell-800">
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClinicianDetails;
