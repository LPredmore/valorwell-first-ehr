# @valorwell/core

This package contains shared code used across the Valorwell First EHR application.

## Contents

- **API**: API clients and utilities
- **Contexts**: React contexts for global state
- **Hooks**: Custom React hooks
- **Types**: TypeScript type definitions
- **Utils**: Utility functions

## Usage

Import components, hooks, and utilities from this package:

```typescript
// Import hooks
import { useSessionNoteState, useSessionNoteSave } from '@valorwell/core/hooks/sessionNote';

// Import types
import { SessionNoteFormData } from '@valorwell/core/types/sessionNote';

// Import utilities
import { errorHandler } from '@valorwell/core/utils/errors';
```

## Development Guidelines

### Adding New Code

When adding new functionality to the application:

1. Determine if the code should be shared across multiple parts of the application
2. If shared, add it to the appropriate directory in this package
3. Export it through the relevant index.ts file
4. Import it in the application code

### Modifying Existing Code

When modifying code in this package:

1. Ensure backward compatibility
2. Update documentation
3. Consider the impact on all parts of the application that use this code

## Code Organization

This package follows a domain-driven organization:

- Generic utilities and types are in the root directories
- Domain-specific code is in subdirectories (e.g., sessionNote)