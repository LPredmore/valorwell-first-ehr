
import React, { useMemo } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { useUserContext } from '@/contexts/UserContext';
import { useAppointments } from '@/hooks/useAppointments';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
import { formatAppointmentDate, formatAppointmentTime } from '@/utils/appointmentUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserTimeZone } from '@/hooks/useUserTimeZone';
import { formatTimeZoneDisplay } from '@/utils/timeZoneUtils';
import { DateTime } from 'luxon';

export default function ClinicianDashboard() {
  const { user } = useUserContext();
  const { timeZone } = useUserTimeZone(user?.id);
  const timeZoneDisplay = formatTimeZoneDisplay(timeZone);

  const { appointments, loading, error } = useAppointments({
    clinicianId: user?.id,
    limit: 100,
    timeZone,
  });

  // Filter appointments into today, upcoming, and past
  const { todayAppointments, upcomingAppointments, pastAppointments } = useMemo(() => {
    if (!appointments) {
      return {
        todayAppointments: [],
        upcomingAppointments: [],
        pastAppointments: []
      };
    }

    const today: typeof appointments = [];
    const upcoming: typeof appointments = [];
    const past: typeof appointments = [];
    
    const now = DateTime.now().setZone(timeZone);

    appointments.forEach(appointment => {
      const appointmentDt = DateTime.fromISO(appointment.start_at).setZone(timeZone);
      
      if (appointmentDt.hasSame(now, 'day')) {
        today.push(appointment);
      } else if (appointmentDt > now) {
        upcoming.push(appointment);
      } else {
        past.push(appointment);
      }
    });
    
    return {
      todayAppointments: today,
      upcomingAppointments: upcoming,
      pastAppointments: past
    };
  }, [appointments, timeZone]);

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Clinician Dashboard"
        text="Welcome back to your dashboard"
      />

      <div className="grid gap-4">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Appointments</CardTitle>
            <CardDescription>Your scheduled appointments for today in {timeZoneDisplay}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner />
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map(appointment => (
                  <div key={appointment.id} className="flex items-center p-3 border rounded-md bg-gray-50">
                    <div className="mr-4 text-primary">
                      <Clock className="h-10 w-10" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{appointment.clientName}</h4>
                      <p className="text-sm text-gray-500">
                        {formatAppointmentTime(appointment, timeZone)}
                      </p>
                      <p className="text-xs text-gray-400">{appointment.type}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No appointments scheduled for today
              </div>
            )}
          </CardContent>
          <CardFooter>
            {todayAppointments.length > 0 && (
              <Button variant="outline" size="sm" className="w-full">
                View All Today's Appointments
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled future appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner />
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 5).map(appointment => (
                  <div key={appointment.id} className="flex items-center p-3 border rounded-md bg-gray-50">
                    <div className="mr-4 text-primary">
                      <Calendar className="h-10 w-10" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{appointment.clientName}</h4>
                      <p className="text-sm text-gray-500">
                        {formatAppointmentDate(appointment, timeZone)}
                      </p>
                      <p className="text-xs text-gray-400">{formatAppointmentTime(appointment, timeZone)}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No upcoming appointments
              </div>
            )}
          </CardContent>
          <CardFooter>
            {upcomingAppointments.length > 5 && (
              <Button variant="outline" size="sm" className="w-full">
                View All Upcoming Appointments ({upcomingAppointments.length})
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardShell>
  );
}
