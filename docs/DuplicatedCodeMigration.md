# Duplicated Code Migration Plan

This document outlines the plan for removing duplicated code and consolidating it in the core package.

## Session Note Hooks

### Current Status

The following hooks exist in both locations:
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

### Migration Steps

1. ✅ Add documentation to the core package hooks
2. ✅ Create a proper index.ts file for the core package hooks
3. ✅ Create a README.md file for the core package
4. 🔲 Remove the duplicated hooks from the src directory:
   - `src/hooks/useSessionNoteState.tsx`
   - `src/hooks/useSessionNoteSave.tsx`
   - `src/hooks/useSessionNoteValidation.tsx`
5. 🔲 Fix any TypeScript errors in the core package

## TypeScript Configuration

The core package has TypeScript errors related to missing React types. This should be addressed by:

1. 🔲 Ensure React is properly listed as a dependency in packages/core/package.json
2. 🔲 Update the tsconfig.json file to properly resolve types

## Next Steps for Code Organization

After addressing the session note hooks duplication, the following areas should be considered for similar treatment:

1. 🔲 Timezone utilities
2. 🔲 Error handling utilities
3. 🔲 Calendar-related functionality

## Testing Plan

After making these changes, the following should be tested:

1. 🔲 Session note creation and editing
2. 🔲 Form validation
3. 🔲 Saving session notes to the database

## Rollback Plan

If issues are encountered:

1. 🔲 Restore the removed files from version control
2. 🔲 Update imports to use the src directory hooks