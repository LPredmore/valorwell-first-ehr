import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types/appointment';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface WeekViewProps {
  clinicianId?: string;
}

const WeekView: React.FC<WeekViewProps> = ({ clinicianId }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const { toast } = useToast();

  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['appointments', 'week', startDate.toISOString(), clinicianId],
    queryFn: async () => {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = addDays(startDate, 6).toISOString().split('T')[0];

      let query = supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr);

      if (clinicianId) {
        query = query.eq('appointment_clinician_id', clinicianId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Appointment[];
    },
  });

  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to load appointments',
      variant: 'destructive',
    });
  }

  const getAppointmentsForDay = (date: Date) => {
    if (!appointments) return [];
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.appointment_date);
      return isSameDay(appointmentDate, date);
    });
  };

  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={handlePrevWeek}>
          Previous Week
        </Button>
        <h2 className="text-xl font-semibold">
          Week of {format(startDate, 'MMM d, yyyy')}
        </h2>
        <Button variant="outline" onClick={handleNextWeek}>
          Next Week
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => (
          <div key={day.toString()} className="space-y-2">
            <div className="text-center font-medium">
              <div>{format(day, 'EEE')}</div>
              <div className="text-lg">{format(day, 'd')}</div>
            </div>
            <Card className="min-h-[300px]">
              <CardContent className="p-2">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getAppointmentsForDay(day).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-2 bg-blue-100 rounded text-sm"
                      >
                        <div className="font-medium">
                          {appointment.appointment_client_name}
                        </div>
                        <div>
                          {appointment.appointment_start_time} - {appointment.appointment_end_time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
