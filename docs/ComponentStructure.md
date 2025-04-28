# Component Structure Documentation

## Calendar Component Refactoring

This document outlines the component structure after refactoring the large WeeklyAvailabilityDialog component into smaller, more focused components.

### Component Hierarchy

```
WeeklyAvailabilityDialog
├── DayTabs
│   ├── AvailabilitySlotList
│   └── AvailabilityForm
└── DeleteConfirmationDialog
```

### Component Responsibilities

#### WeeklyAvailabilityDialog

The main container component that:
- Manages the dialog state (open/close)
- Handles data fetching through the useAvailability hook
- Coordinates between child components
- Manages shared state (active tab, form errors, etc.)
- Handles API interactions (creating/deleting slots)

**Props:**
- `clinicianId`: The ID of the clinician whose availability is being managed
- `onAvailabilityUpdated`: Callback function when availability is updated
- `permissionLevel`: The user's permission level ('full', 'limited', 'none')

#### DayTabs

A component that provides a tabbed interface for viewing and managing availability for each day of the week.

**Props:**
- `activeTab`: The currently active day tab
- `onTabChange`: Callback when the active tab changes
- `weeklyAvailability`: The availability data for each day
- `timeZone`: The user's timezone
- `onDeleteSlot`: Callback when a slot is deleted
- `onAddSlot`: Callback when a new slot is added
- `isSubmitting`: Whether a submission is in progress
- `formError`: Any error message to display
- `retryCount`: Number of retry attempts
- `permissionLevel`: The user's permission level

#### AvailabilitySlotList

A component for rendering a list of availability slots for a specific day.

**Props:**
- `slots`: Array of availability slots to display
- `timeZone`: The user's timezone
- `onDeleteSlot`: Callback when a slot is deleted
- `permissionLevel`: The user's permission level

#### AvailabilityForm

A component for adding new availability slots.

**Props:**
- `day`: The day of week for the form
- `onAddSlot`: Callback when a new slot is added
- `isSubmitting`: Whether a submission is in progress
- `formError`: Any error message to display
- `retryCount`: Number of retry attempts
- `timeZone`: The user's timezone
- `permissionLevel`: The user's permission level

#### DeleteConfirmationDialog

A confirmation dialog for deleting availability slots.

**Props:**
- `isOpen`: Whether the dialog is open
- `onOpenChange`: Callback when the dialog open state changes
- `onConfirm`: Callback when deletion is confirmed
- `isRecurring`: Whether the slot being deleted is recurring
- `isSubmitting`: Whether a submission is in progress

### Benefits of the Refactored Structure

1. **Improved Maintainability**
   - Each component has a single responsibility
   - Easier to understand and modify individual components
   - Reduced cognitive load when working with the codebase

2. **Better Testability**
   - Components can be tested in isolation
   - Easier to mock dependencies
   - More focused test cases

3. **Enhanced Reusability**
   - Components like AvailabilitySlotList and AvailabilityForm can be reused in other parts of the application
   - Consistent UI patterns across the application

4. **Clearer Data Flow**
   - Props clearly define the data requirements for each component
   - State management is more predictable
   - Easier to trace the flow of data through the component tree

### Best Practices for Component Organization

1. **Single Responsibility Principle**
   - Each component should have a single responsibility
   - If a component is doing too much, consider breaking it down further

2. **Consistent Naming Conventions**
   - Use descriptive names that reflect the component's purpose
   - Follow a consistent pattern (e.g., PascalCase for components)

3. **Proper Documentation**
   - Document the purpose and props of each component
   - Include examples of usage where appropriate

4. **Logical File Structure**
   - Group related components together
   - Consider organizing by feature rather than by component type

5. **Prop Type Definitions**
   - Define clear interfaces for component props
   - Use descriptive names and add comments for clarity

6. **State Management**
   - Keep state as close as possible to where it's used
   - Lift state up only when necessary
   - Consider using context for deeply nested components

By following these principles, we maintain a clean, maintainable, and scalable component structure that improves developer experience and code quality.