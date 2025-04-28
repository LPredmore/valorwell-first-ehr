# Code Organization Map

## Duplicated Code

### Session Note Hooks
These hooks exist in both locations:
- `src/hooks/useSessionNoteState.tsx`
- `src/hooks/useSessionNoteSave.tsx`
- `src/hooks/useSessionNoteValidation.tsx`

AND

- `packages/core/hooks/sessionNote/useSessionNoteState.tsx`
- `packages/core/hooks/sessionNote/useSessionNoteSave.tsx`
- `packages/core/hooks/sessionNote/useSessionNoteValidation.tsx`

The application is already importing from the core package in some places:
```typescript
import { 
  useSessionNoteState, 
  useSessionNoteValidation,
  useSessionNoteSave 
} from '@/packages/core/hooks/sessionNote';
```

## Code Boundaries

### Clinician-Facing Features
- Calendar functionality: `src/services/calendar/*`, `src/components/calendar/*`
- Session notes: `src/hooks/useSessionNote*`, `src/packages/core/hooks/sessionNote/*`

### Patient-Facing Features
- Patient dashboard: `src/pages/PatientDashboard.tsx`
- Patient documents: `src/pages/PatientDocuments.tsx`

### Shared Code
- Authentication: `src/components/auth/*`
- Timezone handling: `src/utils/timezone/*`, `src/context/TimeZoneContext.tsx`