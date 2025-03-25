
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
    insurance_name_primary: '',
    policy_number_primary: '',
    group_number_primary: '',
    subscriber_name_primary: '',
    subscriber_relationship_primary: '',
    insurance_type_primary: '',
    
    // Secondary Insurance
    insurance_name_secondary: '',
    policy_number_secondary: '',
    group_number_secondary: '',
    subscriber_name_secondary: '',
    subscriber_relationship_secondary: '',
    insurance_type_secondary: '',
    
    // Tertiary Insurance
    insurance_name_tertiary: '',
    policy_number_tertiary: '',
    group_number_tertiary: '',
    subscriber_name_tertiary: '',
    subscriber_relationship_tertiary: '',
    insurance_type_tertiary: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (initialData) {
      setInsuranceData({
        // Primary Insurance
        insurance_name_primary: initialData.insurance_name_primary || '',
        policy_number_primary: initialData.policy_number_primary || '',
        group_number_primary: initialData.group_number_primary || '',
        subscriber_name_primary: initialData.subscriber_name_primary || '',
        subscriber_relationship_primary: initialData.subscriber_relationship_primary || '',
        insurance_type_primary: initialData.insurance_type_primary || '',
        
        // Secondary Insurance
        insurance_name_secondary: initialData.insurance_name_secondary || '',
        policy_number_secondary: initialData.policy_number_secondary || '',
        group_number_secondary: initialData.group_number_secondary || '',
        subscriber_name_secondary: initialData.subscriber_name_secondary || '',
        subscriber_relationship_secondary: initialData.subscriber_relationship_secondary || '',
        insurance_type_secondary: initialData.insurance_type_secondary || '',
        
        // Tertiary Insurance
        insurance_name_tertiary: initialData.insurance_name_tertiary || '',
        policy_number_tertiary: initialData.policy_number_tertiary || '',
        group_number_tertiary: initialData.group_number_tertiary || '',
        subscriber_name_tertiary: initialData.subscriber_name_tertiary || '',
        subscriber_relationship_tertiary: initialData.subscriber_relationship_tertiary || '',
        insurance_type_tertiary: initialData.insurance_type_tertiary || ''
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
          insurance_name_primary,
          policy_number_primary,
          group_number_primary,
          subscriber_name_primary,
          subscriber_relationship_primary,
          insurance_type_primary,
          insurance_name_secondary,
          policy_number_secondary,
          group_number_secondary,
          subscriber_name_secondary,
          subscriber_relationship_secondary,
          insurance_type_secondary,
          insurance_name_tertiary,
          policy_number_tertiary,
          group_number_tertiary,
          subscriber_name_tertiary,
          subscriber_relationship_tertiary,
          insurance_type_tertiary
        `)
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setInsuranceData({
          // Primary Insurance
          insurance_name_primary: data.insurance_name_primary || '',
          policy_number_primary: data.policy_number_primary || '',
          group_number_primary: data.group_number_primary || '',
          subscriber_name_primary: data.subscriber_name_primary || '',
          subscriber_relationship_primary: data.subscriber_relationship_primary || '',
          insurance_type_primary: data.insurance_type_primary || '',
          
          // Secondary Insurance
          insurance_name_secondary: data.insurance_name_secondary || '',
          policy_number_secondary: data.policy_number_secondary || '',
          group_number_secondary: data.group_number_secondary || '',
          subscriber_name_secondary: data.subscriber_name_secondary || '',
          subscriber_relationship_secondary: data.subscriber_relationship_secondary || '',
          insurance_type_secondary: data.insurance_type_secondary || '',
          
          // Tertiary Insurance
          insurance_name_tertiary: data.insurance_name_tertiary || '',
          policy_number_tertiary: data.policy_number_tertiary || '',
          group_number_tertiary: data.group_number_tertiary || '',
          subscriber_name_tertiary: data.subscriber_name_tertiary || '',
          subscriber_relationship_tertiary: data.subscriber_relationship_tertiary || '',
          insurance_type_tertiary: data.insurance_type_tertiary || ''
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
          insurance_name_primary: insuranceData.insurance_name_primary,
          policy_number_primary: insuranceData.policy_number_primary,
          group_number_primary: insuranceData.group_number_primary,
          subscriber_name_primary: insuranceData.subscriber_name_primary,
          subscriber_relationship_primary: insuranceData.subscriber_relationship_primary,
          insurance_type_primary: insuranceData.insurance_type_primary,
          
          // Secondary Insurance
          insurance_name_secondary: insuranceData.insurance_name_secondary,
          policy_number_secondary: insuranceData.policy_number_secondary,
          group_number_secondary: insuranceData.group_number_secondary,
          subscriber_name_secondary: insuranceData.subscriber_name_secondary,
          subscriber_relationship_secondary: insuranceData.subscriber_relationship_secondary,
          insurance_type_secondary: insuranceData.insurance_type_secondary,
          
          // Tertiary Insurance
          insurance_name_tertiary: insuranceData.insurance_name_tertiary,
          policy_number_tertiary: insuranceData.policy_number_tertiary,
          group_number_tertiary: insuranceData.group_number_tertiary,
          subscriber_name_tertiary: insuranceData.subscriber_name_tertiary,
          subscriber_relationship_tertiary: insuranceData.subscriber_relationship_tertiary,
          insurance_type_tertiary: insuranceData.insurance_type_tertiary
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
              name="insurance_name_primary"
              value={insuranceData.insurance_name_primary}
              onChange={handleChange}
              placeholder="Insurance Company"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Number</label>
            <Input 
              name="policy_number_primary"
              value={insuranceData.policy_number_primary}
              onChange={handleChange}
              placeholder="Policy Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Group Number</label>
            <Input 
              name="group_number_primary"
              value={insuranceData.group_number_primary}
              onChange={handleChange}
              placeholder="Group Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Holder Name</label>
            <Input 
              name="subscriber_name_primary"
              value={insuranceData.subscriber_name_primary}
              onChange={handleChange}
              placeholder="Policy Holder Name"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Type</label>
            <Input 
              name="insurance_type_primary"
              value={insuranceData.insurance_type_primary}
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
              name="insurance_name_secondary"
              value={insuranceData.insurance_name_secondary}
              onChange={handleChange}
              placeholder="Insurance Company"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Number</label>
            <Input 
              name="policy_number_secondary"
              value={insuranceData.policy_number_secondary}
              onChange={handleChange}
              placeholder="Policy Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Group Number</label>
            <Input 
              name="group_number_secondary"
              value={insuranceData.group_number_secondary}
              onChange={handleChange}
              placeholder="Group Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Holder Name</label>
            <Input 
              name="subscriber_name_secondary"
              value={insuranceData.subscriber_name_secondary}
              onChange={handleChange}
              placeholder="Policy Holder Name"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Type</label>
            <Input 
              name="insurance_type_secondary"
              value={insuranceData.insurance_type_secondary}
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
              name="insurance_name_tertiary"
              value={insuranceData.insurance_name_tertiary}
              onChange={handleChange}
              placeholder="Insurance Company"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Number</label>
            <Input 
              name="policy_number_tertiary"
              value={insuranceData.policy_number_tertiary}
              onChange={handleChange}
              placeholder="Policy Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Group Number</label>
            <Input 
              name="group_number_tertiary"
              value={insuranceData.group_number_tertiary}
              onChange={handleChange}
              placeholder="Group Number"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Policy Holder Name</label>
            <Input 
              name="subscriber_name_tertiary"
              value={insuranceData.subscriber_name_tertiary}
              onChange={handleChange}
              placeholder="Policy Holder Name"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Type</label>
            <Input 
              name="insurance_type_tertiary"
              value={insuranceData.insurance_type_tertiary}
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
