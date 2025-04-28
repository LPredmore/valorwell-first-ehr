# State Management Guide

## Overview

This document outlines the standardized state management approach for the Valorwell First EHR application. Following these guidelines will ensure consistency across the codebase, improve maintainability, and reduce bugs related to state management.

## Core Principles

1. **Separation of Concerns**: Separate UI state from data state
2. **Predictable State Updates**: Use immutable state updates and avoid direct mutations
3. **Consistent Patterns**: Follow the same patterns across the application
4. **Performance Optimization**: Minimize re-renders and optimize state updates
5. **Type Safety**: Leverage TypeScript for type-safe state management

## State Management Architecture

Our application uses a hybrid approach with three main patterns:

### 1. Context-based Global State

For global application state that needs to be accessed by multiple components across the application, we use React Context with a standardized pattern:

```tsx
// Context definition with initial state and types
const MyContext = createContext<MyContextState | undefined>(undefined);

// Provider component with state management logic
export const MyProvider: React.FC<ProviderProps> = ({ children }) => {
  // State management logic here
  
  const contextValue = {
    // State values and actions
  };
  
  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};

// Custom hook for consuming the context
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within a MyProvider');
  }
  return context;
};
```

### 2. Entity State Hooks

For managing entity data (clients, appointments, etc.), we use the `useEntityState` hook:

```tsx
const { 
  data,
  isLoading,
  error,
  create,
  update,
  remove,
  refresh
} = useEntityState({
  entityType: 'clients',
  initialQuery: { clinicianId: '123' }
});
```

### 3. Form State Management

For managing form state, we use the `useFormState` hook:

```tsx
const {
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  setFieldValue,
  resetForm
} = useFormState({
  initialValues,
  validationSchema,
  onSubmit
});
```

### 4. Async Operation State

For handling asynchronous operations, we use the `useAsyncState` hook:

```tsx
const {
  data,
  isLoading,
  error,
  execute,
  reset
} = useAsyncState({
  asyncFunction,
  immediate: true,
  initialData: null
});
```

## Best Practices

### When to Use Each Pattern

1. **Context-based Global State**:
   - User authentication and profile data
   - Application-wide settings and preferences
   - Theme and UI configuration
   - Feature flags and permissions

2. **Entity State Hooks**:
   - Client data management
   - Appointment and calendar data
   - Medical records and session notes
   - Any entity that requires CRUD operations

3. **Form State Management**:
   - Any form with validation requirements
   - Multi-step forms
   - Forms with complex state dependencies

4. **Async Operation State**:
   - API calls
   - Data fetching
   - Background processing
   - Any operation that may take time to complete

### Performance Optimization

1. **Memoization**:
   - Use `useMemo` for expensive computations
   - Use `useCallback` for functions passed as props
   - Memoize context values to prevent unnecessary re-renders

2. **State Splitting**:
   - Split large state objects into smaller, focused pieces
   - Use multiple contexts instead of one large context
   - Create specialized context providers for specific features (e.g., DialogContext for managing dialog state)

3. **Selective Updates**:
   - Update only the parts of state that have changed
   - Use immutable update patterns

### Error Handling

1. **Consistent Error State**:
   - All state hooks should include error handling
   - Errors should be typed and structured consistently

2. **Error Recovery**:
   - Provide mechanisms to retry failed operations
   - Include clear error messages for users

### Testing

1. **Mock Providers**:
   - Create test providers that wrap components under test
   - Provide controlled test data through context

2. **Hook Testing**:
   - Test hooks in isolation using `renderHook`
   - Verify state updates and side effects

## Migration Strategy

When migrating existing code to the new state management patterns:

1. Identify the type of state being managed
2. Choose the appropriate pattern from the guide
3. Refactor the component to use the new pattern
4. Ensure backward compatibility during transition
5. Update tests to reflect the new implementation
6. Document any breaking changes

## Examples

See the following files for reference implementations:

- `src/context/UserContext.tsx` - Context-based global state
- `src/context/DialogContext.tsx` - Enhanced dialog state management
- `src/context/FormContext.tsx` - Form state management
- `src/hooks/useEntityState.ts` - Entity state management
- `src/hooks/useFormState.ts` - Form state management
- `src/hooks/useAsyncState.ts` - Async operation state

## Implementation Examples

### Using Context-based Global State

```tsx
// In a component that needs calendar data
import { useCalendar } from '@/context/CalendarContext';

const CalendarView = () => {
  const {
    events,
    isLoading,
    error,
    refreshEvents,
    createEvent
  } = useCalendar();
  
  // Use the calendar state and actions
  return (
    <div>
      {isLoading ? (
        <p>Loading events...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <EventList events={events} onRefresh={refreshEvents} />
      )}
      
      <button onClick={() => createEvent(newEvent)}>
        Create Event
      </button>
    </div>
  );
};
```

### Using Entity State Hook

```tsx
// In a component that manages client data
import { useEntityState } from '@/hooks/useEntityState';

const ClientList = ({ clinicianId }) => {
  const {
    data: clients,
    isLoading,
    error,
    create: createClient,
    update: updateClient,
    remove: removeClient
  } = useEntityState({
    entityType: 'clients',
    initialQuery: { client_assigned_therapist: clinicianId },
    orderBy: { column: 'client_last_name', ascending: true }
  });
  
  // Use the entity state and actions
  return (
    <div>
      {isLoading ? (
        <p>Loading clients...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <ul>
          {clients.map(client => (
            <li key={client.id}>
              {client.name}
              <button onClick={() => updateClient(client.id, { active: true })}>
                Activate
              </button>
              <button onClick={() => removeClient(client.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      
      <button onClick={() => createClient({ name: 'New Client', email: 'client@example.com' })}>
        Add Client
      </button>
    </div>
  );
};
```

### Using Form State Hook

```tsx
// In a form component
import { useFormState } from '@/hooks/useFormState';

const validationSchema = {
  validate: (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email) errors.email = 'Email is required';
    return errors;
  }
};

const ClientForm = ({ onSubmit, initialData }) => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    isValid
  } = useFormState({
    initialValues: initialData || { name: '', email: '' },
    validationSchema,
    onSubmit: async (values) => {
      await onSubmit(values);
    }
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
        />
        {touched.name && errors.name && (
          <div className="error">{errors.name}</div>
        )}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
        />
        {touched.email && errors.email && (
          <div className="error">{errors.email}</div>
        )}
      </div>
      
      <button type="submit" disabled={isSubmitting || !isValid}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### Using Async State Hook

```tsx
// In a component that fetches data
import { useAsyncState } from '@/hooks/useAsyncState';

const fetchUserData = async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user data');
  return response.json();
};

const UserProfile = ({ userId }) => {
  const {
    data: user,
    isLoading,
    error,
    execute: fetchUser,
    reset
  } = useAsyncState({
    asyncFunction: () => fetchUserData(userId),
    immediate: true
  });
  
  return (
    <div>
      {isLoading ? (
        <p>Loading user data...</p>
      ) : error ? (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={fetchUser}>Retry</button>
        </div>
      ) : user ? (
        <div>
          <h2>{user.name}</h2>
          <p>Email: {user.email}</p>
          <button onClick={reset}>Reset</button>
        </div>
      ) : (
        <p>No user data available</p>
      )}
    </div>
  );
};
```

## Reducing Prop Drilling

Prop drilling occurs when props need to be passed through multiple levels of components. This can make code harder to maintain and understand. Here are strategies to reduce prop drilling:

### Using Context for Dialog State

Instead of passing dialog state through multiple components, use a context provider:

```tsx
// Before: Prop drilling through multiple components
<Calendar>
  <CalendarHeader onSettingsClick={openSettings} />
  <SettingsDialog isOpen={isSettingsOpen} onClose={closeSettings} />
</Calendar>

// After: Using DialogContext
// In App.tsx
<DialogProvider>
  <Calendar />
</DialogProvider>

// In CalendarHeader.tsx
const { openAvailabilitySettings } = useDialogs();
<button onClick={openAvailabilitySettings}>Settings</button>

// In SettingsDialog.tsx
const { state, closeDialog } = useDialogs();
const isOpen = state.type === 'availabilitySettings';
<Dialog open={isOpen} onOpenChange={closeDialog}>
```

### Using Form Context for Form State

Instead of passing form state and handlers through components, use a form context:

```tsx
// Before: Prop drilling form state
<Form
  values={values}
  errors={errors}
  onChange={handleChange}
  onSubmit={handleSubmit}
>
  <FormField
    name="email"
    value={values.email}
    error={errors.email}
    onChange={handleChange}
  />
</Form>

// After: Using FormContext
<FormProvider
  initialValues={{ email: '' }}
  validationSchema={emailSchema}
  onSubmit={handleSubmit}
>
  <Form>
    <FormField name="email" />
  </Form>
</FormProvider>

// In FormField.tsx
const { values, errors, handleChange } = useForm();
<input
  value={values[name]}
  onChange={(e) => handleChange(name, e.target.value)}
  error={errors[name]}
/>
```

### Benefits of Reducing Prop Drilling

1. **Improved Readability**: Components have cleaner props interfaces
2. **Better Maintainability**: Changes to state structure only need to be made in the context, not in every component
3. **Easier Testing**: Components can be tested in isolation by mocking the context
4. **Simplified Component API**: Components don't need to accept and pass along props they don't directly use

## Dialog Management System

The application uses a centralized dialog management system to handle all dialogs in a consistent way. This system provides several benefits:

1. **Centralized Dialog State**: All dialog state is managed in one place
2. **Dialog Stacking**: Support for opening multiple dialogs and navigating between them
3. **Dialog History**: Track dialog navigation history for back/forward navigation
4. **Simplified Dialog Components**: Dialog components can focus on rendering content rather than managing state

### Using the Dialog Management System

The dialog management system consists of two main components:

1. **DialogContext**: Provides the state and actions for managing dialogs
2. **DialogManager**: Renders the appropriate dialog based on the current state

#### Opening and Closing Dialogs

```tsx
// Import the useDialogs hook
import { useDialogs } from '@/context/DialogContext';

// In your component
const { openDialog, closeDialog } = useDialogs();

// Open a dialog with props
const handleOpenDialog = () => {
  openDialog('appointment', {
    clients,
    selectedClinicianId,
    onAppointmentCreated: handleRefresh
  });
};

// Close the current dialog
const handleCloseDialog = () => {
  closeDialog();
};
```

#### Dialog Stacking

The dialog system supports stacking dialogs on top of each other:

```tsx
// Push a new dialog onto the stack
const { pushDialog, popDialog } = useDialogs();

// Open a dialog on top of the current one
const handlePushDialog = () => {
  pushDialog('confirmationDialog', { message: 'Are you sure?' });
};

// Go back to the previous dialog
const handlePopDialog = () => {
  popDialog();
};
```

#### Creating a Dialog Component

Dialog components should be designed to work with the dialog management system:

```tsx
import { useDialogs } from '@/context/DialogContext';

interface MyDialogProps {
  // Props specific to this dialog
  data: any;
  onConfirm: () => void;
}

const MyDialog: React.FC<MyDialogProps> = ({ data, onConfirm }) => {
  const { state, closeDialog } = useDialogs();
  const isOpen = state.type === 'myDialog';

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My Dialog</DialogTitle>
        </DialogHeader>
        <div>
          {/* Dialog content */}
        </div>
        <DialogFooter>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={() => { onConfirm(); closeDialog(); }}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

#### Registering a Dialog in DialogManager

To make your dialog available in the system, add it to the DialogManager component:

```tsx
// In DialogManager.tsx
const renderDialog = () => {
  switch (type) {
    // ... other cases
    case 'myDialog':
      return (
        <MyDialog
          data={props.data}
          onConfirm={props.onConfirm || (() => {})}
        />
      );
    // ... other cases
  }
};
```

### Benefits of the Dialog Management System

1. **Reduced Prop Drilling**: No need to pass dialog state through multiple components
2. **Consistent Dialog Behavior**: All dialogs follow the same patterns for opening, closing, and navigation
3. **Improved Code Organization**: Dialog-related code is centralized and easier to maintain
4. **Better User Experience**: Support for dialog stacking and history navigation