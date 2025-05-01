import React from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CalendarEvent } from '@/types/calendar';

interface CalendarSidebarProps {
  showAvailability: boolean;
  showAppointments: boolean;
  showTimeOff: boolean;
  setShowAvailability: (show: boolean) => void;
  setShowAppointments: (show: boolean) => void;
  setShowTimeOff: (show: boolean) => void;
  upcomingEvents?: CalendarEvent[];
  isLoadingEvents?: boolean;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  showAvailability,
  showAppointments,
  showTimeOff,
  setShowAvailability,
  setShowAppointments,
  setShowTimeOff,
  upcomingEvents = [],
  isLoadingEvents = false,
}) => {
  return (
    <Card className="p-4 h-full">
      <div className="space-y-6">
        {/* Filter Panel */}
        <div>
          <h3 className="text-lg font-medium mb-3">Filters</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-availability" className="cursor-pointer">
                Availability
              </Label>
              <Switch
                id="show-availability"
                checked={showAvailability}
                onCheckedChange={setShowAvailability}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-appointments" className="cursor-pointer">
                Appointments
              </Label>
              <Switch
                id="show-appointments"
                checked={showAppointments}
                onCheckedChange={setShowAppointments}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-time-off" className="cursor-pointer">
                Time Off
              </Label>
              <Switch
                id="show-time-off"
                checked={showTimeOff}
                onCheckedChange={setShowTimeOff}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Legend Panel */}
        <div>
          <h3 className="text-lg font-medium mb-3">Legend</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-200 border border-green-300 mr-2"></div>
              <span className="text-sm">Availability</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200 mr-2"></div>
              <span className="text-sm">Appointment</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-amber-100 border border-amber-200 mr-2"></div>
              <span className="text-sm">Time Off</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200 mr-2"></div>
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Upcoming Events Panel */}
        <div>
          <h3 className="text-lg font-medium mb-3">Upcoming Events</h3>
          {isLoadingEvents ? (
            <p className="text-sm text-gray-500">Loading events...</p>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="text-sm p-2 rounded bg-gray-50">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-gray-500">
                    {new Date(event.start).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {new Date(event.end).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming events</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CalendarSidebar;