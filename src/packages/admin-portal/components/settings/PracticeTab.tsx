import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PracticeSettings } from '@/packages/admin-portal/types';

const PracticeTab = () => {
  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>({
    practiceName: '',
    npi: '',
    taxId: '',
    taxonomyCode: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPracticeSettings();
  }, []);

  const fetchPracticeSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('practiceinfo')
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setPracticeSettings({
          practiceName: data.practice_name || '',
          npi: data.practice_npi || '',
          taxId: data.practice_taxid || '',
          taxonomyCode: data.practice_taxonomy || '',
          address1: data.practice_address1 || '',
          address2: data.practice_address2 || '',
          city: data.practice_city || '',
          state: data.practice_state || '',
          zip: data.practice_zip || '',
        });
      }
    } catch (error) {
      console.error('Error fetching practice settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load practice settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPracticeSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const updatePracticeSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('practiceinfo')
        .upsert({
          practice_name: practiceSettings.practiceName,
          practice_npi: practiceSettings.npi,
          practice_taxid: practiceSettings.taxId,
          practice_taxonomy: practiceSettings.taxonomyCode,
          practice_address1: practiceSettings.address1,
          practice_address2: practiceSettings.address2,
          practice_city: practiceSettings.city,
          practice_state: practiceSettings.state,
          practice_zip: practiceSettings.zip,
        }, { onConflict: 'practice_npi' });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Practice settings updated successfully',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating practice settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update practice settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Practice Information</CardTitle>
          <CardDescription>
            Manage your practice details here.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="practiceName">Practice Name</Label>
              <Input
                type="text"
                id="practiceName"
                name="practiceName"
                value={practiceSettings.practiceName}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="npi">NPI</Label>
              <Input
                type="text"
                id="npi"
                name="npi"
                value={practiceSettings.npi}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                type="text"
                id="taxId"
                name="taxId"
                value={practiceSettings.taxId}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="taxonomyCode">Taxonomy Code</Label>
              <Input
                type="text"
                id="taxonomyCode"
                name="taxonomyCode"
                value={practiceSettings.taxonomyCode}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="address1">Address 1</Label>
              <Input
                type="text"
                id="address1"
                name="address1"
                value={practiceSettings.address1}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="address2">Address 2</Label>
              <Input
                type="text"
                id="address2"
                name="address2"
                value={practiceSettings.address2 || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={practiceSettings.city}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                type="text"
                id="state"
                name="state"
                value={practiceSettings.state}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                type="text"
                id="zip"
                name="zip"
                value={practiceSettings.zip}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="flex justify-end">
            {isEditing ? (
              <div className="space-x-2">
                <Button variant="ghost" onClick={() => {
                  fetchPracticeSettings();
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
                <Button
                  disabled={isLoading}
                  onClick={updatePracticeSettings}
                >
                  {isLoading ? 'Updating...' : 'Update Practice'}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Practice Info
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeTab;
