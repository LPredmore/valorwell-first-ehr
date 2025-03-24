
import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Search, Filter, RotateCcw, MoreHorizontal, Download, Upload, Plus } from 'lucide-react';

const Clients = () => {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">Clients</h2>
          <span className="bg-valorwell-700 text-white text-xs px-2 py-0.5 rounded-full">1</span>
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
          <button className="flex items-center gap-2 px-3 py-2 text-white bg-valorwell-700 rounded hover:bg-valorwell-800 transition-colors">
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
              />
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button className="px-4 py-2 bg-valorwell-700 text-white rounded hover:bg-valorwell-800 transition-colors">
                Search
              </button>
              <button className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 transition-colors">
                Clear
              </button>
              <button className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Filter size={16} />
                <span>Filters</span>
              </button>
              <button className="p-2 border rounded text-gray-700 hover:bg-gray-50 transition-colors">
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
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">John Test</td>
                  <td className="px-4 py-3">predmoreluke@gmail.com</td>
                  <td className="px-4 py-3">5736946131</td>
                  <td className="px-4 py-3">09/08/1999</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-waiting text-yellow-800 rounded-full text-xs font-medium">
                      Waiting
                    </span>
                  </td>
                  <td className="px-4 py-3">-</td>
                  <td className="px-4 py-3">
                    <button className="text-gray-500 hover:text-gray-700">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Clients;
