import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Pencil, Plus, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddUserDialog } from '@/components/AddUserDialog';
import { AddClinicianDialog } from '@/components/AddClinicianDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SettingsTabs = {
  PRACTICE: 'practice',
  CLINICIANS: 'clinicians',
  USERS: 'users',
  BILLING: 'billing',
  TEMPLATES: 'templates',
  SECURITY: 'security',
  LICENSES: 'licenses'
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState(SettingsTabs.PRACTICE);
  const [activeBillingTab, setActiveBillingTab] = useState('cpt');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddClinicianDialogOpen, setIsAddClinicianDialogOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [clinicians, setClinicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClinicians, setLoadingClinicians] = useState(false);

  useEffect(() => {
    if (activeTab === SettingsTabs.USERS) {
      fetchUsers();
    } else if (activeTab === SettingsTabs.CLINICIANS) {
      fetchClinicians();
    }
  }, [activeTab]);

  const fetchClinicians = async () => {
    setLoadingClinicians(true);
    try {
      const { data, error } = await supabase
        .from('clinicians')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      setClinicians(data || []);
    } catch (error) {
      console.error('Error fetching clinicians:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clinicians',
        variant: 'destructive',
      });
    } finally {
      setLoadingClinicians(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClinician = async (clinicianId: string) => {
    if (!confirm('Are you sure you want to delete this clinician?')) return;
    
    try {
      const { error } = await supabase
        .from('clinicians')
        .delete()
        .eq('id', clinicianId);
      
      if (error) {
        throw error;
      }
      
      setClinicians(clinicians.filter(clinician => clinician.id !== clinicianId));
      
      toast({
        title: 'Success',
        description: 'Clinician deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting clinician:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete clinician',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button 
            className={`settings-tab ${activeTab === SettingsTabs.PRACTICE ? 'active' : ''}`}
            onClick={() => setActiveTab(SettingsTabs.PRACTICE)}
          >
            Practice
          </button>
          <button 
            className={`settings-tab ${activeTab === SettingsTabs.CLINICIANS ? 'active' : ''}`}
            onClick={() => setActiveTab(SettingsTabs.CLINICIANS)}
          >
            Clinicians
          </button>
          <button 
            className={`settings-tab ${activeTab === SettingsTabs.USERS ? 'active' : ''}`}
            onClick={() => setActiveTab(SettingsTabs.USERS)}
          >
            Users
          </button>
          <button 
            className={`settings-tab ${activeTab === SettingsTabs.BILLING ? 'active' : ''}`}
            onClick={() => setActiveTab(SettingsTabs.BILLING)}
          >
            Billing & Ins.
          </button>
          <button 
            className={`settings-tab ${activeTab === SettingsTabs.TEMPLATES ? 'active' : ''}`}
            onClick={() => setActiveTab(SettingsTabs.TEMPLATES)}
          >
            Templates
          </button>
          <button 
            className={`settings-tab ${activeTab === SettingsTabs.SECURITY ? 'active' : ''}`}
            onClick={() => setActiveTab(SettingsTabs.SECURITY)}
          >
            Security
          </button>
          <button 
            className={`settings-tab ${activeTab === SettingsTabs.LICENSES ? 'active' : ''}`}
            onClick={() => setActiveTab(SettingsTabs.LICENSES)}
          >
            Licenses
          </button>
        </div>
        
        {activeTab === SettingsTabs.PRACTICE && (
          <div className="p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Practice Information</h2>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
                <Pencil size={14} />
                <span>Edit</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Practice Name
                </label>
                <input 
                  type="text" 
                  placeholder="Enter practice name"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NPI Number
                </label>
                <input 
                  type="text" 
                  placeholder="Enter NPI number"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ID
                </label>
                <input 
                  type="text" 
                  placeholder="Enter tax ID"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Taxonomy Code
                </label>
                <input 
                  type="text" 
                  placeholder="Enter group taxonomy code"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-4">Practice Billing Address</h3>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input 
                  type="text" 
                  placeholder="Street address"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input 
                  type="text" 
                  placeholder="Apt, suite, etc."
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input 
                  type="text" 
                  placeholder="City"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input 
                  type="text" 
                  placeholder="State"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input 
                  type="text" 
                  placeholder="ZIP Code"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === SettingsTabs.CLINICIANS && (
          <div className="p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Clinician Management</h2>
              <button 
                onClick={() => setIsAddClinicianDialogOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800"
              >
                <Plus size={16} />
                <span>Add Clinician</span>
              </button>
            </div>
            
            {loadingClinicians ? (
              <div className="text-center py-8">Loading clinicians...</div>
            ) : clinicians.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No clinicians found. Click the button above to add your first clinician.
              </div>
            ) : (
              <div className="space-y-4">
                {clinicians.map((clinician) => (
                  <div key={clinician.id} className="border rounded-lg p-4 relative">
                    <div className="flex items-start">
                      <div className="w-12 h-12 overflow-hidden rounded-full mr-4">
                        {clinician.clinician_image_url ? (
                          <img 
                            src={clinician.clinician_image_url} 
                            alt={`${clinician.clinician_first_name} ${clinician.clinician_last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {clinician.clinician_first_name?.[0]}{clinician.clinician_last_name?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {clinician.clinician_professional_name || `${clinician.clinician_first_name} ${clinician.clinician_last_name}`}
                        </h3>
                        <div className="text-sm text-gray-600">
                          <p>Email: {clinician.clinician_email}</p>
                          <p>Type: {clinician.clinician_type}</p>
                          <p>License: {clinician.clinician_license_type}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteClinician(clinician.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <AddClinicianDialog 
              open={isAddClinicianDialogOpen} 
              onOpenChange={setIsAddClinicianDialogOpen}
              onClinicianAdded={fetchClinicians}
            />
          </div>
        )}
        
        {activeTab === SettingsTabs.USERS && (
          <div className="p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">User Management</h2>
              <button 
                onClick={() => setIsAddUserDialogOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800"
              >
                <Plus size={16} />
                <span>Add User</span>
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found. Click the button above to add your first user.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">{user.id}</TableCell>
                        <TableCell className="text-right">
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <AddUserDialog 
              open={isAddUserDialogOpen} 
              onOpenChange={setIsAddUserDialogOpen}
              onUserAdded={fetchUsers}
            />
          </div>
        )}
        
        {activeTab === SettingsTabs.BILLING && (
          <div className="p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">CPT Codes</h2>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50">
                <Plus size={16} />
                <span>Add CPT Code</span>
              </button>
            </div>
            
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead className="text-left bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-gray-600">Code</th>
                    <th className="px-6 py-3 text-gray-600">Name</th>
                    <th className="px-6 py-3 text-gray-600 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-6 py-4">99213</td>
                    <td className="px-6 py-4">Office visit, established patient (15 min)</td>
                    <td className="px-6 py-4 text-right">$75.00</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-6 py-4">99214</td>
                    <td className="px-6 py-4">Office visit, established patient (25 min)</td>
                    <td className="px-6 py-4 text-right">$110.00</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-6 py-4">90834</td>
                    <td className="px-6 py-4">Psychotherapy, 45 minutes</td>
                    <td className="px-6 py-4 text-right">$130.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border text-center text-gray-500 text-sm">
              Additional billing & insurance settings will be implemented in the next phase.
            </div>
          </div>
        )}
        
        {activeTab === SettingsTabs.TEMPLATES && (
          <div className="p-6 animate-fade-in">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Chart Templates</h2>
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50">
                  <Plus size={16} />
                  <span>Add Template</span>
                </button>
              </div>
              
              <div className="text-center py-10 border rounded bg-gray-50 text-gray-500">
                No chart templates available. Click the button above to create your first template.
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Online Forms</h2>
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50">
                  <Plus size={16} />
                  <span>Add Form</span>
                </button>
              </div>
              
              <div className="text-center py-10 border rounded bg-gray-50 text-gray-500">
                No online forms available. Click the button above to create your first form.
              </div>
            </div>
          </div>
        )}
        
        {activeTab === SettingsTabs.SECURITY && (
          <div className="p-6 animate-fade-in">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Security Settings Coming Soon</h2>
              <p className="text-gray-600 max-w-md">
                Security and privacy settings will be implemented in the next phase.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === SettingsTabs.LICENSES && (
          <div className="p-6 animate-fade-in">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">License Management Coming Soon</h2>
              <p className="text-gray-600 max-w-md">
                License management features will be implemented in the next phase.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Settings;
