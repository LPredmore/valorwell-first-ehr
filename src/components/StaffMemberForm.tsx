
import React, { useState } from 'react';
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
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StaffMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
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
});

type StaffFormData = z.infer<typeof staffMemberFormSchema>;

const StaffMemberForm = ({ isOpen, onClose }: StaffMemberFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [licenseState, setLicenseState] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [addingLicense, setAddingLicense] = useState(false);
  const [licenses, setLicenses] = useState<{ state: string; number: string }[]>([]);

  const form = useForm<StaffFormData>({
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
    }
  });

  const onSubmit = async (data: StaffFormData) => {
    setSaving(true);
    try {
      // Create a new user in auth with user metadata
      // This will trigger the database function to create profiles and clinicians records
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
      
      // The profile and clinician records are created automatically by the database trigger
      // Now update the clinician record with additional fields
      const { error: updateError } = await supabase
        .from('clinicians')
        .update({
          bio: data.bio,
          phone: data.phone
        })
        .eq('id', authData.user.id);
        
      if (updateError) throw updateError;
      
      setCurrentUserId(authData.user.id);
      
      toast({
        title: "Success",
        description: "Staff member added successfully. You can now add licenses.",
      });
      
      // Switch to the license tab
      setActiveTab("license");
    } catch (error: any) {
      console.error('Error adding staff member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addLicense = async () => {
    if (!licenseState || !licenseNumber || !currentUserId) {
      toast({
        title: "Error",
        description: "Please fill in all license fields and ensure a staff member is selected",
        variant: "destructive"
      });
      return;
    }

    setAddingLicense(true);
    try {
      const { error } = await supabase
        .from('licenses')
        .insert({
          clinician_id: currentUserId,
          license_number: licenseNumber,
          state: licenseState
        });
        
      if (error) throw error;
      
      // Add to local state for display
      setLicenses([...licenses, { state: licenseState, number: licenseNumber }]);
      
      // Clear the form fields
      setLicenseState("");
      setLicenseNumber("");
      
      toast({
        title: "Success",
        description: "License added successfully",
      });
      
    } catch (error: any) {
      console.error('Error adding license:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add license",
        variant: "destructive"
      });
    } finally {
      setAddingLicense(false);
    }
  };

  const completeStaffMemberCreation = () => {
    onClose();
    // Refresh the staff list
    window.location.reload();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Add Staff Member</SheetTitle>
          <SheetDescription>
            Add a new clinician to your practice. They'll receive login credentials.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="license" disabled={!currentUserId}>License Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
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
                    control={form.control}
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
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Professional Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                    {saving ? "Saving..." : "Create Staff Profile"}
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
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>License State</FormLabel>
                      <Input 
                        placeholder="CA" 
                        value={licenseState}
                        onChange={(e) => setLicenseState(e.target.value)}
                      />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <Input 
                        placeholder="ABC12345" 
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </FormItem>
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={addLicense}
                    disabled={addingLicense || !licenseState || !licenseNumber}
                    className="w-full"
                  >
                    {addingLicense ? "Adding..." : "Add License"}
                  </Button>
                </div>
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
      </SheetContent>
    </Sheet>
  );
};

export default StaffMemberForm;
