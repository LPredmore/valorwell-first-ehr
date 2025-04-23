
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import PracticeTab from '../components/settings/PracticeTab';
import CliniciansTab from '../components/settings/CliniciansTab';
import UsersTab from '../components/settings/UsersTab';
import BillingTab from '../components/settings/BillingTab';
import TemplatesTab from '../components/settings/TemplatesTab';
import SecurityTab from '../components/settings/SecurityTab';
import LicensesTab from '../components/settings/LicensesTab';

type SettingsTab = 'practice' | 'clinicians' | 'users' | 'billing' | 'templates' | 'security' | 'clinician_licenses';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('practice');
  
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-wrap border-b overflow-x-auto">
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'practice' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('practice')}
          >
            Practice
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'clinicians' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('clinicians')}
          >
            Clinicians
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'billing' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('billing')}
          >
            Billing
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === 'clinician_licenses' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('clinician_licenses')}
          >
            Licenses
          </button>
        </div>
        
        {activeTab === 'practice' && <PracticeTab />}
        {activeTab === 'clinicians' && <CliniciansTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'clinician_licenses' && <LicensesTab />}
      </div>
    </Layout>
  );
};

export default Settings;
