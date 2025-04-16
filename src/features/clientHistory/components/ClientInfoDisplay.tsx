
import React from 'react';
import { ClientData } from '@/hooks/useClientData';

interface ClientInfoDisplayProps {
  clientData?: ClientData | null;
}

export const ClientInfoDisplay: React.FC<ClientInfoDisplayProps> = ({ clientData }) => {
  // Format name for display
  const clientFullName = clientData ? 
    `${clientData.client_first_name || ''} ${clientData.client_last_name || ''}`.trim() : 
    '';
  
  // Format date of birth if needed
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="mb-8 border p-4 rounded-lg bg-gray-50">
      <h2 className="text-xl font-semibold mb-4">Client Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="block text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={clientFullName}
            disabled
          />
        </div>
        
        <div className="form-group">
          <label className="block text-gray-700 mb-1">Preferred Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={clientData?.client_preferred_name || ''}
            disabled
          />
        </div>
        
        <div className="form-group">
          <label className="block text-gray-700 mb-1">Date of Birth</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={formatDate(clientData?.client_date_of_birth)}
            disabled
          />
        </div>
      </div>
    </div>
  );
};
