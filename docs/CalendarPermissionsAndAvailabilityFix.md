# Calendar Permissions and Availability Fix

This document explains the recent fixes applied to the calendar system to address issues with saving availability and permission errors.

## Issues Fixed

1. **Permission Handling Problems**
   - Fixed incorrect permission level determination in `CalendarPage.tsx`
   - Improved permission checking logic to correctly identify when users should have full access
   - Enhanced error messages for permission-related issues

2. **Availability Slot Saving Issues**
   - Fixed the database trigger that prevents overlapping availability slots
   - Corrected the logic to only check for overlaps within the same recurrence pattern
   - Improved error handling and user feedback for availability creation failures

3. **Time Zone Inconsistencies**
   - Added validation for time zone settings before creating availability slots
   - Improved error messages for time zone-related issues
   - Enhanced troubleshooting information in the UI

4. **Database Schema Fixes**
   - Created a new migration to fix any remaining issues with the calendar schema
   - Added proper UUID validation for clinician IDs
   - Implemented better Row-Level Security (RLS) policies for calendar events

## How to Apply the Fixes

1. Run the fix script:
   ```bash
   node scripts/fix-calendar-permissions.js
   ```

2. Restart the application:
   ```bash
   npm run dev
   ```

## Troubleshooting

If you still encounter issues after applying the fixes, try the following:

### Permission Issues

If you're seeing "You may have limited permissions" warnings:

1. Verify that you're logged in with the correct account
2. Check if you're trying to modify your own calendar or someone else's
3. If you need admin access, ensure your user has the 'admin' role in the profiles table
4. Try logging out and logging back in to refresh your session

### Availability Saving Issues

If you're unable to save availability slots:

1. Check for overlapping availability slots - the system prevents overlaps
2. Verify your time zone settings in your profile
3. Ensure the start time is before the end time
4. Check the browser console for specific error messages

### Time Zone Issues

If you're experiencing time zone-related problems:

1. Make sure your profile has a valid time zone set
2. The application uses Luxon for time zone handling - ensure all times are in the correct format
3. If times appear incorrect, try refreshing the page to sync with the server

## Technical Details

### Database Changes

1. Fixed the `prevent_overlapping_availability` trigger to correctly handle recurring and non-recurring availability
2. Added a `can_manage_clinician_calendar` function to properly check permissions
3. Updated the RLS policy for calendar_events to enforce proper access control
4. Added proper UUID validation for clinician IDs

### Frontend Changes

1. Improved error handling in availability dialogs
2. Enhanced permission checking in the Calendar page
3. Added better user feedback and troubleshooting information
4. Fixed time zone validation before saving availability

## Contact Support

If you continue to experience issues after applying these fixes, please contact the development team with the following information:

1. Your user ID
2. The specific error messages you're seeing
3. Steps to reproduce the issue
4. Browser console logs if available