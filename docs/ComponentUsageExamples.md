# Component Usage Examples

This document provides practical examples of how to use the documented components in the Valorwell First EHR application. These examples demonstrate common use cases and best practices.

## UI Pattern Components

### DataTable Example

The DataTable component is used for displaying tabular data with search, pagination, and customizable columns.

```tsx
import { DataTable } from '@/components/ui/patterns';
import { StatusBadge } from '@/components/ui/patterns';
import { useNavigate } from 'react-router-dom';

function ClientList() {
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClientsData();
  
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (client) => <StatusBadge status={client.status} />,
    },
  ];

  return (
    <DataTable
      data={clients}
      columns={columns}
      keyExtractor={(client) => client.id}
      searchable
      pagination
      pageSize={10}
      onRowClick={(client) => navigate(`/clients/${client.id}`)}
      isLoading={isLoading}
      emptyState={<p>No clients found.</p>}
    />
  );
}
```

### FormSection Example

The FormSection component is used for creating consistent form sections with optional collapsible functionality.

```tsx
import { FormSection, FormRow, FormGroup } from '@/components/ui/patterns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Mail } from 'lucide-react';

function ClientForm() {
  return (
    <form>
      <FormSection 
        title="Personal Information" 
        description="Enter client's personal details"
        icon={User}
        required
      >
        <FormGroup>
          <FormRow>
            <Input label="First Name" />
            <Input label="Last Name" />
          </FormRow>
          <FormRow>
            <Input label="Email" type="email" icon={Mail} />
            <Input label="Phone" type="tel" icon={Phone} />
          </FormRow>
        </FormGroup>
      </FormSection>
      
      <FormSection 
        title="Additional Notes" 
        collapsible
        defaultCollapsed
      >
        <Textarea placeholder="Enter any additional notes about the client" />
      </FormSection>
    </form>
  );
}
```

### InfoCard Example

The InfoCard component is used for displaying information cards with consistent styling.

```tsx
import { InfoCard, InfoCardItem, InfoCardGroup } from '@/components/ui/patterns';
import { User, Mail, Phone, Edit, Trash } from 'lucide-react';

function ClientProfile({ client }) {
  return (
    <InfoCardGroup columns={2} gap="md">
      <InfoCard
        title={client.name}
        description="Client Information"
        icon={User}
        actions={[
          {
            label: 'Edit',
            icon: Edit,
            onClick: () => handleEdit(client.id),
          },
          {
            label: 'Delete',
            icon: Trash,
            onClick: () => handleDelete(client.id),
            destructive: true,
          },
        ]}
      >
        <div className="space-y-2">
          <InfoCardItem
            label="Email"
            value={client.email}
            icon={Mail}
          />
          <InfoCardItem
            label="Phone"
            value={client.phone}
            icon={Phone}
          />
        </div>
      </InfoCard>
      
      <InfoCard
        title="Appointment History"
        interactive
        onClick={() => viewAppointmentHistory(client.id)}
      >
        <p>Click to view appointment history</p>
      </InfoCard>
    </InfoCardGroup>
  );
}
```

### ActionBar Example

The ActionBar component is used for displaying action buttons in a consistent layout.

```tsx
import { ActionBar } from '@/components/ui/patterns';
import { Save, ArrowLeft, Send } from 'lucide-react';

function FormWithActions({ onSave, onBack, onSubmit }) {
  return (
    <div className="space-y-4">
      {/* Form content */}
      
      <ActionBar
        actions={[
          {
            label: 'Back',
            icon: ArrowLeft,
            onClick: onBack,
            variant: 'outline',
          },
          {
            label: 'Save Draft',
            icon: Save,
            onClick: onSave,
            variant: 'secondary',
          },
          {
            label: 'Submit',
            icon: Send,
            onClick: onSubmit,
            variant: 'default',
          },
        ]}
        position="bottom"
        alignment="end"
        separated
      />
    </div>
  );
}
```

### StatusBadge Example

The StatusBadge component is used for displaying status indicators with consistent styling.

```tsx
import { 
  StatusBadge, 
  SuccessBadge, 
  PendingBadge 
} from '@/components/ui/patterns';

function AppointmentStatus({ status }) {
  // Using the main component with dynamic status
  return <StatusBadge status={status} />;
}

function AppointmentList({ appointments }) {
  return (
    <ul>
      {appointments.map(appointment => (
        <li key={appointment.id}>
          {appointment.title}
          {appointment.status === 'completed' && <SuccessBadge />}
          {appointment.status === 'scheduled' && <PendingBadge label="Upcoming" />}
        </li>
      ))}
    </ul>
  );
}
```

## Other Components

### VideoChat Example

The VideoChat component is used for embedding a video chat session.

```tsx
import { useState } from 'react';
import VideoChat from '@/components/video/VideoChat';
import { Button } from '@/components/ui/button';

function AppointmentView({ appointment }) {
  const [isVideoChatOpen, setIsVideoChatOpen] = useState(false);
  
  return (
    <div>
      <h2>{appointment.title}</h2>
      <p>Time: {appointment.time}</p>
      
      <Button onClick={() => setIsVideoChatOpen(true)}>
        Join Video Session
      </Button>
      
      <VideoChat
        roomUrl={appointment.videoRoomUrl}
        isOpen={isVideoChatOpen}
        onClose={() => setIsVideoChatOpen(false)}
      />
    </div>
  );
}
```

### Textarea Example

The Textarea component is an enhanced textarea with auto-resize functionality.

```tsx
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

function NoteEditor() {
  const [note, setNote] = useState('');
  
  return (
    <div className="space-y-4">
      <h3>Session Notes</h3>
      <Textarea
        placeholder="Enter your session notes here..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[200px]"
      />
      <Button onClick={() => saveNote(note)}>Save Notes</Button>
    </div>
  );
}
```

### TimeInput and TimePickerInput Example

The TimeInput and TimePickerInput components are used for time selection.

```tsx
import { useState } from 'react';
import { TimeInput } from '@/components/ui/time-input';
import { TimePickerInput } from '@/components/ui/time-picker';
import { Button } from '@/components/ui/button';

function AppointmentScheduler() {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  
  return (
    <div className="space-y-4">
      <h3>Schedule Appointment</h3>
      
      <div className="space-y-2">
        <TimeInput
          label="Start Time"
          value={startTime}
          onChange={setStartTime}
        />
        
        <TimePickerInput
          value={endTime}
          onChange={setEndTime}
          min="09:00"
          max="17:00"
          step={15 * 60} // 15-minute intervals
          placeholder="Select end time"
        />
      </div>
      
      <Button onClick={() => scheduleAppointment(startTime, endTime)}>
        Schedule
      </Button>
    </div>
  );
}
```

## Context and Hooks

### UserContext Example

The UserContext provides user authentication and profile information throughout the application.

```tsx
import { useUser } from '@/context/UserContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const { userRole, isLoading, userId } = useUser();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!userId) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

// Usage
function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/clinician-dashboard" 
          element={
            <ProtectedRoute requiredRole="clinician">
              <ClinicianDashboard />
            </ProtectedRoute>
          } 
        />
        {/* Other routes */}
      </Routes>
    </UserProvider>
  );
}
```

### useCalendarState Example

The useCalendarState hook manages calendar state including clinician selection, client data, and timezone handling.

```tsx
import { useCalendarState } from '@/hooks/useCalendarState';
import { Select } from '@/components/ui/select';
import CalendarView from '@/components/CalendarView';

function ClinicianCalendar() {
  const {
    selectedClinicianId,
    setSelectedClinicianId,
    clinicians,
    clients,
    timeZone,
    refreshAppointments
  } = useCalendarState();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2>Calendar</h2>
        <Select
          value={selectedClinicianId || ''}
          onChange={(e) => setSelectedClinicianId(e.target.value || null)}
        >
          {clinicians.map(clinician => (
            <option key={clinician.id} value={clinician.id}>
              {clinician.clinician_professional_name}
            </option>
          ))}
        </Select>
      </div>
      
      <CalendarView
        clinicianId={selectedClinicianId}
        clients={clients}
        timeZone={timeZone}
        onAppointmentChange={refreshAppointments}
      />
    </div>
  );
}
```

### TimeZoneService Example

The TimeZoneService provides utilities for handling timezones throughout the application.

```tsx
import { TimeZoneService } from '@/utils/timezone';

function AppointmentDisplay({ appointment }) {
  const userTimeZone = TimeZoneService.getUserTimeZone();
  
  // Convert appointment time from UTC to user's timezone
  const localStartTime = TimeZoneService.fromUTC(
    appointment.startTime,
    userTimeZone
  );
  
  // Format the time for display
  const formattedTime = TimeZoneService.formatDateTime(
    localStartTime,
    'full'
  );
  
  return (
    <div>
      <h3>{appointment.title}</h3>
      <p>Time: {formattedTime}</p>
      <p>Timezone: {TimeZoneService.formatTimeZoneDisplay(userTimeZone)}</p>
    </div>
  );
}
```

## Best Practices

1. **Use UI Pattern Components**: Prefer using the UI pattern components over creating custom UI elements to maintain consistency.

2. **Follow Documentation Standards**: When creating new components, follow the documentation standard defined in the ComponentDocumentationGuide.md.

3. **Leverage Contexts and Hooks**: Use the provided contexts and hooks to access shared state and functionality.

4. **Handle Timezones Properly**: Always use the TimeZoneService for timezone-related operations to ensure consistent handling across the application.

5. **Composition Over Customization**: Compose complex UI patterns by combining existing components rather than creating new ones or heavily customizing existing ones.