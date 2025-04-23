
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/packages/ui/tabs";
import Layout from "@/components/layout/Layout";
import {
  UsersTab,
  CliniciansTab,
  PracticeTab,
  LicensesTab,
  TemplatesTab,
  SecurityTab,
  BillingTab
} from '../components/settings';

const Settings = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full border-b mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="clinicians">Clinicians</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="licenses">Licenses</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          
          <TabsContent value="clinicians">
            <CliniciansTab />
          </TabsContent>
          
          <TabsContent value="practice">
            <PracticeTab />
          </TabsContent>
          
          <TabsContent value="licenses">
            <LicensesTab />
          </TabsContent>
          
          <TabsContent value="templates">
            <TemplatesTab />
          </TabsContent>
          
          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
          
          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
