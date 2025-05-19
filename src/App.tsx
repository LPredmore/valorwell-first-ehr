import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Analytics from "./pages/Analytics";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Reminders from "./pages/Reminders";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ClinicianDetails from "./pages/ClinicianDetails";
import MyClients from "./pages/MyClients";
import PatientDashboard from "./pages/PatientDashboard";
import PatientDocuments from "./pages/PatientDocuments";
import ProfileSetup from "./pages/ProfileSetup";
import TherapistSelection from "./pages/TherapistSelection";
import ClinicianDashboard from "./pages/ClinicianDashboard";
import ClientHistoryForm from "./pages/ClientHistoryForm";

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <UserProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Client accessible routes */}
                <Route path="/profile-setup" element={<ProfileSetup />} />
                
                {/* Routes that block "New" clients */}
                <Route path="/therapist-selection" element={
                  <ProtectedRoute allowedRoles={['client']} blockNewClients={true}>
                    <TherapistSelection />
                  </ProtectedRoute>
                } />
                
                <Route path="/patient-dashboard" element={
                  <ProtectedRoute allowedRoles={['client']} blockNewClients={true}>
                    <PatientDashboard />
                  </ProtectedRoute>
                } />
                
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
                
                {/* Add this route to your existing routes (location may vary based on your router setup) */}
                <Route path="/client-history-form" element={<ClientHistoryForm />} />
                
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
                
                <Route path="/calendar" element={
                  <ProtectedRoute allowedRoles={['admin', 'moderator', 'clinician']}>
                    <Calendar />
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
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </UserProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
