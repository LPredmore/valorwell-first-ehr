# UI Component Library

This document provides an overview of the UI component library created to standardize common UI patterns across the Valorwell First EHR application.

## Overview

The UI component library addresses the issue of duplicated UI patterns across the application by providing reusable, consistent components for common UI elements. This improves maintainability, ensures visual consistency, and speeds up development.

The library is located in `src/components/ui/patterns/` and includes the following components:

1. **DataTable** - For displaying tabular data with search, pagination, and row actions
2. **FormSection** - For creating consistent form sections with collapsible functionality
3. **StatusBadge** - For displaying status indicators with consistent styling
4. **ActionBar** - For displaying action buttons in a consistent layout
5. **InfoCard** - For displaying information cards with consistent styling

## Components

### DataTable

A flexible data table component that supports searching, pagination, and customizable columns.

```tsx
import { DataTable } from '@/components/ui/patterns';

// Define columns
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
    cell: (item) => <StatusBadge status={item.status} />,
  },
];

// Use the component
<DataTable
  data={clients}
  columns={columns}
  keyExtractor={(item) => item.id}
  searchable
  pagination
  pageSize={10}
  onRowClick={(item) => handleRowClick(item)}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Array of data items to display |
| `columns` | `Column<T>[]` | Array of column definitions |
| `keyExtractor` | `(item: T) => string \| number` | Function to extract a unique key from each item |
| `onRowClick` | `(item: T) => void` | Optional callback when a row is clicked |
| `searchable` | `boolean` | Whether to show a search input |
| `searchPlaceholder` | `string` | Placeholder text for the search input |
| `pagination` | `boolean` | Whether to enable pagination |
| `pageSize` | `number` | Number of items per page |
| `className` | `string` | Additional CSS classes |
| `emptyState` | `React.ReactNode` | Custom empty state content |
| `isLoading` | `boolean` | Whether the data is loading |

### FormSection

A component for creating consistent form sections with optional collapsible functionality.

```tsx
import { FormSection, FormRow, FormGroup } from '@/components/ui/patterns';
import { User } from 'lucide-react';

<FormSection 
  title="Personal Information" 
  description="Enter your personal details"
  icon={User}
  collapsible
>
  <FormGroup>
    <FormRow>
      <Input label="First Name" />
      <Input label="Last Name" />
    </FormRow>
    <FormRow>
      <Input label="Email" />
      <Input label="Phone" />
    </FormRow>
  </FormGroup>
</FormSection>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Section title |
| `description` | `string` | Optional description |
| `icon` | `LucideIcon` | Optional icon |
| `children` | `React.ReactNode` | Form content |
| `footer` | `React.ReactNode` | Optional footer content |
| `className` | `string` | Additional CSS classes |
| `headerClassName` | `string` | Additional CSS classes for the header |
| `contentClassName` | `string` | Additional CSS classes for the content |
| `footerClassName` | `string` | Additional CSS classes for the footer |
| `collapsible` | `boolean` | Whether the section can be collapsed |
| `defaultCollapsed` | `boolean` | Whether the section is collapsed by default |
| `required` | `boolean` | Whether the section is required |
| `disabled` | `boolean` | Whether the section is disabled |

### StatusBadge

A component for displaying status indicators with consistent styling.

```tsx
import { 
  StatusBadge, 
  SuccessBadge, 
  PendingBadge 
} from '@/components/ui/patterns';

// Using the main component
<StatusBadge status="success" />

// Using convenience components
<SuccessBadge />
<PendingBadge label="In Review" />
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `status` | `StatusType` | Status type (success, pending, warning, error, etc.) |
| `label` | `string` | Optional custom label |
| `icon` | `React.ReactNode` | Optional custom icon |
| `className` | `string` | Additional CSS classes |
| `variant` | `'default' \| 'outline' \| 'secondary'` | Badge variant |
| `size` | `'default' \| 'sm' \| 'lg'` | Badge size |
| `iconOnly` | `boolean` | Whether to show only the icon |

### ActionBar

A component for displaying action buttons in a consistent layout.

```tsx
import { ActionBar } from '@/components/ui/patterns';
import { Save, Delete, Copy } from 'lucide-react';

<ActionBar
  actions={[
    {
      label: 'Save',
      icon: Save,
      onClick: handleSave,
      variant: 'default',
    },
    {
      label: 'Delete',
      icon: Delete,
      onClick: handleDelete,
      destructive: true,
    },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: handleDuplicate,
      variant: 'outline',
    },
  ]}
  position="bottom"
  alignment="end"
  separated
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `actions` | `ActionItem[]` | Array of action items |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | Position of the action bar |
| `className` | `string` | Additional CSS classes |
| `separated` | `boolean` | Whether to show separators between actions |
| `fullWidth` | `boolean` | Whether buttons should take full width |
| `alignment` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | Alignment of the actions |
| `responsive` | `boolean` | Whether to adjust layout on small screens |
| `wrapActions` | `boolean` | Whether to wrap actions to multiple lines |
| `sticky` | `boolean` | Whether the action bar should stick to its position |

### InfoCard

A component for displaying information cards with consistent styling.

```tsx
import { InfoCard, InfoCardItem, InfoCardGroup } from '@/components/ui/patterns';
import { User, Mail, Phone, Edit, Trash } from 'lucide-react';

<InfoCard
  title="John Doe"
  description="Client Information"
  icon={User}
  actions={[
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEdit,
    },
    {
      label: 'Delete',
      icon: Trash,
      onClick: handleDelete,
      destructive: true,
    },
  ]}
>
  <div className="space-y-2">
    <InfoCardItem
      label="Email"
      value="john.doe@example.com"
      icon={Mail}
    />
    <InfoCardItem
      label="Phone"
      value="(123) 456-7890"
      icon={Phone}
    />
  </div>
</InfoCard>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card title |
| `description` | `string` | Optional description |
| `icon` | `LucideIcon` | Optional icon |
| `children` | `React.ReactNode` | Card content |
| `footer` | `React.ReactNode` | Optional footer content |
| `className` | `string` | Additional CSS classes |
| `headerClassName` | `string` | Additional CSS classes for the header |
| `contentClassName` | `string` | Additional CSS classes for the content |
| `footerClassName` | `string` | Additional CSS classes for the footer |
| `actions` | `InfoCardAction[]` | Array of action items |
| `status` | `React.ReactNode` | Optional status indicator |
| `onClick` | `() => void` | Optional click handler |
| `interactive` | `boolean` | Whether the card is interactive |
| `bordered` | `boolean` | Whether to show a border |
| `elevated` | `boolean` | Whether to show a shadow |

## Usage Examples

### Example 1: Client List with DataTable

```tsx
import { DataTable } from '@/components/ui/patterns';
import { StatusBadge } from '@/components/ui/patterns';

const ClientList = ({ clients }) => {
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
    />
  );
};
```

### Example 2: Appointment Card with InfoCard

```tsx
import { InfoCard, InfoCardItem } from '@/components/ui/patterns';
import { Calendar, Clock, User } from 'lucide-react';

const AppointmentCard = ({ appointment }) => {
  return (
    <InfoCard
      title={appointment.title}
      icon={Calendar}
      actions={[
        {
          label: 'Start Session',
          onClick: () => startSession(appointment.id),
          variant: 'default',
        },
        {
          label: 'Reschedule',
          onClick: () => openRescheduleDialog(appointment.id),
          variant: 'outline',
        },
      ]}
    >
      <div className="space-y-2">
        <InfoCardItem
          label="Date"
          value={formatDate(appointment.date)}
          icon={Calendar}
        />
        <InfoCardItem
          label="Time"
          value={`${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`}
          icon={Clock}
        />
        <InfoCardItem
          label="Client"
          value={appointment.clientName}
          icon={User}
        />
      </div>
    </InfoCard>
  );
};
```

### Example 3: Form with FormSection

```tsx
import { FormSection, FormRow, FormGroup } from '@/components/ui/patterns';
import { User, Clipboard, CreditCard } from 'lucide-react';

const ClientForm = ({ form }) => {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormSection
        title="Personal Information"
        description="Enter client's personal details"
        icon={User}
        required
      >
        <FormGroup>
          <FormRow>
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormRow>
        </FormGroup>
      </FormSection>
      
      <FormSection
        title="Insurance Information"
        icon={CreditCard}
        collapsible
      >
        {/* Insurance form fields */}
      </FormSection>
      
      <FormSection
        title="Medical History"
        icon={Clipboard}
        collapsible
        defaultCollapsed
      >
        {/* Medical history form fields */}
      </FormSection>
      
      <ActionBar
        actions={[
          {
            label: 'Save',
            onClick: form.handleSubmit(onSubmit),
            variant: 'default',
          },
          {
            label: 'Cancel',
            onClick: onCancel,
            variant: 'outline',
          },
        ]}
        position="bottom"
        alignment="end"
      />
    </form>
  );
};
```

## Best Practices

1. **Consistency**: Use these components consistently throughout the application to maintain a unified look and feel.

2. **Composition**: Compose complex UI patterns by combining these components rather than creating new ones.

3. **Customization**: Use the provided props to customize the components rather than overriding their styles directly.

4. **Accessibility**: These components are designed with accessibility in mind. Maintain this by providing appropriate labels, descriptions, and ARIA attributes.

5. **Responsive Design**: The components are responsive by default. Use the provided props to adjust their behavior on different screen sizes.

## Benefits

- **Reduced Duplication**: Eliminates duplicated UI code across the application
- **Consistent UI**: Ensures a consistent look and feel throughout the application
- **Improved Maintainability**: Makes it easier to update UI patterns in one place
- **Faster Development**: Speeds up development by providing ready-to-use components
- **Better Accessibility**: Ensures consistent accessibility practices across the application