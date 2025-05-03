
// Import necessary dependencies and components
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define CPTCode type matching backend
interface CPTCode {
  id: number;
  code: string;
  name: string;
  description: string;
  fee: number;
  clinical_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const BillingTab: React.FC = () => {
  const { toast } = useToast();
  const [cptCodes, setCptCodes] = useState<CPTCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [newCode, setNewCode] = useState<Partial<CPTCode>>({
    code: '',
    name: '',
    fee: 0,
    description: '',
    clinical_type: ''
  });
  const [selectedCodeId, setSelectedCodeId] = useState<number | null>(null);
  
  useEffect(() => {
    fetchCptCodes();
  }, []);
  
  const fetchCptCodes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('cpt_codes').select('*');
      
      if (error) {
        throw error;
      }
      
      setCptCodes(data || []);
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error",
        description: "Failed to load CPT codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle fee as number
    if (name === 'fee') {
      setNewCode({
        ...newCode,
        [name]: parseFloat(value) || 0
      });
    } else {
      setNewCode({
        ...newCode,
        [name]: value
      });
    }
  };
  
  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const codeToAdd = {
        ...newCode,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as CPTCode;
      
      const { data, error } = await supabase.from('cpt_codes').insert(codeToAdd).select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setCptCodes([...cptCodes, data[0]]);
        setNewCode({
          code: '',
          name: '',
          fee: 0,
          description: '',
          clinical_type: ''
        });
        toast({
          title: "Success",
          description: "CPT code added successfully",
        });
      }
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error",
        description: "Failed to add CPT code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteCode = async (id: number) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.from('cpt_codes').delete().eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setCptCodes(cptCodes.filter(code => code.id !== id));
      toast({
        title: "Success",
        description: "CPT code deleted successfully",
      });
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error",
        description: "Failed to delete CPT code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CPT Codes & Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form onSubmit={handleAddCode} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">CPT Code</Label>
                <Input 
                  id="code" 
                  name="code"
                  value={newCode.code}
                  onChange={handleInputChange}
                  placeholder="e.g., 90791"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  name="name"
                  value={newCode.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Initial Assessment"
                  required
                />
              </div>
              <div>
                <Label htmlFor="fee">Fee ($)</Label>
                <Input 
                  id="fee" 
                  name="fee"
                  type="number"
                  value={newCode.fee}
                  onChange={handleInputChange}
                  placeholder="e.g., 150"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="clinical_type">Clinical Type</Label>
                <Input 
                  id="clinical_type" 
                  name="clinical_type"
                  value={newCode.clinical_type || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Assessment"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  value={newCode.description || ''}
                  onChange={handleInputChange}
                  placeholder="Enter description here"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add CPT Code
                </Button>
              </div>
            </form>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Existing CPT Codes</h3>
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : cptCodes.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No CPT codes added yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr>
                        <th className="border border-gray-200 px-4 py-2">Code</th>
                        <th className="border border-gray-200 px-4 py-2">Name</th>
                        <th className="border border-gray-200 px-4 py-2">Fee</th>
                        <th className="border border-gray-200 px-4 py-2">Type</th>
                        <th className="border border-gray-200 px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cptCodes.map((code) => (
                        <tr key={code.id}>
                          <td className="border border-gray-200 px-4 py-2">{code.code}</td>
                          <td className="border border-gray-200 px-4 py-2">{code.name}</td>
                          <td className="border border-gray-200 px-4 py-2">${code.fee.toFixed(2)}</td>
                          <td className="border border-gray-200 px-4 py-2">{code.clinical_type || '-'}</td>
                          <td className="border border-gray-200 px-4 py-2">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteCode(code.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;
