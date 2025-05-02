
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { AvailabilitySlot } from '@/types/appointment';
import { TimeZoneService } from '@/utils/timeZoneService';
import { PermissionLevel } from '@/services/PermissionService';

export interface AvailabilitySlotListProps {
  slots: AvailabilitySlot[];
  timeZone: string;
  onDeleteSlot: (slotId: string, isRecurring: boolean) => void;
  permissionLevel?: PermissionLevel;
}

/**
 * AvailabilitySlotList - A component for rendering a list of availability slots
 * 
 * This component displays both regular availability slots and appointment slots,
 * with different styling for each type. It also provides delete functionality
 * for regular availability slots if the user has appropriate permissions.
 */
const AvailabilitySlotList: React.FC<AvailabilitySlotListProps> = ({
  slots = [],
  timeZone,
  onDeleteSlot,
  permissionLevel = 'admin'
}) => {
  const formatTimeDisplay = (timeStr: string): string => {
    if (!timeStr) return '';
    return TimeZoneService.formatTime(timeStr);
  };

  const availabilitySlots = slots.filter(slot => !slot.isAppointment);
  const appointmentSlots = slots.filter(slot => slot.isAppointment);

  if (availabilitySlots.length === 0 && appointmentSlots.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No availability slots set for this day.
      </div>
    );
  }

  return (
    <>
      {availabilitySlots.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Available Times</h4>
          <ul className="space-y-2">
            {availabilitySlots.map(slot => (
              <li key={slot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border">
                <span className="text-sm">
                  {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                </span>
                {(permissionLevel === 'write' || permissionLevel === 'admin') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSlot(slot.id!, slot.isRecurring || false)}
                    title={slot.isRecurring ? "Delete this recurring availability slot" : "Delete this availability slot"}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {appointmentSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-blue-600">Scheduled Appointments</h4>
          <ul className="space-y-2">
            {appointmentSlots.map(slot => (
              <li key={slot.id} className="p-2 bg-blue-50 rounded-md border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 rounded-full">
                    Appointment
                  </span>
                </div>
                {slot.clientName && (
                  <div className="text-xs text-gray-600 mt-1">
                    Client: {slot.clientName}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default AvailabilitySlotList;
