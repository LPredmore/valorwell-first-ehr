
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Define PracticeInfo type matching backend
interface PracticeInfo {
  id: string;
  practice_name: string;
  practice_address1: string;
  practice_address2: string;
  practice_city: string;
  practice_state: string;
  practice_zip: string;
  practice_npi: string;
  practice_taxid: string;
  practice_taxonomy: string;
  created_at: string;
  updated_at: string;
}

const PracticeTab: React.FC = () => {
  const { toast } = useToast();
  const [practiceInfo, setPracticeInfo] = useState<PracticeInfo>({
    id: '',
    practice_name: '',
    practice_address1: '',
    practice_address2: '',
    practice_city: '',
    practice_state: '',
    practice_zip: '',
    practice_npi: '',
    practice_taxid: '',
    practice_taxonomy: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetchPracticeInfo();
  }, []);
  
  const fetchPracticeInfo = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('practiceinfo').select('*').limit(1).single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 means no rows returned
          throw error;
        }
        // No practice info yet, that's ok
      }
      
      if (data) {
        setPracticeInfo(data);
      }
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error",
        description: "Failed to load practice information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPracticeInfo({
      ...practiceInfo,
      [name]: value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      const updatedInfo = {
        ...practiceInfo,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (practiceInfo.id) {
        // Update existing record
        result = await supabase
          .from('practiceinfo')
          .update(updatedInfo)
          .eq('id', practiceInfo.id)
          .select();
      } else {
        // Insert new record
        result = await supabase
          .from('practiceinfo')
          .insert(updatedInfo)
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data && result.data.length > 0) {
        setPracticeInfo(result.data[0]);
      }
      
      toast({
        title: "Success",
        description: "Practice information saved successfully",
      });
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error",
        description: "Failed to save practice information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Practice Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading practice information...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="practice_name">Practice Name</Label>
                  <Input 
                    id="practice_name" 
                    name="practice_name"
                    value={practiceInfo.practice_name}
                    onChange={handleInputChange}
                    placeholder="Enter practice name"
                  />
                </div>
                <div>
                  <Label htmlFor="practice_npi">NPI Number</Label>
                  <Input 
                    id="practice_npi" 
                    name="practice_npi"
                    value={practiceInfo.practice_npi}
                    onChange={handleInputChange}
                    placeholder="National Provider Identifier"
                  />
                </div>
                <div>
                  <Label htmlFor="practice_taxid">Tax ID</Label>
                  <Input 
                    id="practice_taxid" 
                    name="practice_taxid"
                    value={practiceInfo.practice_taxid}
                    onChange={handleInputChange}
                    placeholder="Tax ID Number"
                  />
                </div>
                <div>
                  <Label htmlFor="practice_taxonomy">Taxonomy Code</Label>
                  <Input 
                    id="practice_taxonomy" 
                    name="practice_taxonomy"
                    value={practiceInfo.practice_taxonomy}
                    onChange={handleInputChange}
                    placeholder="Taxonomy Code"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-3">Practice Address</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="practice_address1">Address Line 1</Label>
                    <Input 
                      id="practice_address1" 
                      name="practice_address1"
                      value={practiceInfo.practice_address1}
                      onChange={handleInputChange}
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="practice_address2">Address Line 2</Label>
                    <Input 
                      id="practice_address2" 
                      name="practice_address2"
                      value={practiceInfo.practice_address2}
                      onChange={handleInputChange}
                      placeholder="Apt, Suite, etc. (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="practice_city">City</Label>
                      <Input 
                        id="practice_city" 
                        name="practice_city"
                        value={practiceInfo.practice_city}
                        onChange={handleInputChange}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="practice_state">State</Label>
                      <Input 
                        id="practice_state" 
                        name="practice_state"
                        value={practiceInfo.practice_state}
                        onChange={handleInputChange}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="practice_zip">ZIP Code</Label>
                      <Input 
                        id="practice_zip" 
                        name="practice_zip"
                        value={practiceInfo.practice_zip}
                        onChange={handleInputChange}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Practice Information'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeTab;
