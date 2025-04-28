
# Timezone System Migration Plan

## Overview

This document outlines the plan to migrate all timezone-related functionality to the new standardized `TimeZoneService` and `TimeZoneContext` system. This migration is necessary to ensure consistency, maintainability, and proper handling of timezones throughout the application.

## Migration Phases

### Phase 1: Core Infrastructure (COMPLETED)
- ✓ Create standardized `TimeZoneService` as the single source of truth
- ✓ Implement new `TimeZoneContext` in `src/context/TimeZoneContext.tsx`
- ✓ Add deprecation warning imports to legacy timezone files

### Phase 2: Component & Hook Migration (COMPLETED)
- ✓ Update all components and hooks to use new `TimeZoneContext` hook
- ✓ Replace direct timezone utility imports with `TimeZoneService` methods
- ✓ Add stack traces to deprecation warnings for easier tracking

### Phase 3: Service Layer Updates (COMPLETED)
- ✓ Update all services to use `TimeZoneService` consistently
- ✓ Standardize timezone handling in API calls

### Phase 4: Testing and Validation (COMPLETED)
- ✓ Run timezone audit script (`timeZoneAudit.ts`)
- ✓ Run deprecation detection script (`detectDeprecatedTimezoneUsage.ts`)
- ✓ Test all timezone-dependent functionality in different timezones
- ✓ Verify that all components use the same timezone format

### Phase 5: Clean-up and Documentation (COMPLETED)
- ✓ Mark deprecated timezone utilities with `@deprecated` tags
- ✓ Maintain backward compatibility layers for gradual migration
- ✓ Add comprehensive documentation for timezone handling
- ✓ Update developer guidelines

## Migration Guidelines

1. **Always use the TimeZoneContext hook** for accessing user timezone:
   ```typescript
   import { useTimeZone } from '@/context/TimeZoneContext';
   
   const MyComponent = () => {
     const { userTimeZone } = useTimeZone();
     // Use userTimeZone for display or calculations
   };
   ```

2. **Always validate timezone strings** with `TimeZoneService.ensureIANATimeZone()`:
   ```typescript
   const validTimeZone = TimeZoneService.ensureIANATimeZone(inputTimeZone);
   ```

3. **For formatting times and dates**, use standardized formats:
   ```typescript
   // Format time in user's timezone
   const formattedTime = TimeZoneService.formatTime(time, 'TIME_12H', userTimeZone);
   
   // Format date with timezone
   const formattedDate = TimeZoneService.formatDateTime(date, 'DATETIME_FULL', userTimeZone);
   ```

4. **For timezone conversion**, use the conversion methods:
   ```typescript
   // Convert from one timezone to another
   const convertedTime = TimeZoneService.convertDateTime(time, sourceTimezone, targetTimezone);
   
   // Convert from UTC to user timezone
   const localTime = TimeZoneService.fromUTC(utcTime, userTimeZone);
   
   // Convert to UTC for storage
   const utcTime = TimeZoneService.toUTC(localDateTime);
   ```

## Detection and Monitoring

1. Run the detection script periodically:
   ```
   npx ts-node src/scripts/detectDeprecatedTimezoneUsage.ts
   ```

2. Monitor console for deprecation warnings:
   ```
   [TIMEZONE MIGRATION] getUserTimeZone is deprecated, use TimeZoneService.getUserTimeZone instead
   ```

## Timeline

- **Phase 1**: Completed
- **Phase 2**: Completed
- **Phase 3**: Completed
- **Phase 4**: Completed
- **Phase 5**: Completed

## Post-Migration

After the migration is complete:
1. Run the timezone audit regularly
2. Add checks to the CI/CD pipeline
3. Incorporate timezone best practices into code review checklist
