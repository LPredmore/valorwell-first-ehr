
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Search, Filter, RotateCcw, MoreHorizontal, Download, Upload, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
      // First get client IDs
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, date_of_birth, phone, status, assigned_therapist');
      
      if (clientsError) throw clientsError;
      
      // Then get profile information for each client
      const clientIds = clientsData.map(client => client.id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', clientIds);
        
      if (profilesError) throw profilesError;
      
      // Combine the data
      const combinedData = clientsData.map(client => {
        const profile = profilesData.find(p => p.id === client.id) || { 
          first_name: '',
          last_name: '',
          email: ''
        };
        
        return {
          ...client,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          email: profile.email || ''
        };
      });
      
      setClients(combinedData);
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
    
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const email = client.email?.toLowerCase() || '';
    const phone = client.phone?.toLowerCase() || '';
    
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Clients</h2>
          <span className="bg-valorwell-700 text-white text-xs px-2 py-0.5 rounded-full">{clients.length}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-white rounded border hover:bg-gray-50">
            <Download size={16} />
            <span>Export</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-white rounded border hover:bg-gray-50">
            <Upload size={16} />
            <span>Import</span>
          </button>
          <button 
            className="flex items-center gap-2 px-3 py-2 text-white bg-valorwell-700 rounded hover:bg-valorwell-800 transition-colors"
            onClick={handleNewClient}
          >
            <Plus size={16} />
            <span>New Client</span>
          </button>
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
              <button 
                className="px-4 py-2 bg-valorwell-700 text-white rounded hover:bg-valorwell-800 transition-colors"
                onClick={handleSearch}
              >
                Search
              </button>
              <button 
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={clearSearch}
              >
                Clear
              </button>
              <button className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Filter size={16} />
                <span>Filters</span>
              </button>
              <button 
                className="p-2 border rounded text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={fetchClients}
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 border-b">
                <tr>
                  <th className="p-4">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                  </th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Date Of Birth</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Therapist</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">Loading clients...</td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">No clients found</td>
                  </tr>
                ) : (
                  filteredClients.map(client => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <input type="checkbox" className="w-4 h-4 rounded" />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{`${client.first_name} ${client.last_name}`}</td>
                      <td className="px-4 py-3">{client.email}</td>
                      <td className="px-4 py-3">{client.phone}</td>
                      <td className="px-4 py-3">{client.date_of_birth}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${client.status === 'Waiting' ? 'bg-waiting text-yellow-800' : 
                            client.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            client.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 
                            client.status === 'On Hold' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-gray-500 hover:text-gray-700">
                              <MoreHorizontal size={16} />
                            </button>
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Clients;
