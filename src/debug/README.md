# Debug Utilities

This directory contains consolidated debug utilities for the application. These utilities are designed to be used in development mode and are conditionally disabled in production.

## Structure

- `debugUtils.ts`: Core debug utility class with common logging and visualization functions
- `authDebugUtils.ts`: Authentication-specific debug utilities
- `authFixesTest.ts`: Test utilities for verifying authentication fixes
- `index.ts`: Exports specialized debug utilities for different parts of the application

## Usage

### Basic Logging

```typescript
import { DebugUtils } from '@/debug';

// Log with context
DebugUtils.log('MyComponent', 'Something happened', { data: 'optional data' });

// Log errors
DebugUtils.error('MyComponent', 'Something went wrong', error);

// Log warnings
DebugUtils.warn('MyComponent', 'Something might be wrong', { data: 'optional data' });

// Log info
DebugUtils.info('MyComponent', 'Informational message', { data: 'optional data' });
```

### Specialized Debug Utilities

```typescript
import { AppointmentDebug, CalendarDebug, AuthDebug } from '@/debug';

// Use appointment debug utilities
AppointmentDebug.analyzeAppointment(appointment, userTimeZone);
AppointmentDebug.visualizeAppointment(appointment, userTimeZone);

// Use calendar debug utilities
CalendarDebug.validateHookParameters('useCalendarData', params);
CalendarDebug.compareDataStructures(expected, actual);

// Use auth debug utilities
AuthDebug.log('Authentication successful');

// Test authentication fixes
AuthDebug.testAuthFixes();
AuthDebug.verifyAuthInitializedFlag();
```

### Conditional Debug Code

```typescript
import { isDebugEnabled, loadDebugModule } from '@/debug';

// Conditionally execute code in development only
if (isDebugEnabled) {
  // This code will only run in development
  performDebugOperation();
}

// Conditionally load a debug module
loadDebugModule(() => import('./heavyDebugModule')).then(module => {
  if (module) {
    // Module is only loaded in development
    module.runDiagnostics();
  }
});
```

## Environment-Based Logging

Debug utilities automatically detect the environment and disable verbose logging in production. This helps reduce console noise and potential performance impact in production environments.

## Adding New Debug Utilities

When adding new debug utilities:

1. Consider if they belong in an existing specialized utility
2. If not, create a new specialized utility in `index.ts`
3. Ensure all debug functions respect the `VERBOSE` flag
4. Document the new utilities in this README

## Authentication Fixes Testing

The `authFixesTest.ts` module provides utilities for testing the authentication fixes, particularly focusing on the `authInitialized` flag issue.

### Testing the Authentication Fixes

1. Navigate to the Auth Debug Page at `/debug/auth-public`
2. Use the "Authentication Fixes Test" panel to run the tests
3. Check the browser console for detailed test output
4. Navigate to the Index page (/) to test redirection behavior

### Using the AuthStateMonitor

The `AuthStateMonitor` component can be used to monitor authentication state changes:

```tsx
// In any component
import AuthStateMonitor from '@/components/auth/AuthStateMonitor';

// Add to your component's render method
<AuthStateMonitor visible={true} />
```

Set `visible={true}` to show the monitor UI, or `visible={false}` to only log to console.

### Key Authentication Fixes

The following fixes were implemented in the UserContext.tsx file:

1. Setting `authInitialized` to true immediately in the main useEffect to prevent deadlocks
2. Adding multiple redundant checks to ensure the flag remains true throughout the authentication process
3. Enhancing error handling to set `authInitialized` to true even when errors occur
4. Adding timeout detection in both Index.tsx and ProtectedRoute.tsx
5. Improving state management with clear separation between `isLoading` and `authInitialized`