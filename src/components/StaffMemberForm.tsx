
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface StaffMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  staffId?: string | null;
}

const staffMemberFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  professional_name: z.string().optional(),
  npi_number: z.string().optional(),
  taxonomy_code: z.string().optional(),
  clinician_type: z.string().optional(),
  license_type: z.string().optional(),
});

const licenseFormSchema = z.object({
  licenseState: z.string().min(1, "State is required"),
  licenseNumber: z.string().min(1, "License number is required"),
});

type StaffFormData = z.infer<typeof staffMemberFormSchema>;
type LicenseFormData = z.infer<typeof licenseFormSchema>;

const StaffMemberForm = ({ isOpen, onClose, staffId }: StaffMemberFormProps) => {
  const { toast: legacyToast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [addingLicense, setAddingLicense] = useState(false);
  const [licenses, setLicenses] = useState<{ state: string; number: string }[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffMemberFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      bio: '',
      professional_name: '',
      npi_number: '',
      taxonomy_code: '',
      clinician_type: '',
      license_type: '',
    }
  });

  const licenseForm = useForm<LicenseFormData>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      licenseState: '',
      licenseNumber: '',
    }
  });

  // Fetch staff member data when editing
  useEffect(() => {
    if (isOpen && staffId) {
      setIsEditing(true);
      setCurrentUserId(staffId);
      fetchStaffMember(staffId);
    } else {
      setIsEditing(false);
      setCurrentUserId(null);
      staffForm.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        bio: '',
        professional_name: '',
        npi_number: '',
        taxonomy_code: '',
        clinician_type: '',
        license_type: '',
      });
      licenseForm.reset({
        licenseState: '',
        licenseNumber: '',
      });
      setLicenses([]);
    }
  }, [isOpen, staffId]);

  const fetchStaffMember = async (id: string) => {
    setIsLoading(true);
    try {
      // Fetch profile and clinician data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          clinicians(phone, clinician_type, license_type, bio, npi_number, taxonomy_code)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch licenses
      const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .select('state, license_number')
        .eq('clinician_id', id);

      if (licenseError) throw licenseError;

      // Set form values
      staffForm.reset({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email,
        phone: data.clinicians?.[0]?.phone || '',
        bio: data.clinicians?.[0]?.bio || '',
        professional_name: '', // Add this field to database if needed
        npi_number: data.clinicians?.[0]?.npi_number || '',
        taxonomy_code: data.clinicians?.[0]?.taxonomy_code || '',
        clinician_type: data.clinicians?.[0]?.clinician_type || '',
        license_type: data.clinicians?.[0]?.license_type || '',
      });

      // Set licenses
      if (licenseData) {
        setLicenses(licenseData.map(license => ({
          state: license.state,
          number: license.license_number
        })));
      }
    } catch (error) {
      console.error('Error fetching staff member:', error);
      toast.error('Failed to load staff member details');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: StaffFormData) => {
    setSaving(true);
    try {
      if (isEditing) {
        // Update existing staff member
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
          })
          .eq('id', currentUserId);
          
        if (profileError) throw profileError;
        
        const { error: clinicianError } = await supabase
          .from('clinicians')
          .update({
            bio: data.bio,
            phone: data.phone,
            clinician_type: data.clinician_type || null,
            license_type: data.license_type || null,
            npi_number: data.npi_number || null,
            taxonomy_code: data.taxonomy_code || null
          })
          .eq('id', currentUserId);
          
        if (clinicianError) throw clinicianError;
        
        toast.success('Staff member updated successfully');
        
        if (licenses.length > 0) {
          setActiveTab("license");
        } else {
          onClose();
        }
        
      } else {
        // Add new staff member
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: 'temppass1234',
          options: {
            data: {
              first_name: data.first_name,
              last_name: data.last_name,
              role: 'clinician'
            }
          }
        });
        
        if (authError) throw authError;
        
        const { error: updateError } = await supabase
          .from('clinicians')
          .update({
            bio: data.bio,
            phone: data.phone,
            clinician_type: data.clinician_type || null,
            license_type: data.license_type || null,
            npi_number: data.npi_number || null,
            taxonomy_code: data.taxonomy_code || null
          })
          .eq('id', authData.user.id);
          
        if (updateError) throw updateError;
        
        setCurrentUserId(authData.user.id);
        
        toast.success('Staff member added successfully. You can now add licenses.');
        
        setActiveTab("license");
      }
    } catch (error: any) {
      console.error('Error managing staff member:', error);
      toast.error(error.message || "Failed to save staff member");
    } finally {
      setSaving(false);
    }
  };

  const addLicense = async (data: LicenseFormData) => {
    if (!currentUserId) {
      toast.error('Please create or select a staff member first');
      return;
    }

    setAddingLicense(true);
    try {
      const { error } = await supabase
        .from('licenses')
        .insert({
          clinician_id: currentUserId,
          license_number: data.licenseNumber,
          state: data.licenseState
        });
        
      if (error) throw error;
      
      setLicenses([...licenses, { state: data.licenseState, number: data.licenseNumber }]);
      
      licenseForm.reset({
        licenseState: '',
        licenseNumber: '',
      });
      
      toast.success('License added successfully');
      
    } catch (error: any) {
      console.error('Error adding license:', error);
      toast.error(error.message || "Failed to add license");
    } finally {
      setAddingLicense(false);
    }
  };

  const completeStaffMemberCreation = () => {
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? 'Edit Staff Member' : 'Add Staff Member'}</SheetTitle>
          <SheetDescription>
            {isEditing 
              ? 'Edit this clinician\'s details.' 
              : 'Add a new clinician to your practice. They\'ll receive login credentials.'}
          </SheetDescription>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading staff details...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="license" disabled={!currentUserId}>License Information</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal">
              <Form {...staffForm}>
                <form onSubmit={staffForm.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={staffForm.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={staffForm.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={staffForm.control}
                      name="professional_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. John Doe" {...field} />
                          </FormControl>
                          <FormDescription>Name that will appear to clients</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={staffForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="john.doe@example.com" 
                                {...field} 
                                disabled={isEditing}
                                className={isEditing ? "bg-gray-100" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={staffForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={staffForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biography</FormLabel>
                          <FormControl>
                            <textarea 
                              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Professional biography and experience" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={staffForm.control}
                        name="clinician_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinician Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Mental Health">Mental Health</SelectItem>
                                <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={staffForm.control}
                        name="license_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select license type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="LCP">LCP</SelectItem>
                                <SelectItem value="LMHT">LMHT</SelectItem>
                                <SelectItem value="LMFT">LMFT</SelectItem>
                                <SelectItem value="LCSW">LCSW</SelectItem>
                                <SelectItem value="Psychologist">Psychologist</SelectItem>
                                <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Professional Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={staffForm.control}
                        name="npi_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NPI Number</FormLabel>
                            <FormControl>
                              <Input placeholder="1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={staffForm.control}
                        name="taxonomy_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxonomy Code</FormLabel>
                            <FormControl>
                              <Input placeholder="207R00000X" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <SheetFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onClose}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : isEditing ? "Update Profile" : "Create Staff Profile"}
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="license">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">License Information</h3>
                  
                  {licenses.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Added Licenses:</h4>
                      <ul className="space-y-2">
                        {licenses.map((license, index) => (
                          <li key={index} className="p-2 bg-gray-50 rounded border">
                            <span className="font-medium">{license.state}:</span> {license.number}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Form {...licenseForm}>
                    <form onSubmit={licenseForm.handleSubmit(addLicense)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={licenseForm.control}
                          name="licenseState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License State</FormLabel>
                              <FormControl>
                                <Input placeholder="CA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={licenseForm.control}
                          name="licenseNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License Number</FormLabel>
                              <FormControl>
                                <Input placeholder="ABC12345" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit"
                        disabled={addingLicense}
                        className="w-full"
                      >
                        {addingLicense ? "Adding..." : "Add License"}
                      </Button>
                    </form>
                  </Form>
                </div>
                
                <SheetFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={completeStaffMemberCreation}
                  >
                    Complete
                  </Button>
                </SheetFooter>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default StaffMemberForm;
