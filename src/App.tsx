import React from "react";
import { Toaster } from "@/packages/ui/toaster";
import { Toaster as Sonner } from "@/packages/ui/sonner";
import { TooltipProvider } from "@/packages/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TimeZoneProvider } from "@/packages/core/contexts/TimeZoneContext";
import { UserProvider } from "@/packages/auth/contexts/UserContext";
import ProtectedRoute from "@/packages/auth/components/ProtectedRoute";

// Import pages from packages
import { 
  ClinicianDashboard as ClinicianPortalDashboard, 
  ClinicianDetails as ClinicianPortalDetails, 
  MyClients as ClinicianPortalClients 
} from '@/packages/clinician-portal/pages';

import { 
  PatientDashboard, 
  PatientProfile 
} from '@/packages/client-portal/pages';

// Local pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Calendar from '@/pages/Calendar';
import ClientDetails from '@/pages/ClientDetails';
import Activity from '@/pages/Activity';
import Messages from '@/pages/Messages';
import Settings from '@/pages/Settings';
import Analytics from '@/pages/Analytics';
import NotFound from '@/pages/NotFound';

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <UserProvider>
              <TimeZoneProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Clinician routes */}
                  <Route path="/clinician-dashboard" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                      <ClinicianPortalDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/my-clients" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                      <ClinicianPortalClients />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/clinicians/:clinicianId" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                      <ClinicianPortalDetails />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/calendar" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                      <Calendar />
                    </ProtectedRoute>
                  } />

                  {/* Client routes */}
                  <Route path="/patient-dashboard" element={
                    <ProtectedRoute allowedRoles={['client']} blockNewClients={true}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/patient-profile" element={
                    <ProtectedRoute allowedRoles={['client']} blockNewClients={true}>
                      <PatientProfile />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/activity" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Activity />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/messages" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Messages />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TimeZoneProvider>
            </UserProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
