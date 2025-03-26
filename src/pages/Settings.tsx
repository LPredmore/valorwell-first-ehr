
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Pencil, Plus, Trash, Phone, Mail, Save, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddUserDialog } from '@/components/AddUserDialog';
import { supabase, fetchCPTCodes, addCPTCode, updateCPTCode, deleteCPTCode, CPTCode } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
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
  const [activeTab, setActiveTab] = useState<string>(SettingsTabs.PRACTICE);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [cptCodes, setCptCodes] = useState<CPTCode[]>([]);
  const [isCPTDialogOpen, setIsCPTDialogOpen] = useState(false);
  const [selectedCPTCode, setSelectedCPTCode] = useState<CPTCode | null>(null);
  const [cptCodeForm, setCptCodeForm] = useState({
    code: '',
    description: '',
    fee: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, role');

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error fetching users',
          description: 'Failed to retrieve users from the database.',
          variant: 'destructive',
        });
        return;
      }

      setUsers(data || []);
    };

    const fetchClinicians = async () => {
      const { data, error } = await supabase
        .from('clinicians')
        .select('id, clinician_first_name, clinician_last_name, clinician_email, clinician_phone, clinician_status, created_at');

      if (error) {
        console.error('Error fetching clinicians:', error);
        toast({
          title: 'Error fetching clinicians',
          description: 'Failed to retrieve clinicians from the database.',
          variant: 'destructive',
        });
        return;
      }

      setClinicians(data || []);
    };

    fetchUsers();
    fetchClinicians();
  }, []);

  useEffect(() => {
    const getCPTCodes = async () => {
      const codes = await fetchCPTCodes();
      setCptCodes(codes);
    };

    getCPTCodes();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleOpenAddUserDialog = () => {
    setIsAddUserDialogOpen(true);
  };

  const handleCloseAddUserDialog = () => {
    setIsAddUserDialogOpen(false);
  };

  const handleUserAdded = (newUser: User) => {
    setUsers((prevUsers) => [...prevUsers, newUser]);
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');

    if (!confirmDelete) {
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error deleting user',
        description: 'Failed to delete the user from the database.',
        variant: 'destructive',
      });
      return;
    }

    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    toast({
      title: 'User deleted',
      description: 'The user has been successfully deleted.',
    });
  };

  const handleEditUser = (userId: string) => {
    navigate(`/users/${userId}/edit`);
  };

  const handleOpenCPTDialog = (cptCode?: CPTCode) => {
    setSelectedCPTCode(cptCode || null);
    setCptCodeForm({
      code: cptCode?.code || '',
      description: cptCode?.description || '',
      fee: cptCode?.fee || 0,
    });
    setIsCPTDialogOpen(true);
  };

  const handleCloseCPTDialog = () => {
    setIsCPTDialogOpen(false);
    setSelectedCPTCode(null);
  };

  const handleCPTFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCptCodeForm((prevForm) => ({
      ...prevForm,
      [name]: name === 'fee' ? parseFloat(value) : value,
    }));
  };

  const handleCPTCodeSubmit = async () => {
    if (!cptCodeForm.code || !cptCodeForm.description || !cptCodeForm.fee) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedCPTCode) {
      // Update existing CPT code
      const updatedCPTCode: CPTCode = {
        ...selectedCPTCode,
        code: cptCodeForm.code,
        description: cptCodeForm.description,
        fee: cptCodeForm.fee,
        name: selectedCPTCode.name
      };
      try {
        await updateCPTCode(updatedCPTCode);
        setCptCodes((prevCodes) =>
          prevCodes.map((code) => (code.id === updatedCPTCode.id ? updatedCPTCode : code))
        );
        toast({
          title: 'CPT code updated',
          description: 'The CPT code has been successfully updated.',
        });
      } catch (error: any) {
        console.error('Error updating CPT code:', error);
        toast({
          title: 'Error updating CPT code',
          description: error.message || 'Failed to update the CPT code.',
          variant: 'destructive',
        });
      }
    } else {
      // Add new CPT code
      try {
        const newCPTCodeData = {
          code: cptCodeForm.code,
          description: cptCodeForm.description,
          fee: cptCodeForm.fee,
          name: cptCodeForm.code // Using code as name if no name is provided
        };
        const newCPTCode = await addCPTCode(newCPTCodeData);
        setCptCodes((prevCodes) => [...prevCodes, newCPTCode]);
        toast({
          title: 'CPT code added',
          description: 'The CPT code has been successfully added.',
        });
      } catch (error: any) {
        console.error('Error adding CPT code:', error);
        toast({
          title: 'Error adding CPT code',
          description: error.message || 'Failed to add the CPT code.',
          variant: 'destructive',
        });
      }
    }

    handleCloseCPTDialog();
  };

  const handleDeleteCPTCode = async (cptCodeId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this CPT code?');

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteCPTCode(cptCodeId);
      setCptCodes((prevCodes) => prevCodes.filter((code) => code.id !== cptCodeId));
      toast({
        title: 'CPT code deleted',
        description: 'The CPT code has been successfully deleted.',
      });
    } catch (error: any) {
      console.error('Error deleting CPT code:', error);
      toast({
        title: 'Error deleting CPT code',
        description: error.message || 'Failed to delete the CPT code.',
        variant: 'destructive',
      });
    }
  };

  const paginatedCPTCodes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return cptCodes.slice(startIndex, endIndex);
  }, [cptCodes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(cptCodes.length / itemsPerPage);

  // Handler for template closing
  const handleTemplateClose = () => {
    // Placeholder for template closing functionality
    console.log("Template closed");
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-semibold mb-4">Settings</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value={SettingsTabs.PRACTICE}>Practice</TabsTrigger>
            <TabsTrigger value={SettingsTabs.CLINICIANS}>Clinicians</TabsTrigger>
            <TabsTrigger value={SettingsTabs.USERS}>Users</TabsTrigger>
            <TabsTrigger value={SettingsTabs.BILLING}>Billing</TabsTrigger>
            <TabsTrigger value={SettingsTabs.TEMPLATES}>Templates</TabsTrigger>
            {/* <TabsTrigger value={SettingsTabs.SECURITY}>Security</TabsTrigger> */}
            {/* <TabsTrigger value={SettingsTabs.LICENSES}>Licenses</TabsTrigger> */}
          </TabsList>
          <TabsContent value={SettingsTabs.PRACTICE}>
            <div>
              <h2 className="text-lg font-semibold mb-2">Practice Settings</h2>
              <p>Configure your practice details here.</p>
            </div>
          </TabsContent>
          <TabsContent value={SettingsTabs.CLINICIANS}>
            <div>
              <h2 className="text-lg font-semibold mb-2">Clinicians</h2>
              <p>Manage Clinicians</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinicians.map((clinician) => (
                    <TableRow key={clinician.id}>
                      <TableCell>{clinician.clinician_first_name} {clinician.clinician_last_name}</TableCell>
                      <TableCell>{clinician.clinician_email}</TableCell>
                      <TableCell>{clinician.clinician_phone}</TableCell>
                      <TableCell>{clinician.clinician_status}</TableCell>
                      <TableCell>{clinician.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value={SettingsTabs.USERS}>
            <div>
              <h2 className="text-lg font-semibold mb-2">Users</h2>
              <p>Manage users and their roles.</p>
              <Button onClick={handleOpenAddUserDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value={SettingsTabs.BILLING}>
            <div>
              <h2 className="text-lg font-semibold mb-2">Billing Settings</h2>
              <p>Manage billing information and CPT codes.</p>
              <Button onClick={() => handleOpenCPTDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add CPT Code
              </Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCPTCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>{code.fee}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenCPTDialog(code)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCPTCode(code.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious href="#" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} />
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationNext href="#" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} />
                </PaginationContent>
              </Pagination>
            </div>
          </TabsContent>
          <TabsContent value={SettingsTabs.TEMPLATES}>
            <div>
              <h2 className="text-lg font-semibold mb-2">Templates</h2>
              <p>Customize your templates for treatment plans and session notes.</p>
              <TreatmentPlanTemplate onClose={handleTemplateClose} />
              <SessionNoteTemplate onClose={handleTemplateClose} />
            </div>
          </TabsContent>
          {/* <TabsContent value={SettingsTabs.SECURITY}>
            <div>
              <h2 className="text-lg font-semibold mb-2">Security Settings</h2>
              <p>Manage security settings and password policies.</p>
            </div>
          </TabsContent>
          <TabsContent value={SettingsTabs.LICENSES}>
            <div>
              <h2 className="text-lg font-semibold mb-2">License Management</h2>
              <p>Manage your software licenses and subscriptions.</p>
            </div>
          </TabsContent> */}
        </Tabs>
      </div>

      <AddUserDialog 
        open={isAddUserDialogOpen} 
        onOpenChange={setIsAddUserDialogOpen} 
        onUserAdded={handleUserAdded} 
      />

      <Dialog open={isCPTDialogOpen} onOpenChange={setIsCPTDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCPTCode ? 'Edit CPT Code' : 'Add CPT Code'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                type="text"
                id="code"
                name="code"
                value={cptCodeForm.code}
                onChange={handleCPTFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={cptCodeForm.description}
                onChange={handleCPTFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fee" className="text-right">
                Fee
              </Label>
              <Input
                type="number"
                id="fee"
                name="fee"
                value={cptCodeForm.fee}
                onChange={handleCPTFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleCloseCPTDialog}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCPTCodeSubmit}>
              {selectedCPTCode ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

// Add default export for the Settings component
export default Settings;
