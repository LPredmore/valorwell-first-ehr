
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimePickerInput } from '@/components/ui/time-picker';
import { toast } from '@/hooks/use-toast';
import { DateTime } from 'luxon';
import { TimeZoneService } from '@/utils/timeZoneService';
import { AvailabilityMutationService } from '@/services/AvailabilityMutationService';
import { useCalendarAuth } from '@/hooks/useCalendarAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Info } from 'lucide-react';
import { useDialogs, DialogType } from '@/context/DialogContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { z } from 'zod';
import { useFormValidation } from '@/hooks/useFormValidation';
import { validateAvailabilitySlot } from '@/utils/validation/validationUtils';
import {
  ValidationError,
  TimeZoneError,
  PermissionError,
  AuthenticationError,
  ConflictError,
  formatErrorForUser
} from '@/utils/errors';

interface SingleAvailabilityDialogProps {
  clinicianId: string;
  userTimeZone: string;
  onAvailabilityCreated: () => void;
  permissionLevel?: 'full' | 'limited' | 'none';
}

// Define the form schema for availability
const availabilityFormSchema = z.object({
  selectedDate: z.date({
    required_error: "Please select a date for the availability slot"
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required")
}).refine(
  (data) => {
    // Validate that end time is after start time
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    return endHour > startHour || (endHour === startHour && endMinute > startMinute);
  },
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
);

type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;

const SingleAvailabilityDialog: React.FC<SingleAvailabilityDialogProps> = ({
  clinicianId,
  userTimeZone,
  onAvailabilityCreated,
  permissionLevel = 'full'
}) => {
  const { state, closeDialog } = useDialogs();
  const isOpen = state.type === 'singleAvailability';
  const onClose = closeDialog;
  const { currentUserId, refreshAuth } = useCalendarAuth();
  const validTimeZone = TimeZoneService.ensureIANATimeZone(userTimeZone);
  
  // Use our error handling hook
  const {
    errorMessage,
    isErrorVisible,
    isLoading: isSubmitting,
    validationErrors,
    handleError,
    clearErrors,
    withErrorHandling
  } = useErrorHandler({
    showErrors: true,
    logErrors: true
  });
  
  // Use form validation hook
  const {
    isValid,
    errors: formValidationErrors,
    validatedData,
    validate,
    setFieldValue,
    getFieldProps,
    reset: resetForm
  } = useFormValidation<AvailabilityFormValues>(
    availabilityFormSchema,
    {
      initialValues: {
        selectedDate: undefined,
        startTime: '09:00',
        endTime: '17:00'
      },
      validateOnBlur: true
    }
  );
  
  // Computed form error from error handler
  const formError = isErrorVisible ? errorMessage : null;

  useEffect(() => {
    // Reset form error when dialog opens/closes
    if (isOpen) {
      clearErrors();
      resetForm();
    }
  }, [isOpen, clearErrors, resetForm]);

  const handleSubmit = async () => {
    // Validate form inputs
    const isFormValid = await validate();
    if (!isFormValid || !validatedData) {
      return;
    }
    
    // Use our error handling wrapper
    await withErrorHandling(async () => {
      // Validate availability slot with our utility function
      const { date, startTime, endTime, timeZone } = validateAvailabilitySlot(
        validatedData.selectedDate,
        validatedData.startTime,
        validatedData.endTime,
        validTimeZone
      );
      
      // Format date properly for TimeZoneService
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log('[SingleAvailabilityDialog] Creating availability with:', {
        clinicianId,
        startTime: dateStr + 'T' + validatedData.startTime,
        endTime: dateStr + 'T' + validatedData.endTime,
        userTimeZone: validTimeZone,
        authUserId: currentUserId,
        permissionLevel
      });
      
      // Debug authentication state before proceeding
      if (!currentUserId) {
        console.warn('[SingleAvailabilityDialog] Warning: No authenticated user found');
        await refreshAuth();
        
        if (!currentUserId) {
          throw new AuthenticationError('Authentication error: Please log out and log back in to refresh your session.', {
            userMessage: 'Your session has expired. Please log out and log back in.'
          });
        }
      }

      // Permission check
      if (permissionLevel === 'none') {
        throw new PermissionError('You do not have permission to create availability slots', {
          userMessage: 'You do not have permission to create availability slots',
          resource: 'availability',
          action: 'create'
        });
      }

      if (clinicianId !== currentUserId && permissionLevel !== 'full') {
        console.warn('[SingleAvailabilityDialog] User may have limited permissions', {
          currentUserId,
          clinicianId,
          permissionLevel
        });
      }
      
      // Create availability object with correct day of week
      const selectedDateTime = DateTime.fromJSDate(validatedData.selectedDate).setZone(validTimeZone);
      const dayOfWeek = TimeZoneService.getWeekdayName(selectedDateTime, 'long').toLowerCase() as any;
      
      const response = await AvailabilityMutationService.createAvailabilitySlot(
        clinicianId,
        dayOfWeek,
        dateStr + 'T' + validatedData.startTime,
        dateStr + 'T' + validatedData.endTime,
        false, // Not recurring for single day
        undefined,
        validTimeZone,
        selectedDateTime
      );

      toast({
        title: "Success",
        description: "Single day availability has been added",
      });
      
      onAvailabilityCreated();
      onClose();
      
      return response;
    }, {
      context: {
        component: 'SingleAvailabilityDialog',
        clinicianId,
        date: validatedData.selectedDate,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        timeZone: validTimeZone
      }
    });
  };

  return (
    <ErrorBoundary
      errorTitle="Calendar Error"
      errorMessage="There was a problem with the availability dialog"
      onRetry={() => clearErrors()}
    >
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Single Day Availability</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {permissionLevel !== 'full' && clinicianId !== currentUserId && (
            <Alert variant="warning">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You are adding availability for a different clinician. Some actions may be restricted.
              </AlertDescription>
            </Alert>
          )}
          
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            <label>Select Date</label>
            <Calendar
              mode="single"
              selected={getFieldProps('selectedDate').value}
              onSelect={(date) => setFieldValue('selectedDate', date)}
              initialFocus
              disabled={(date) => date < new Date()}
            />
            {formValidationErrors.selectedDate && (
              <p className="text-sm text-red-500 mt-1">{formValidationErrors.selectedDate}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label>Start Time</label>
              <TimePickerInput
                value={getFieldProps('startTime').value}
                onChange={(value) => setFieldValue('startTime', value)}
                min="00:00"
                max="23:45"
                step={900}
              />
              {formValidationErrors.startTime && (
                <p className="text-sm text-red-500 mt-1">{formValidationErrors.startTime}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label>End Time</label>
              <TimePickerInput
                value={getFieldProps('endTime').value}
                onChange={(value) => setFieldValue('endTime', value)}
                min="00:15"
                max="23:59"
                step={900}
              />
              {formValidationErrors.endTime && (
                <p className="text-sm text-red-500 mt-1">{formValidationErrors.endTime}</p>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            <p>Adding availability for: {clinicianId.substring(0, 8)}...</p>
            <p>Current user: {currentUserId ? currentUserId.substring(0, 8) + '...' : 'Not authenticated'}</p>
            <p>Time zone: {TimeZoneService.formatTimeZoneDisplay(validTimeZone)}</p>
            <p>Permission level: {permissionLevel}</p>
            {formError && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-red-600">
                <p className="font-medium">Troubleshooting Tips:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Ensure the date and time don't overlap with existing availability</li>
                  <li>Verify your timezone settings in profile</li>
                  <li>Check that you have permission to manage this calendar</li>
                  <li>Try refreshing the page if the issue persists</li>
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose()} disabled={isSubmitting}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || permissionLevel === 'none'}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add Availability
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default SingleAvailabilityDialog;
