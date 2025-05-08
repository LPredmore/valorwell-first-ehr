
import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddUserDialog } from '@/components/AddUserDialog';
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

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  role: string | null;
}

const UsersTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const itemsPerPage = 10;
  
  const totalUserPages = useMemo(() => Math.max(1, Math.ceil(users.length / itemsPerPage)), [users.length]);
  
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return users.slice(startIndex, startIndex + itemsPerPage);
  }, [users, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get all users from Auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw authError;
      }
      
      // Map the auth users to our User interface
      const mappedUsers: User[] = await Promise.all(
        authUsers.users.map(async (user) => {
          const role = user.user_metadata?.role || null;
          let firstName = user.user_metadata?.first_name || '';
          let lastName = user.user_metadata?.last_name || '';
          let phone = user.user_metadata?.phone || null;
          
          // If role is specified, get additional data from the respective table
          if (role === 'admin') {
            const { data: adminData } = await supabase
              .from('admins')
              .select('admin_first_name, admin_last_name, admin_phone')
              .eq('id', user.id)
              .single();
              
            if (adminData) {
              firstName = adminData.admin_first_name || firstName;
              lastName = adminData.admin_last_name || lastName;
              phone = adminData.admin_phone || phone;
            }
          } else if (role === 'clinician') {
            const { data: clinicianData } = await supabase
              .from('clinicians')
              .select('clinician_first_name, clinician_last_name, clinician_phone')
              .eq('id', user.id)
              .single();
              
            if (clinicianData) {
              firstName = clinicianData.clinician_first_name || firstName;
              lastName = clinicianData.clinician_last_name || lastName;
              phone = clinicianData.clinician_phone || phone;
            }
          } else if (role === 'client') {
            const { data: clientData } = await supabase
              .from('clients')
              .select('client_first_name, client_last_name, client_phone')
              .eq('id', user.id)
              .single();
              
            if (clientData) {
              firstName = clientData.client_first_name || firstName;
              lastName = clientData.client_last_name || lastName;
              phone = clientData.client_phone || phone;
            }
          }
          
          return {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email || '',
            phone: phone,
            role: role
          };
        })
      );
      
      setUsers(mappedUsers);
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

  return (
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
  );
};

export default UsersTab;
