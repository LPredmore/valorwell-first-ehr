
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import StaffMemberForm from '../components/StaffMemberForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const SettingsTabs = {
  PRACTICE: 'practice',
  STAFF: 'staff',
  BILLING: 'billing',
  TEMPLATES: 'templates',
  SECURITY: 'security',
  LICENSES: 'licenses'
};

// Define the structure for staff member data
type StaffMember = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  clinician_type: string | null;
  license_type: string | null;
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState(SettingsTabs.PRACTICE);
  const [activeBillingTab, setActiveBillingTab] = useState('cpt');
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch staff members from database
  useEffect(() => {
    if (activeTab === SettingsTabs.STAFF) {
      fetchStaffMembers();
    }
  }, [activeTab]);

  const fetchStaffMembers = async () => {
    setIsLoading(true);
    try {
      // Query clinicians and join with profiles to get all necessary data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          clinicians(phone, clinician_type, license_type)
        `)
        .eq('role', 'clinician')
        .order('last_name', { ascending: true });

      if (error) {
        throw error;
      }

      // Format the data to include the phone number from the clinicians table
      const formattedStaff = data.map(profile => ({
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.clinicians?.[0]?.phone || null,
        role: profile.role,
        clinician_type: profile.clinicians?.[0]?.clinician_type || null,
        license_type: profile.clinicians?.[0]?.license_type || null
      }));

      setStaffMembers(formattedStaff);
    } catch (error) {
      console.error('Error fetching staff members:', error);
      toast.error('Failed to load staff members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaffMember = async (id: string) => {
    try {
      // When deleting a staff member, we need to delete from clinicians and profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Staff member deleted successfully');
      fetchStaffMembers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast.error('Failed to delete staff member');
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
            className={`settings-tab ${activeTab === SettingsTabs.STAFF ? 'active' : ''}`}
            onClick={() => setActiveTab(SettingsTabs.STAFF)}
          >
            Staff
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
        
        {activeTab === SettingsTabs.STAFF && (
          <div className="p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Staff Management</h2>
              <button 
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800"
                onClick={() => setIsStaffFormOpen(true)}
              >
                <Plus size={16} />
                <span>Add Staff Member</span>
              </button>
            </div>
            
            {isLoading ? (
              <div className="py-10 text-center text-gray-500">Loading staff members...</div>
            ) : staffMembers.length === 0 ? (
              <div className="text-center py-10 border rounded bg-gray-50 text-gray-500">
                No staff members found. Click the button above to add your first staff member.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>License Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">
                        {staff.first_name} {staff.last_name}
                      </TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>{staff.phone || "—"}</TableCell>
                      <TableCell>{staff.clinician_type || "—"}</TableCell>
                      <TableCell>{staff.license_type || "—"}</TableCell>
                      <TableCell className="text-right">
                        <button 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                          onClick={() => handleDeleteStaffMember(staff.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {/* Staff Member Form */}
            <StaffMemberForm 
              isOpen={isStaffFormOpen} 
              onClose={() => {
                setIsStaffFormOpen(false);
                fetchStaffMembers(); // Refresh the list when the form is closed
              }} 
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
