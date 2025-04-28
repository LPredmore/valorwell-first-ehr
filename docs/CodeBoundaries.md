# Code Boundaries

This document outlines the boundaries between different parts of the application to help prevent changes in one area from affecting others.

## Clinician vs. Patient Functionality

### Clinician-Facing Code

The following directories and files contain code that is specific to the clinician experience:

```
src/pages/
  - Calendar.tsx
  - ClinicianDashboard.tsx
  - Clients.tsx
  - MyClients.tsx

src/components/calendar/
  - All calendar-related components

src/services/calendar/
  - All calendar-related services

packages/core/hooks/sessionNote/
  - All session note hooks
```

When making changes to clinician-facing code:
- Keep all clinician-specific logic in these files
- Don't mix clinician and patient concerns
- Use the core package for shared functionality

### Patient-Facing Code

The following directories and files contain code that is specific to the patient experience:

```
src/pages/
  - PatientDashboard.tsx
  - PatientDocuments.tsx
  - PatientProfile.tsx

src/components/patient/
  - All patient-related components
```

When making changes to patient-facing code:
- Keep all patient-specific logic in these files
- Don't mix patient and clinician concerns
- Use the core package for shared functionality

## Shared Code

The following directories contain code that is shared between clinician and patient functionality:

```
packages/core/
  - API clients
  - Shared hooks
  - Type definitions
  - Utility functions

src/components/ui/
  - Reusable UI components

src/utils/
  - Utility functions (should eventually be moved to core)
```

When making changes to shared code:
- Consider the impact on both clinician and patient functionality
- Add comprehensive tests
- Document any breaking changes

## Best Practices for Maintaining Boundaries

1. **Use clear imports**:
   ```typescript
   // Good - Clear where the code is coming from
   import { Button } from "@/components/ui/button";
   import { useSessionNoteState } from "@valorwell/core/hooks/sessionNote";
   
   // Bad - Unclear, could be mixing concerns
   import { Button, useSessionNoteState } from "@/utils";
   ```

2. **Add comments to indicate boundaries**:
   ```typescript
   // CLINICIAN-ONLY: This component is only used in the clinician experience
   export function AppointmentCalendar() {
     // ...
   }
   ```

3. **Use feature folders**:
   ```
   src/features/
     - clientHistory/
     - calendar/
     - billing/
   ```

4. **Document dependencies**:
   ```typescript
   /**
    * @file CalendarService.ts
    * @description Calendar service for clinician appointments
    * @dependencies
    * - TimeZoneService
    * - AvailabilityService
    */
   ```

By following these guidelines, we can maintain clear boundaries between different parts of the application, making it easier to work on one area without affecting others.