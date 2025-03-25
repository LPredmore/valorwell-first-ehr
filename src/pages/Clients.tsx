
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Search, Filter, RotateCcw, MoreHorizontal, Download, Upload, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Clients = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, [activeTab]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Get client data directly from the clients table which now has all the fields
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');
      
      if (clientsError) throw clientsError;
      
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchClients();
  };

  const handleNewClient = () => {
    navigate('/clients/new');
  };

  const handleEditClient = (id) => {
    navigate(`/clients/${id}`);
  };

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    
    const displayName = getDisplayName(client);
    const email = client.email?.toLowerCase() || '';
    const phone = client.phone?.toLowerCase() || '';
    
    return (
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery.toLowerCase())
    );
  });

  const getDisplayName = (client) => {
    const preferredName = client.preferred_name || client.first_name || '';
    const lastName = client.last_name || '';
    return `${preferredName} ${lastName}`.trim();
  };

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Clients</h2>
          <span className="bg-valorwell-700 text-white text-xs px-2 py-0.5 rounded-full">{clients.length}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download size={16} />
            <span>Export</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Upload size={16} />
            <span>Import</span>
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="bg-valorwell-700 hover:bg-valorwell-800 flex items-center gap-2"
            onClick={handleNewClient}
          >
            <Plus size={16} />
            <span>New Client</span>
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b">
          <div className="flex">
            <button 
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'all' ? 'border-b-2 border-valorwell-700 text-valorwell-700' : 'text-gray-500'}`}
              onClick={() => setActiveTab('all')}
            >
              All Clients
            </button>
            <button 
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'custodian' ? 'border-b-2 border-valorwell-700 text-valorwell-700' : 'text-gray-500'}`}
              onClick={() => setActiveTab('custodian')}
            >
              My Custodian Records
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search size={16} />
              </div>
              <input 
                type="search" 
                className="w-full p-2 pl-10 text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-300 focus:ring-1 focus:outline-none focus:ring-valorwell-500"
                placeholder="Search Clients" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button 
                variant="default"
                size="sm"
                className="bg-valorwell-700 hover:bg-valorwell-800"
                onClick={handleSearch}
              >
                Search
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearSearch}
              >
                Clear
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter size={16} />
                <span>Filters</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="p-2"
                onClick={fetchClients}
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date Of Birth</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">Loading clients...</TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">No clients found</TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map(client => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input type="checkbox" className="w-4 h-4 rounded" />
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={() => handleEditClient(client.id)}
                          className="font-medium text-valorwell-700 hover:underline"
                        >
                          {getDisplayName(client)}
                        </button>
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>{client.date_of_birth || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${client.status === 'Waiting' ? 'bg-yellow-100 text-yellow-800' : 
                            client.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            client.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 
                            client.status === 'On Hold' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {client.status || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{client.assigned_therapist ? client.assigned_therapist : '-'}</TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal size={16} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-0">
                            <div className="py-1">
                              <button 
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                onClick={() => handleEditClient(client.id)}
                              >
                                Edit
                              </button>
                              <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                                View
                              </button>
                              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                Delete
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Clients;
