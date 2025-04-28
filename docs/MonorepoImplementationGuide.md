# Monorepo Implementation Guide for Valorwell First EHR

This guide provides practical, step-by-step instructions for implementing the monorepo structure recommended in the analysis. It's designed to be accessible for non-developers working with AI assistance.

## Simplified Implementation Approach

Based on your situation as a non-developer using AI assistance, this guide focuses on a simplified, incremental approach to monorepo adoption.

## Phase 1: Better Organization Without Structural Changes

### Step 1: Audit and Document Current Codebase

1. **Create a code map document**:
   ```markdown
   # Valorwell First EHR Code Map
   
   ## Clinician-Facing Features
   - Calendar functionality: src/services/calendar/*, src/components/calendar/*
   - Session notes: src/hooks/useSessionNote*, src/packages/core/hooks/sessionNote/*
   
   ## Patient-Facing Features
   - Patient dashboard: src/pages/PatientDashboard.tsx
   - Patient documents: src/pages/PatientDocuments.tsx
   
   ## Shared Code
   - Authentication: src/components/auth/*
   - Timezone handling: src/utils/timezone/*, src/context/TimeZoneContext.tsx
   ```

2. **Identify duplicated code**:
   - Look for similar files in both `src/` and `packages/core/`
   - Document these in a "Code Duplication Report"

3. **Document dependencies between components**:
   - Which components depend on which services?
   - Which hooks are used by which components?

### Step 2: Consolidate Duplicated Code

1. **Move session note hooks to core package**:
   - Keep the hooks in `packages/core/hooks/sessionNote/`
   - Update imports in the main application to use the core package

2. **Move timezone utilities to core package**:
   - Consolidate timezone utilities in `packages/core/utils/timezone/`
   - Update imports in the main application

3. **Create clear documentation**:
   - Document which code belongs in the core package
   - Document how to import from the core package

## Phase 2: Setup Basic Monorepo Structure

### Step 1: Update Package Manager Configuration

1. **Install pnpm** (simpler than Turborepo for starting):
   ```bash
   npm install -g pnpm
   ```

2. **Create pnpm workspace configuration**:
   Create a `pnpm-workspace.yaml` file in the root:
   ```yaml
   packages:
     - 'packages/*'
     - 'src'
   ```

3. **Update root package.json**:
   ```json
   {
     "name": "valorwell-first-ehr",
     "private": true,
     "scripts": {
       "dev": "pnpm --filter ./src dev",
       "build": "pnpm --filter ./src build",
       "lint": "pnpm --filter ./src lint"
     }
   }
   ```

### Step 2: Enhance Core Package

1. **Update core package.json**:
   ```json
   {
     "name": "@valorwell/core",
     "version": "0.1.0",
     "main": "index.ts",
     "types": "index.ts",
     "private": true,
     "dependencies": {
       "luxon": "^3.4.0",
       "zod": "^3.22.0"
     }
   }
   ```

2. **Create a proper index.ts barrel file**:
   ```typescript
   // Export all public APIs
   export * from './api';
   export * from './contexts';
   export * from './hooks';
   export * from './types';
   export * from './utils';
   ```

3. **Create barrel files for each subdirectory**:
   For example, in `packages/core/hooks/index.ts`:
   ```typescript
   export * from './useUserTimeZone';
   export * from './sessionNote';
   ```

## Phase 3: Extract Domain-Specific Packages

### Step 1: Create Calendar Package

1. **Create package structure**:
   ```
   packages/calendar/
   ├── package.json
   ├── index.ts
   ├── src/
   │   ├── components/
   │   ├── hooks/
   │   ├── services/
   │   └── types/
   └── tsconfig.json
   ```

2. **Create package.json**:
   ```json
   {
     "name": "@valorwell/calendar",
     "version": "0.1.0",
     "main": "index.ts",
     "types": "index.ts",
     "private": true,
     "dependencies": {
       "@valorwell/core": "workspace:*",
       "@fullcalendar/core": "^6.1.11",
       "@fullcalendar/interaction": "^6.1.11",
       "@fullcalendar/react": "^6.1.11",
       "@fullcalendar/rrule": "^6.1.17",
       "@fullcalendar/timegrid": "^6.1.11"
     }
   }
   ```

3. **Move calendar code**:
   - Move services from `src/services/calendar/` to `packages/calendar/src/services/`
   - Move components from `src/components/calendar/` to `packages/calendar/src/components/`
   - Move types from `src/types/calendar.d.ts` to `packages/calendar/src/types/`

4. **Create barrel files**:
   ```typescript
   // packages/calendar/index.ts
   export * from './src/components';
   export * from './src/hooks';
   export * from './src/services';
   export * from './src/types';
   ```

5. **Update imports in main application**:
   ```typescript
   // Before
   import { CalendarService } from '@/services/calendar';
   
   // After
   import { CalendarService } from '@valorwell/calendar';
   ```

### Step 2: Create Session Notes Package

Follow the same pattern as the calendar package:

1. Create package structure
2. Create package.json
3. Move session notes code
4. Create barrel files
5. Update imports

## Phase 4: Gradual App Separation

### Step 1: Identify Clinician vs. Patient Code

1. **Create a mapping document**:
   ```markdown
   # Application Separation Plan
   
   ## Clinician Portal
   - Calendar.tsx
   - ClinicianDashboard.tsx
   - Clients.tsx
   - MyClients.tsx
   
   ## Patient Portal
   - PatientDashboard.tsx
   - PatientDocuments.tsx
   - PatientProfile.tsx
   ```

2. **Add comments to files**:
   ```typescript
   // CLINICIAN PORTAL: This component is part of the clinician experience
   export function ClinicianDashboard() {
     // ...
   }
   ```

### Step 2: Create App Packages (When Ready)

1. **Create clinician-portal package**:
   ```
   apps/clinician-portal/
   ├── package.json
   ├── index.html
   ├── src/
   │   ├── main.tsx
   │   ├── App.tsx
   │   └── pages/
   └── vite.config.ts
   ```

2. **Create patient-portal package** with similar structure

3. **Move code gradually**, testing after each move

## Practical Tips for Non-Developers

### Working with AI Assistance

1. **Clear instructions for AI**:
   ```
   Please help me move the calendar functionality from src/services/calendar/ to packages/calendar/src/services/ while maintaining all imports and functionality.
   ```

2. **Ask AI to document changes**:
   ```
   After making these changes, please explain what files were modified and how imports should be updated in other files.
   ```

3. **Request tests**:
   ```
   Please help me create a simple test to verify that the calendar functionality still works after moving it to the package.
   ```

### Troubleshooting Common Issues

1. **Import errors**:
   - Check that package.json dependencies are correct
   - Verify that barrel files export all necessary components
   - Ensure tsconfig.json paths are updated

2. **Build errors**:
   - Check that each package has the correct dependencies
   - Verify that each package has a proper tsconfig.json

3. **Runtime errors**:
   - Test each feature after moving it
   - Keep the original code until the new code is confirmed working

## Incremental Testing Strategy

1. **Test after each change**:
   - Move one feature at a time
   - Test thoroughly before moving to the next

2. **Create a testing checklist**:
   ```markdown
   # Testing Checklist for Calendar Package
   
   - [ ] Calendar loads correctly
   - [ ] Events display correctly
   - [ ] Can create new events
   - [ ] Can edit existing events
   - [ ] Can delete events
   - [ ] Timezone handling works correctly
   ```

3. **Rollback plan**:
   - Keep original code commented out until new structure is confirmed working
   - Document how to revert changes if needed

## Conclusion

This implementation guide provides a practical, step-by-step approach to gradually adopting a monorepo structure for the Valorwell First EHR project. By following this incremental approach, you can improve code organization and separation of concerns without disrupting the existing functionality.

Remember that this is a long-term process, and it's okay to proceed slowly and carefully. The goal is to improve the codebase over time, not to transform everything at once.