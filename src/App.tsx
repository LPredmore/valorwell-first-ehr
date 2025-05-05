
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ClinicianDetails from './pages/ClinicianDetails';
import ClinicianAvailability from './pages/ClinicianAvailability';
import NotFound from './components/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/clients/:clientId" element={<ClientDetails />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/clinicians/:clinicianId" element={<ClinicianDetails />} />
      <Route path="/clinicians/:clinicianId/availability" element={<ClinicianAvailability />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
