
import { useState } from 'react';
import Layout from '../components/layout/Layout';
import PracticeTab from '@/components/settings/PracticeTab';
import CliniciansTab from '@/components/settings/CliniciansTab';
import UsersTab from '@/components/settings/UsersTab';
import BillingTab from '@/components/settings/BillingTab';
import TemplatesTab from '@/components/settings/TemplatesTab';
import SecurityTab from '@/components/settings/SecurityTab';
import LicensesTab from '@/components/settings/LicensesTab';

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
  
  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === SettingsTabs.PRACTICE ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(SettingsTabs.PRACTICE)}
          >
            Practice
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === SettingsTabs.CLINICIANS ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(SettingsTabs.CLINICIANS)}
          >
            Clinicians
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === SettingsTabs.USERS ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(SettingsTabs.USERS)}
          >
            Users
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === SettingsTabs.BILLING ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(SettingsTabs.BILLING)}
          >
            Billing
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === SettingsTabs.TEMPLATES ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(SettingsTabs.TEMPLATES)}
          >
            Templates
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === SettingsTabs.SECURITY ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(SettingsTabs.SECURITY)}
          >
            Security
          </button>
          <button 
            className={`settings-tab px-4 py-3 font-medium border-b-2 transition-all ${activeTab === SettingsTabs.LICENSES ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(SettingsTabs.LICENSES)}
          >
            Licenses
          </button>
        </div>
        
        {activeTab === SettingsTabs.PRACTICE && <PracticeTab />}
        {activeTab === SettingsTabs.CLINICIANS && <CliniciansTab />}
        {activeTab === SettingsTabs.USERS && <UsersTab />}
        {activeTab === SettingsTabs.BILLING && <BillingTab />}
        {activeTab === SettingsTabs.TEMPLATES && <TemplatesTab />}
        {activeTab === SettingsTabs.SECURITY && <SecurityTab />}
        {activeTab === SettingsTabs.LICENSES && <LicensesTab />}
      </div>
    </Layout>
  );
};

export default Settings;
