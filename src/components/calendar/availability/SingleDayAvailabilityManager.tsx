import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { TimeInput } from '@/components/ui/time-input';
import { Spinner } from '@/components/ui/spinner';
import { CalendarIcon, Trash2, Clock, PlusCircle } from 'lucide-react';
import { format, isValid, isBefore, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatTime12Hour } from '@/utils/timeZoneUtils';

interface SingleDayAvailability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface SingleDayAvailabilityManagerProps {
  clinicianId: string | null;
}

const SingleDayAvailabilityManager: React.FC<SingleDayAvailabilityManagerProps> = ({ clinicianId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [availabilityList, setAvailabilityList] = useState<SingleDayAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (clinicianId) {
      fetchSingleDayAvailability();
    }
  }, [clinicianId]);

  const fetchSingleDayAvailability = async () => {
    if (!clinicianId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('single_day_availability')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('availability_date', { ascending: true });

      if (error) throw error;

      const formattedAvailability = data?.map(item => ({
        id: item.id,
        date: item.availability_date,
        startTime: item.start_time.slice(0, 5),
        endTime: item.end_time.slice(0, 5),
      })) || [];

      setAvailabilityList(formattedAvailability);
    } catch (error) {
      console.error('Error fetching single day availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateAvailability = (): boolean => {
    if (!selectedDate) {
      toast({
        title: "Invalid Date",
        description: "Please select a valid date",
        variant: "destructive",
      });
      return false;
    }

    if (!startTime || !endTime) {
      toast({
        title: "Invalid Times",
        description: "Please enter valid start and end times",
        variant: "destructive",
      });
      return false;
    }

    const start = parseISO(`2000-01-01T${startTime}`);
    const end = parseISO(`2000-01-01T${endTime}`);
    
    if (!isValid(start) || !isValid(end)) {
      toast({
        title: "Invalid Time Format",
        description: "Please enter times in a valid format",
        variant: "destructive",
      });
      return false;
    }
    
    if (!isBefore(start, end)) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleAddAvailability = async () => {
    if (!clinicianId) {
      toast({
        title: "Error",
        description: "User ID not available",
        variant: "destructive",
      });
      return;
    }

    if (!validateAvailability()) {
      return;
    }

    setIsSaving(true);

    try {
      const formattedDate = format(selectedDate!, 'yyyy-MM-dd');
      
      const { data: existingData } = await supabase
        .from('single_day_availability')
        .select('id')
        .eq('clinician_id', clinicianId)
        .eq('availability_date', formattedDate);

      if (existingData && existingData.length > 0) {
        toast({
          title: "Date Already Exists",
          description: "You already have availability set for this date. Please edit or remove it first.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase.from('single_day_availability').insert({
        clinician_id: clinicianId,
        availability_date: formattedDate,
        start_time: startTime,
        end_time: endTime
      }).select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability added successfully",
      });

      setIsAdding(false);
      setSelectedDate(new Date());
      setStartTime('09:00');
      setEndTime('17:00');
      
      fetchSingleDayAvailability();
    } catch (error) {
      console.error('Error adding availability:', error);
      toast({
        title: "Error",
        description: "Failed to add availability",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvailability = async (id: string) => {
    if (!clinicianId) return;

    try {
      const { error } = await supabase
        .from('single_day_availability')
        .delete()
        .eq('id', id)
        .eq('clinician_id', clinicianId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability removed successfully",
      });

      fetchSingleDayAvailability();
    } catch (error) {
      console.error('Error removing availability:', error);
      toast({
        title: "Error",
        description: "Failed to remove availability",
        variant: "destructive",
      });
    }
  };

  const formatDisplayTime = (time: string): string => {
    return formatTime12Hour(time);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Single-Day Availability</h3>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? "secondary" : "outline"}
        >
          {isAdding ? "Cancel" : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Availability
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add Special Availability Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <TimeInput
                    id="startTime" 
                    value={startTime} 
                    onChange={setStartTime}
                    format="12h" 
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <TimeInput
                    id="endTime" 
                    value={endTime} 
                    onChange={setEndTime}
                    format="12h" 
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddAvailability}
                disabled={isSaving}
                className="mt-2"
              >
                {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Availability
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : availabilityList.length > 0 ? (
        <div className="space-y-2">
          {availabilityList.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-start">
                  <div className="mr-4">
                    <CalendarIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">{format(new Date(item.date), 'PPP')}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDisplayTime(item.startTime)} - {formatDisplayTime(item.endTime)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveAvailability(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
            <p>No single-day availability defined</p>
            <p className="text-sm mt-1">
              Add special availability days that override your regular weekly schedule
            </p>
          </div>
        </Card>
      )}

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <div className="mr-4 mt-1">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-medium text-blue-800">How Single-Day Availability Works</h4>
            <p className="text-sm text-blue-700 mt-1">
              Single-day availability will override your regular weekly schedule for the specified date.
              Use this feature for special availability needs, such as working on a day you're normally off
              or being available during different hours than your regular schedule.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SingleDayAvailabilityManager;
