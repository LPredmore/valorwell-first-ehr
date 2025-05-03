
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { TimeZoneProvider } from "./context/TimeZoneContext";
import { DialogProvider } from "./context/DialogContext";
import DialogManager from "./components/common/DialogManager";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Core pages
import Clients from '@/pages/Clients';
import ClientDetails from '@/pages/ClientDetails';
import Activity from '@/pages/Activity';
import Messages from '@/pages/Messages';
import Settings from '@/pages/Settings';
import ClinicianDetails from '@/pages/ClinicianDetails';
import Calendar from '@/pages/Calendar';

// Client pages
import TherapistSelection from '@/pages/TherapistSelection';
import PatientDashboard from '@/pages/PatientDashboard';
import PatientProfile from '@/pages/PatientProfile';
import ClientHistoryForm from '@/pages/ClientHistoryForm';
import InformedConsent from '@/pages/InformedConsent';
import PatientDocuments from '@/pages/PatientDocuments';
import Reminders from '@/pages/Reminders';
import ProfileSetup from '@/pages/ProfileSetup';

// Missing component imports
import ClinicianDashboard from '@/pages/ClinicianDashboard';
import MyClients from '@/pages/MyClients';
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
                <DialogProvider>
                  <Toaster />
                  <Sonner />
                  <DialogManager />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Client accessible routes */}
                  <Route path="/profile-setup" element={<ProfileSetup />} />
                  
                  {/* Added: Make Informed Consent accessible to clients */}
                  <Route path="/informed-consent" element={
                    <ProtectedRoute allowedRoles={['client']} blockNewClients={false}>
                      <InformedConsent />
                    </ProtectedRoute>
                  } />
                  
                  {/* Add this route to your existing routes (location may vary based on your router setup) */}
                  <Route path="/client-history-form" element={<ClientHistoryForm />} />
                  
                  {/* Routes that block "New" clients */}
                  <Route path="/therapist-selection" element={
                    <ProtectedRoute allowedRoles={['client']} blockNewClients={true}>
                      <TherapistSelection />
                    </ProtectedRoute>
                  } />
                  
                  {/* Restored: Patient Dashboard route */}
                  <Route path="/patient-dashboard" element={
                    <ProtectedRoute allowedRoles={['client']} blockNewClients={true}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Restored: Patient Documents route */}
                  <Route path="/patient-documents" element={
                    <ProtectedRoute allowedRoles={['client']} blockNewClients={true}>
                      <PatientDocuments />
                    </ProtectedRoute>
                  } />
                  
                  {/* Modified: Allow clinicians to view client details */}
                  <Route path="/clients/:clientId" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician', 'client']} blockNewClients={true}>
                      <ClientDetails />
                    </ProtectedRoute>
                  } />
                  
                  {/* Modified route: Clinicians can view their own profile */}
                  <Route path="/clinicians/:clinicianId" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                      <ClinicianDetails />
                    </ProtectedRoute>
                  } />
                  
                  {/* Protected routes - clinician, admin, moderator */}
                  <Route path="/clinician-dashboard" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                      <ClinicianDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/my-clients" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                      <MyClients />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/clients" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Clients />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  <Route path="/activity" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Activity />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/reminders" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Reminders />
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                      <Messages />
                    </ProtectedRoute>
                  } />
                  
                  {/* Calendar route */}
                  <Route path="/calendar" element={
                    <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                      <Calendar />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </DialogProvider>
              </TimeZoneProvider>
            </UserProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
