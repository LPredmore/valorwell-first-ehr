import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Pencil, Plus, Trash, Phone, Mail, Save, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddUserDialog } from '@/components/AddUserDialog';
import { 
  supabase, 
  fetchCPTCodes, 
  addCPTCode, 
  updateCPTCode, 
  deleteCPTCode, 
  CPTCode,
  fetchPracticeInfo,
  updatePracticeInfo,
  PracticeInfo
} from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import PHQ9Template from '@/components/templates/PHQ9Template';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  role: string | null;
}

interface Clinician {
  id: string;
  clinician_first_name: string | null;
  clinician_last_name: string | null;
  clinician_email: string | null;
  clinician_phone: string | null;
  clinician_status: string | null;
  created_at: string;
}

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
  const [users, setUsers] = useState<User[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClinicianLoading, setIsClinicianLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentClinicianPage, setCurrentClinicianPage] = useState(1);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
  const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);
  const [showPHQ9Template, setShowPHQ9Template] = useState(false);
  
  const [cptCodes, setCptCodes] = useState<CPTCode[]>([]);
  const [isCptLoading, setIsCptLoading] = useState(true);
  const [isCptDialogOpen, setIsCptDialogOpen] = useState(false);
  const [editingCptCode, setEditingCptCode] = useState<CPTCode | null>(null);
  const [newCptCode, setNewCptCode] = useState<CPTCode>({
    code: '',
    name: '',
    fee: 0,
    description: '',
    clinical_type: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [practiceInfo, setPracticeInfo] = useState<PracticeInfo>({
    id: '',
    practice_name: '',
    practice_npi: '',
    practice_taxid: '',
    practice_taxonomy: '',
    practice_address1: '',
    practice_address2: '',
    practice_city: '',
    practice_state: '',
    practice_zip: ''
  });
  
  const [isEditingPractice, setIsEditingPractice] = useState(false);
  const [isSavingPractice, setIsSavingPractice] = useState(false);
  
  const itemsPerPage = 10;
  const navigate = useNavigate();
  
  const totalUserPages = useMemo(() => Math.max(1, Math.ceil(users.length / itemsPerPage)), [users.length]);
  const totalClinicianPages = useMemo(() => Math.max(1, Math.ceil(clinicians.length / itemsPerPage)), [clinicians.length]);
  
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return users.slice(startIndex, startIndex + itemsPerPage);
  }, [users, currentPage]);
  
  const currentClinicians = useMemo(() => {
    const startIndex = (currentClinicianPage - 1) * itemsPerPage;
    return clinicians.slice(startIndex, startIndex + itemsPerPage);
  }, [clinicians, currentClinicianPage]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, role')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClinicians = async () => {
    setIsClinicianLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinicians')
        .select('id, clinician_first_name, clinician_last_name, clinician_email, clinician_phone, clinician_status, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setClinicians(data || []);
    } catch (error) {
      console.error('Error fetching clinicians:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clinicians. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClinicianLoading(false);
    }
  };

  const loadCptCodes = async () => {
    setIsCptLoading(true);
    try {
      const codes = await fetchCPTCodes();
      setCptCodes(codes);
    } catch (error) {
      console.error('Error loading CPT codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load CPT codes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCptLoading(false);
    }
  };

  const fetchPracticeData = async () => {
    try {
      const data = await fetchPracticeInfo();
      if (data) {
        setPracticeInfo(data);
      }
    } catch (error) {
      console.error('Error fetching practice information:', error);
      toast({
        title: 'Error',
        description: 'Failed to load practice information. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (activeTab === SettingsTabs.USERS) {
      fetchUsers();
    } else if (activeTab === SettingsTabs.CLINICIANS) {
      fetchClinicians();
    } else if (activeTab === SettingsTabs.BILLING) {
      loadCptCodes();
    } else if (activeTab === SettingsTabs.PRACTICE) {
      fetchPracticeData();
    }
  }, [activeTab]);

  const handleUserAdded = () => {
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this user? This action cannot be undone.');
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
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
        description: 'Failed to delete user. You may not have permission to perform this action.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClinician = async (clinicianId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this clinician? This action cannot be undone.');
    
    if (!confirmed) return;
    
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
        description: 'Failed to delete clinician. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClinicianClick = (clinicianId: string) => {
    navigate(`/clinicians/${clinicianId}`);
  };

  const formatName = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) return "—";
    return `${firstName || ''} ${lastName || ''}`.trim();
  };

  const handleAddCptCode = () => {
    setIsEditMode(false);
    setNewCptCode({ code: '', name: '', fee: 0, description: '', clinical_type: '' });
    setIsCptDialogOpen(true);
  };

  const handleEditCptCode = (cptCode: CPTCode) => {
    setIsEditMode(true);
    setEditingCptCode(cptCode);
    setNewCptCode({ 
      ...cptCode,
      clinical_type: cptCode.clinical_type || '' 
    });
    setIsCptDialogOpen(true);
  };

  const handleDeleteCptCode = async (code: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this CPT code? This action cannot be undone.');
    
    if (!confirmed) return;
    
    try {
      const result = await deleteCPTCode(code);
      
      if (!result.success) {
        throw result.error;
      }
      
      setCptCodes(cptCodes.filter(cpt => cpt.code !== code));
      
      toast({
        title: 'Success',
        description: 'CPT code deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting CPT code:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete CPT code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCptCode = async () => {
    try {
      if (!newCptCode.code || !newCptCode.name || isNaN(newCptCode.fee) || newCptCode.fee <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields correctly. Fee must be greater than 0.',
          variant: 'destructive',
        });
        return;
      }

      let result;
      
      if (isEditMode && editingCptCode) {
        result = await updateCPTCode(editingCptCode.code, newCptCode);
        
        if (result.success) {
          setCptCodes(prevCodes => 
            prevCodes.map(code => 
              code.code === editingCptCode.code ? newCptCode : code
            )
          );
          
          toast({
            title: 'Success',
            description: 'CPT code updated successfully',
          });
        }
      } else {
        result = await addCPTCode(newCptCode);
        
        if (result.success) {
          setCptCodes(prevCodes => [...prevCodes, newCptCode]);
          
          toast({
            title: 'Success',
            description: 'CPT code added successfully',
          });
        }
      }
      
      if (!result.success) {
        throw result.error;
      }
      
      setIsCptDialogOpen(false);
    } catch (error) {
      console.error('Error saving CPT code:', error);
      toast({
        title: 'Error',
        description: 'Failed to save CPT code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePracticeInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPracticeInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePracticeInfo = async () => {
    setIsSavingPractice(true);
    try {
      const result = await updatePracticeInfo(practiceInfo);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Practice information saved successfully',
        });
        setIsEditingPractice(false);
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error('Error saving practice information:', error);
      toast({
        title: 'Error',
        description: 'Failed to save practice information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPractice(false);
    }
  };

  const handleCloseTreatmentPlan = () => {
    setShowTreatmentPlanTemplate(false);
  };

  const handleCloseSessionNote = () => {
    setShowSessionNoteTemplate(false);
  };
  
  const handleClosePHQ9 = () => {
    setShowPHQ9Template(false);
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
            Billing
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
              {isEditingPractice ? (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsEditingPractice(false);
                      fetchPracticeData(); // Reset to original data
                    }}
                    disabled={isSavingPractice}
                  >
                    <X size={14} className="mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSavePracticeInfo}
                    disabled={isSavingPractice}
                  >
                    <Save size={14} className="mr-1" />
                    {isSavingPractice ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                <button 
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                  onClick={() => setIsEditingPractice(true)}
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Practice Name
                </label>
                <input 
                  type="text" 
                  name="practice_name"
                  value={practiceInfo.practice_name}
                  onChange={handlePracticeInfoChange}
                  placeholder="Enter practice name"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NPI Number
                </label>
                <input 
                  type="text" 
                  name="practice_npi"
                  value={practiceInfo.practice_npi}
                  onChange={handlePracticeInfoChange}
                  placeholder="Enter NPI number"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ID
                </label>
                <input 
                  type="text" 
                  name="practice_taxid"
                  value={practiceInfo.practice_taxid}
                  onChange={handlePracticeInfoChange}
                  placeholder="Enter tax ID"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Taxonomy Code
                </label>
                <input 
                  type="text" 
                  name="practice_taxonomy"
                  value={practiceInfo.practice_taxonomy}
                  onChange={handlePracticeInfoChange}
                  placeholder="Enter group taxonomy code"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
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
                  name="practice_address1"
                  value={practiceInfo.practice_address1}
                  onChange={handlePracticeInfoChange}
                  placeholder="Street address"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input 
                  type="text" 
                  name="practice_address2"
                  value={practiceInfo.practice_address2}
                  onChange={handlePracticeInfoChange}
                  placeholder="Apt, suite, etc."
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
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
                  name="practice_city"
                  value={practiceInfo.practice_city}
                  onChange={handlePracticeInfoChange}
                  placeholder="City"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input 
                  type="text" 
                  name="practice_state"
                  value={practiceInfo.practice_state}
                  onChange={handlePracticeInfoChange}
                  placeholder="State"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input 
                  type="text" 
                  name="practice_zip"
                  value={practiceInfo.practice_zip}
                  onChange={handlePracticeInfoChange}
                  placeholder="ZIP Code"
                  className="w-full p-2 border rounded-md text-gray-700 bg-gray-50" 
                  readOnly={!isEditingPractice}
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
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800"
              >
                <Plus size={16} />
                <span>Add Clinician</span>
              </button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isClinicianLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Loading clinicians...
                      </TableCell>
                    </TableRow>
                  ) : clinicians.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No clinicians found. Click the button above to add your first clinician.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentClinicians.map((clinician) => (
                      <TableRow key={clinician.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => handleClinicianClick(clinician.id)}
                            className="hover:text-valorwell-700 hover:underline focus:outline-none text-left"
                          >
                            {formatName(clinician.clinician_first_name, clinician.clinician_last_name)}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail size={14} className="text-gray-500" />
                            {clinician.clinician_email || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone size={14} className="text-gray-500" />
                            {clinician.clinician_phone || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            clinician.clinician_status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : clinician.clinician_status === 'Pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {clinician.clinician_status || "Not Set"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <button 
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            onClick={() => handleDeleteClinician(clinician.id)}
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {clinicians.length > itemsPerPage && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentClinicianPage((prev) => Math.max(prev - 1, 1))}
                      className={currentClinicianPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalClinicianPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentClinicianPage === page}
                        onClick={() => setCurrentClinicianPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentClinicianPage((prev) => Math.min(prev + 1, totalClinicianPages))}
                      className={currentClinicianPage === totalClinicianPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
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
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No users found. Click the button above to add your first user.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                        <TableCell className="capitalize">{user.role || "—"}</TableCell>
                        <TableCell className="text-right">
                          <button 
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {users.length > itemsPerPage && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalUserPages))}
                      className={currentPage === totalUserPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            
            <AddUserDialog 
              open={isAddUserDialogOpen} 
              onOpenChange={setIsAddUserDialogOpen}
              onUserAdded={handleUserAdded}
            />
          </div>
        )}
        
        {activeTab === SettingsTabs.BILLING && (
          <div className="p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">CPT Codes</h2>
              <button 
                onClick={handleAddCptCode}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800"
              >
                <Plus size={16} />
                <span>Add CPT Code</span>
              </button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Clinical Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isCptLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Loading CPT codes...
                      </TableCell>
                    </TableRow>
                  ) : cptCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No CPT codes found. Click the button above to add your first CPT code.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cptCodes.map((cptCode) => (
                      <TableRow key={cptCode.code}>
                        <TableCell className="font-medium">{cptCode.code}</TableCell>
                        <TableCell>{cptCode.name}</TableCell>
                        <TableCell>{cptCode.clinical_type || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{cptCode.description || "—"}</TableCell>
                        <TableCell className="text-right">${cptCode.fee.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEditCptCode(cptCode)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteCptCode(cptCode.code)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        
        {activeTab === SettingsTabs.TEMPLATES && (
          <div className="p-6 animate-fade-in">
            {showTreatmentPlanTemplate ? (
              <TreatmentPlanTemplate onClose={() => setShowTreatmentPlanTemplate(false)} />
            ) : showSessionNoteTemplate ? (
              <SessionNoteTemplate onClose={() => setShowSessionNoteTemplate(false)} />
            ) : showPHQ9Template ? (
              <PHQ9Template onClose={() => setShowPHQ9Template(false)} clinicianName="" />
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Chart Templates</h2>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800">
                      <Plus size={16} />
                      <span>Add Template</span>
                    </button>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Template Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Last Modified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => setShowTreatmentPlanTemplate(true)}>
                          <TableCell className="font-medium">Treatment Plan</TableCell>
                          <TableCell>Chart Template</TableCell>
                          <TableCell>{new Date().toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => setShowSessionNoteTemplate(true)}>
                          <TableCell className="font-medium">Session Note</TableCell>
                          <TableCell>Chart Template</TableCell>
                          <TableCell>{new Date().toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Assessment Forms</h2>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800">
                      <Plus size={16} />
                      <span>Add Assessment</span>
                    </button>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Form Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => setShowPHQ9Template(true)}>
                          <TableCell className="font-medium">PHQ-9</TableCell>
                          <TableCell>Depression Screener</TableCell>
                          <TableCell>Patient Health Questionnaire (9-item)</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-gray-50">
                          <TableCell className="font-medium">GAD-7</TableCell>
                          <TableCell>Anxiety Screener</TableCell>
                          <TableCell>Generalized Anxiety Disorder (7-item)</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
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
              </>
            )}
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
      
      <AddUserDialog 
        open={isAddUserDialogOpen} 
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={handleUserAdded}
      />

      <Dialog open={isCptDialogOpen} onOpenChange={setIsCptDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit CPT Code' : 'Add CPT Code'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpt-code" className="text-right">
                Code
              </Label>
              <Input
                id="cpt-code"
                value={newCptCode.code}
                onChange={(e) => setNewCptCode({ ...newCptCode, code: e.target.value })}
                className="col-span-3"
                disabled={isEditMode}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpt-name" className="text-right">
                Name
              </Label>
              <Input
                id="cpt-name"
                value={newCptCode.name}
                onChange={(e) => setNewCptCode({ ...newCptCode, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpt-clinical-type" className="text-right">
                Clinical Type
              </Label>
              <Input
                id="cpt-clinical-type"
                value={newCptCode.clinical_type || ''}
                onChange={(e) => setNewCptCode({ ...newCptCode, clinical_type: e.target.value })}
                className="col-span-3"
                placeholder="E.g., Evaluation & Management, Psychotherapy"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpt-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="cpt-description"
                value={newCptCode.description || ''}
                onChange={(e) => setNewCptCode({ ...newCptCode, description: e.target.value })}
                className="col-span-3 min-h-[100px]"
                placeholder="Detailed description of the CPT code"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpt-fee" className="text-right">
                Fee ($)
              </Label>
              <Input
                id="cpt-fee"
                type="number"
                min="0"
                step="0.01"
                value={newCptCode.fee}
                onChange={(e) => setNewCptCode({ ...newCptCode, fee: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCptDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveCptCode}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Settings;
