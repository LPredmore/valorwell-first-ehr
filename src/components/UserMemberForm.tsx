
import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

const UserMemberForm = ({ isOpen, onClose, userId }: UserMemberFormProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      
      // Create a new user in auth with user metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'temppass1234',
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'user' // Updated to use 'user' role
          }
        }
      });
      
      if (authError) throw authError;
      
      // Update phone number in clients table
      if (authData?.user?.id) {
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            phone: formData.phone,
            minor: 'No', // Changed to string type
            status: 'Active' // Ensuring this is a string
          })
          .eq('id', authData.user.id);
          
        if (clientError) throw clientError;
      }
      
      toast.success("User created successfully");
      onClose();
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>{userId ? 'Edit User' : 'Add New User'}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <SheetFooter className="flex justify-between sm:justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateUser}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create User'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default UserMemberForm;
