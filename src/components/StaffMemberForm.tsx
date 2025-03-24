
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
import { X } from 'lucide-react';

interface StaffMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio: string;
  professional_name: string;
  npi_number: string;
  taxonomy_code: string;
  license_number: string;
  license_state: string;
}

const StaffMemberForm = ({ isOpen, onClose }: StaffMemberFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const form = useForm<StaffFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      bio: '',
      professional_name: '',
      npi_number: '',
      taxonomy_code: '',
      license_number: '',
      license_state: ''
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
      
      // Add license information
      const { error: licenseError } = await supabase
        .from('licenses')
        .insert({
          clinician_id: authData.user.id,
          license_number: data.license_number,
          state: data.license_state
        });
        
      if (licenseError) throw licenseError;
      
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
      
      onClose();
      // Refresh the staff list
      window.location.reload();
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Add Staff Member</SheetTitle>
          <SheetDescription>
            Add a new clinician to your practice. They'll receive login credentials.
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Personal Information</h3>
              
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
              <h3 className="text-sm font-medium text-gray-700">License Information</h3>
              
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="license_number"
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
                
                <FormField
                  control={form.control}
                  name="license_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" {...field} />
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
                {saving ? "Saving..." : "Add Staff Member"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default StaffMemberForm;
