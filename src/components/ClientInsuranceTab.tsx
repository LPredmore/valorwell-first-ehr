
import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface InsuranceTabProps {
  clientId: string;
  initialData?: any;
  onSave?: () => void;
  disabled?: boolean;
}

const ClientInsuranceTab = ({ clientId, initialData, onSave, disabled = false }: InsuranceTabProps) => {
  const [insuranceData, setInsuranceData] = useState({
    // Primary Insurance
    client_insurance_company_primary: '',
    client_policy_number_primary: '',
    client_group_number_primary: '',
    client_subscriber_name_primary: '',
    client_subscriber_relationship_primary: '',
    client_insurance_type_primary: '',
    client_subscriber_dob_primary: '',
    
    // Secondary Insurance
    client_insurance_company_secondary: '',
    client_policy_number_secondary: '',
    client_group_number_secondary: '',
    client_subscriber_name_secondary: '',
    client_subscriber_relationship_secondary: '',
    client_insurance_type_secondary: '',
    client_subscriber_dob_secondary: '',
    
    // Tertiary Insurance
    client_insurance_company_tertiary: '',
    client_policy_number_tertiary: '',
    client_group_number_tertiary: '',
    client_subscriber_name_tertiary: '',
    client_subscriber_relationship_tertiary: '',
    client_insurance_type_tertiary: '',
    client_subscriber_dob_tertiary: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (initialData) {
      setInsuranceData({
        // Primary Insurance
        client_insurance_company_primary: initialData.client_insurance_company_primary || '',
        client_policy_number_primary: initialData.client_policy_number_primary || '',
        client_group_number_primary: initialData.client_group_number_primary || '',
        client_subscriber_name_primary: initialData.client_subscriber_name_primary || '',
        client_subscriber_relationship_primary: initialData.client_subscriber_relationship_primary || '',
        client_insurance_type_primary: initialData.client_insurance_type_primary || '',
        client_subscriber_dob_primary: initialData.client_subscriber_dob_primary || '',
        
        // Secondary Insurance
        client_insurance_company_secondary: initialData.client_insurance_company_secondary || '',
        client_policy_number_secondary: initialData.client_policy_number_secondary || '',
        client_group_number_secondary: initialData.client_group_number_secondary || '',
        client_subscriber_name_secondary: initialData.client_subscriber_name_secondary || '',
        client_subscriber_relationship_secondary: initialData.client_subscriber_relationship_secondary || '',
        client_insurance_type_secondary: initialData.client_insurance_type_secondary || '',
        client_subscriber_dob_secondary: initialData.client_subscriber_dob_secondary || '',
        
        // Tertiary Insurance
        client_insurance_company_tertiary: initialData.client_insurance_company_tertiary || '',
        client_policy_number_tertiary: initialData.client_policy_number_tertiary || '',
        client_group_number_tertiary: initialData.client_group_number_tertiary || '',
        client_subscriber_name_tertiary: initialData.client_subscriber_name_tertiary || '',
        client_subscriber_relationship_tertiary: initialData.client_subscriber_relationship_tertiary || '',
        client_insurance_type_tertiary: initialData.client_insurance_type_tertiary || '',
        client_subscriber_dob_tertiary: initialData.client_subscriber_dob_tertiary || ''
      });
      setLoading(false);
    } else if (clientId && clientId !== 'new') {
      fetchInsuranceData();
    } else {
      setLoading(false);
    }
  }, [clientId, initialData]);

  const fetchInsuranceData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          client_insurance_company_primary,
          client_policy_number_primary,
          client_group_number_primary,
          client_subscriber_name_primary,
          client_subscriber_relationship_primary,
          client_insurance_type_primary,
          client_subscriber_dob_primary,
          client_insurance_company_secondary,
          client_policy_number_secondary,
          client_group_number_secondary,
          client_subscriber_name_secondary,
          client_subscriber_relationship_secondary,
          client_insurance_type_secondary,
          client_subscriber_dob_secondary,
          client_insurance_company_tertiary,
          client_policy_number_tertiary,
          client_group_number_tertiary,
          client_subscriber_name_tertiary,
          client_subscriber_relationship_tertiary,
          client_insurance_type_tertiary,
          client_subscriber_dob_tertiary
        `)
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setInsuranceData({
          // Primary Insurance
          client_insurance_company_primary: data.client_insurance_company_primary || '',
          client_policy_number_primary: data.client_policy_number_primary || '',
          client_group_number_primary: data.client_group_number_primary || '',
          client_subscriber_name_primary: data.client_subscriber_name_primary || '',
          client_subscriber_relationship_primary: data.client_subscriber_relationship_primary || '',
          client_insurance_type_primary: data.client_insurance_type_primary || '',
          client_subscriber_dob_primary: data.client_subscriber_dob_primary || '',
          
          // Secondary Insurance
          client_insurance_company_secondary: data.client_insurance_company_secondary || '',
          client_policy_number_secondary: data.client_policy_number_secondary || '',
          client_group_number_secondary: data.client_group_number_secondary || '',
          client_subscriber_name_secondary: data.client_subscriber_name_secondary || '',
          client_subscriber_relationship_secondary: data.client_subscriber_relationship_secondary || '',
          client_insurance_type_secondary: data.client_insurance_type_secondary || '',
          client_subscriber_dob_secondary: data.client_subscriber_dob_secondary || '',
          
          // Tertiary Insurance
          client_insurance_company_tertiary: data.client_insurance_company_tertiary || '',
          client_policy_number_tertiary: data.client_policy_number_tertiary || '',
          client_group_number_tertiary: data.client_group_number_tertiary || '',
          client_subscriber_name_tertiary: data.client_subscriber_name_tertiary || '',
          client_subscriber_relationship_tertiary: data.client_subscriber_relationship_tertiary || '',
          client_insurance_type_tertiary: data.client_insurance_type_tertiary || '',
          client_subscriber_dob_tertiary: data.client_subscriber_dob_tertiary || ''
        });
      }
    } catch (error) {
      console.error('Error fetching insurance data:', error);
      toast.error('Failed to load insurance data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInsuranceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (disabled) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          // Primary Insurance
          client_insurance_company_primary: insuranceData.client_insurance_company_primary,
          client_policy_number_primary: insuranceData.client_policy_number_primary,
          client_group_number_primary: insuranceData.client_group_number_primary,
          client_subscriber_name_primary: insuranceData.client_subscriber_name_primary,
          client_subscriber_relationship_primary: insuranceData.client_subscriber_relationship_primary,
          client_insurance_type_primary: insuranceData.client_insurance_type_primary,
          client_subscriber_dob_primary: insuranceData.client_subscriber_dob_primary,
          
          // Secondary Insurance
          client_insurance_company_secondary: insuranceData.client_insurance_company_secondary,
          client_policy_number_secondary: insuranceData.client_policy_number_secondary,
          client_group_number_secondary: insuranceData.client_group_number_secondary,
          client_subscriber_name_secondary: insuranceData.client_subscriber_name_secondary,
          client_subscriber_relationship_secondary: insuranceData.client_subscriber_relationship_secondary,
          client_insurance_type_secondary: insuranceData.client_insurance_type_secondary,
          client_subscriber_dob_secondary: insuranceData.client_subscriber_dob_secondary,
          
          // Tertiary Insurance
          client_insurance_company_tertiary: insuranceData.client_insurance_company_tertiary,
          client_policy_number_tertiary: insuranceData.client_policy_number_tertiary,
          client_group_number_tertiary: insuranceData.client_group_number_tertiary,
          client_subscriber_name_tertiary: insuranceData.client_subscriber_name_tertiary,
          client_subscriber_relationship_tertiary: insuranceData.client_subscriber_relationship_tertiary,
          client_insurance_type_tertiary: insuranceData.client_insurance_type_tertiary,
          client_subscriber_dob_tertiary: insuranceData.client_subscriber_dob_tertiary
        })
        .eq('id', clientId);
        
      if (error) throw error;
      
      toast.success('Insurance information saved successfully');
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving insurance data:', error);
      toast.error('Failed to save insurance data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading insurance information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Primary Insurance */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Activity className="mr-2 h-5 w-5" />
          <h2 className="font-semibold text-lg">Primary Insurance</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Insurance Company</label>
            <Input 
              name="client_insurance_company_primary"
              value={insuranceData.client_insurance_company_primary}
              onChange={handleChange}
              placeholder="Insurance Company"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Number</label>
            <Input 
              name="client_policy_number_primary"
              value={insuranceData.client_policy_number_primary}
              onChange={handleChange}
              placeholder="Policy Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Group Number</label>
            <Input 
              name="client_group_number_primary"
              value={insuranceData.client_group_number_primary}
              onChange={handleChange}
              placeholder="Group Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Subscriber Name</label>
            <Input 
              name="client_subscriber_name_primary"
              value={insuranceData.client_subscriber_name_primary}
              onChange={handleChange}
              placeholder="Subscriber Name"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Relationship to Subscriber</label>
            <select
              name="client_subscriber_relationship_primary"
              value={insuranceData.client_subscriber_relationship_primary}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            >
              <option value="">Select Relationship</option>
              <option value="Self">Self</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Subscriber Date of Birth</label>
            <Input 
              name="client_subscriber_dob_primary"
              type="date"
              value={insuranceData.client_subscriber_dob_primary}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Type</label>
            <Input 
              name="client_insurance_type_primary"
              value={insuranceData.client_insurance_type_primary}
              onChange={handleChange}
              placeholder="Plan Type"
              disabled={disabled}
            />
          </div>
        </div>
      </Card>
      
      {/* Secondary Insurance */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Activity className="mr-2 h-5 w-5" />
          <h2 className="font-semibold text-lg">Secondary Insurance</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Insurance Company</label>
            <Input 
              name="client_insurance_company_secondary"
              value={insuranceData.client_insurance_company_secondary}
              onChange={handleChange}
              placeholder="Insurance Company"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Number</label>
            <Input 
              name="client_policy_number_secondary"
              value={insuranceData.client_policy_number_secondary}
              onChange={handleChange}
              placeholder="Policy Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Group Number</label>
            <Input 
              name="client_group_number_secondary"
              value={insuranceData.client_group_number_secondary}
              onChange={handleChange}
              placeholder="Group Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Subscriber Name</label>
            <Input 
              name="client_subscriber_name_secondary"
              value={insuranceData.client_subscriber_name_secondary}
              onChange={handleChange}
              placeholder="Subscriber Name"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Relationship to Subscriber</label>
            <select
              name="client_subscriber_relationship_secondary"
              value={insuranceData.client_subscriber_relationship_secondary}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            >
              <option value="">Select Relationship</option>
              <option value="Self">Self</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Subscriber Date of Birth</label>
            <Input 
              name="client_subscriber_dob_secondary"
              type="date"
              value={insuranceData.client_subscriber_dob_secondary}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Type</label>
            <Input 
              name="client_insurance_type_secondary"
              value={insuranceData.client_insurance_type_secondary}
              onChange={handleChange}
              placeholder="Plan Type"
              disabled={disabled}
            />
          </div>
        </div>
      </Card>
      
      {/* Tertiary Insurance */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Activity className="mr-2 h-5 w-5" />
          <h2 className="font-semibold text-lg">Tertiary Insurance</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Insurance Company</label>
            <Input 
              name="client_insurance_company_tertiary"
              value={insuranceData.client_insurance_company_tertiary}
              onChange={handleChange}
              placeholder="Insurance Company"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Number</label>
            <Input 
              name="client_policy_number_tertiary"
              value={insuranceData.client_policy_number_tertiary}
              onChange={handleChange}
              placeholder="Policy Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Group Number</label>
            <Input 
              name="client_group_number_tertiary"
              value={insuranceData.client_group_number_tertiary}
              onChange={handleChange}
              placeholder="Group Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Subscriber Name</label>
            <Input 
              name="client_subscriber_name_tertiary"
              value={insuranceData.client_subscriber_name_tertiary}
              onChange={handleChange}
              placeholder="Subscriber Name"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Relationship to Subscriber</label>
            <select
              name="client_subscriber_relationship_tertiary"
              value={insuranceData.client_subscriber_relationship_tertiary}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            >
              <option value="">Select Relationship</option>
              <option value="Self">Self</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Subscriber Date of Birth</label>
            <Input 
              name="client_subscriber_dob_tertiary"
              type="date"
              value={insuranceData.client_subscriber_dob_tertiary}
              onChange={handleChange}
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Type</label>
            <Input 
              name="client_insurance_type_tertiary"
              value={insuranceData.client_insurance_type_tertiary}
              onChange={handleChange}
              placeholder="Plan Type"
              disabled={disabled}
            />
          </div>
        </div>
      </Card>
      
      {!disabled && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-valorwell-700 hover:bg-valorwell-800"
          >
            {saving ? 'Saving...' : 'Save Insurance Information'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientInsuranceTab;
