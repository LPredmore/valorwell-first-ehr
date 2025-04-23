
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AddClinicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClinicianAdded: () => void;
}

const AddClinicianDialog: React.FC<AddClinicianDialogProps> = ({ 
  open, 
  onOpenChange, 
  onClinicianAdded 
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('clinicians')
        .insert([
          {
            clinician_first_name: firstName,
            clinician_last_name: lastName,
            clinician_professional_name: `${firstName} ${lastName}`,
            clinician_email: email,
            clinician_phone: phone || null,
            clinician_status: 'New'
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      toast.success('Clinician added successfully!');
      onClinicianAdded();
      onOpenChange(false);
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
    } catch (error) {
      console.error('Error adding clinician:', error);
      toast.error('Failed to add clinician. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Clinician</DialogTitle>
          <DialogDescription>
            Enter the clinician's details below. You can add more information later.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="clinician@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-valorwell-700 hover:bg-valorwell-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Clinician'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClinicianDialog;
