
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import CalendarView from '../components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Users, Clock, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { getUserTimeZone } from '@/utils/timeZoneUtils';
import { useClinicianData } from '@/hooks/useClinicianData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type ViewType = 'day' | 'week' | 'month';

interface Clinician {
  id: string;
  clinician_professional_name: string;
}

// Renamed from 'Calendar' to 'CalendarPage' to avoid naming conflict
const CalendarPage = () => {
  const [view, setView] = useState<ViewType>('week');
  const [showAvailability, setShowAvailability] = useState(false);
  const [selectedClinicianId, setSelectedClinicianId] = useState<string | null>(null);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const { clinicianData } = useClinicianData();
  const [userTimeZone, setUserTimeZone] = useState<string>('');
  
  // State for appointment creation dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>('weekly');
  const [startTime, setStartTime] = useState<string>('09:00');

  useEffect(() => {
    // Set the user's time zone
    if (clinicianData?.clinician_time_zone) {
      setUserTimeZone(clinicianData.clinician_time_zone);
    } else {
      setUserTimeZone(getUserTimeZone());
    }
  }, [clinicianData]);

  useEffect(() => {
    const fetchClinicians = async () => {
      setLoadingClinicians(true);
      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('id, clinician_professional_name')
          .order('clinician_professional_name');

        if (error) {
          console.error('Error fetching clinicians:', error);
        } else {
          setClinicians(data || []);
          // Set the first clinician as default if available
          if (data && data.length > 0 && !selectedClinicianId) {
            setSelectedClinicianId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingClinicians(false);
      }
    };

    fetchClinicians();
  }, []);

  // Generate time options for the dropdown
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <div className="flex items-center gap-4">
              <Tabs defaultValue="week" value={view} onValueChange={(value) => setView(value as ViewType)}>
                <TabsList>
                  <TabsTrigger value="day">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Day
                  </TabsTrigger>
                  <TabsTrigger value="week">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Month
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant={showAvailability ? "default" : "outline"}
                onClick={() => setShowAvailability(!showAvailability)}
              >
                <Clock className="mr-2 h-4 w-4" />
                Availability
              </Button>

              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>

              <div className="w-64">
                <Select
                  value={selectedClinicianId || undefined}
                  onValueChange={(value) => setSelectedClinicianId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a clinician" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClinicians ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : (
                      clinicians.map((clinician) => (
                        <SelectItem key={clinician.id} value={clinician.id}>
                          {clinician.clinician_professional_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <CalendarView
            view={view}
            showAvailability={showAvailability}
            clinicianId={selectedClinicianId}
            userTimeZone={userTimeZone}
          />
        </div>
      </div>

      {/* Appointment Creation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client Name</Label>
              <Select>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder">Client list will be added later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                    id="date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {format(new Date(`2023-01-01T${time}`), 'h:mm a')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="recurring" 
                checked={isRecurring} 
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
              <Label htmlFor="recurring">Recurring appointment</Label>
            </div>

            {isRecurring && (
              <div className="grid gap-2 pl-6">
                <Label htmlFor="recurrenceType">Recurrence Pattern</Label>
                <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                  <SelectTrigger id="recurrenceType">
                    <SelectValue placeholder="Select recurrence pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                    <SelectItem value="monthly">Every 4 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button">Create Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CalendarPage;
