# Valorwell First EHR Documentation

## Code Organization and Architecture

### Monorepo Evaluation
- [Monorepo Evaluation](./MonorepoEvaluation.md) - Index of all monorepo-related documents
- [Monorepo Analysis](./MonorepoAnalysis.md) - Comprehensive analysis of monorepo transition
- [Monorepo Structure Diagram](./MonorepoStructureDiagram.md) - Visual representation of proposed structure
- [Monorepo Implementation Guide](./MonorepoImplementationGuide.md) - Step-by-step implementation instructions
- [Monorepo Recommendation](./MonorepoRecommendation.md) - Executive summary and recommendations

### Current Code Organization
- [Code Organization](./CodeOrganization.md) - Map of the current code structure
- [Code Boundaries](./CodeBoundaries.md) - Guidelines for maintaining boundaries between different parts of the application
- [Duplicated Code Migration](./DuplicatedCodeMigration.md) - Plan for removing duplicated code
- [Code Organization Summary](./CodeOrganizationSummary.md) - Summary of accomplishments and next steps

### Other Documentation
- [Calendar Permissions and Availability Fix](./CalendarPermissionsAndAvailabilityFix.md) - Documentation for calendar-related fixes

## Core Package

The core package contains shared code used across the application:

- [Core Package README](../packages/core/README.md) - Documentation for the core package

## Getting Started

If you're new to the project, we recommend reading these documents in the following order:

1. [Code Organization Summary](./CodeOrganizationSummary.md) - To understand what we've accomplished and what's next
2. [Code Boundaries](./CodeBoundaries.md) - To understand how the code is organized
3. [Monorepo Recommendation](./MonorepoRecommendation.md) - To understand the long-term architectural vision

## Contributing

When contributing to this project, please follow these guidelines:

1. Respect the code boundaries documented in [Code Boundaries](./CodeBoundaries.md)
2. Use the core package for shared functionality
3. Add documentation for new features and components
4. Keep this documentation up-to-date