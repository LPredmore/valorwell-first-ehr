
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Plus, X, Copy, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface TimeSlot {
id: string;
startTime: string;
endTime: string;
}

interface DaySchedule {
day: string;
isOpen: boolean;
timeSlots: TimeSlot[];
}

interface AvailabilitySettings {
id: string;
clinician_id: string;
time_granularity: 'hour' | 'half-hour';
min_days_ahead: number;
created_at: string;
updated_at: string;
}

interface AvailabilityPanelProps {
  clinicianId?: string | null;
  onAvailabilityUpdated?: () => void;
  userTimeZone?: string;
}

const AvailabilityPanel: React.FC<AvailabilityPanelProps> = ({ clinicianId, onAvailabilityUpdated, userTimeZone }) => {
const [activeTab, setActiveTab] = useState<string>('set');
const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
const [loading, setLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [timeGranularity, setTimeGranularity] = useState<'hour' | 'half-hour'>('hour');
const [minDaysAhead, setMinDaysAhead] = useState<number>(1);
const { toast } = useToast();

const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([
{ day: 'Monday', isOpen: true, timeSlots: [] },
{ day: 'Tuesday', isOpen: true, timeSlots: [] },
{ day: 'Wednesday', isOpen: true, timeSlots: [] },
{ day: 'Thursday', isOpen: true, timeSlots: [] },
{ day: 'Friday', isOpen: true, timeSlots: [] },
{ day: 'Saturday', isOpen: false, timeSlots: [] },
{ day: 'Sunday', isOpen: false, timeSlots: [] },
]);

useEffect(() => {
async function fetchAvailability() {
setLoading(true);

try {
const { data: sessionData } = await supabase.auth.getSession();

if (!sessionData?.session?.user) {
console.log('User not logged in');
setLoading(false);
return;
}

const { data: profileData } = await supabase
.from('profiles')
.select('email')
.eq('id', sessionData.session.user.id)
.single();

if (!profileData) {
console.log('Profile not found');
setLoading(false);
return;
}

const clinicianIdToUse = clinicianId || null;
let clinicianToQuery = clinicianIdToUse;

if (!clinicianIdToUse) {
const { data: clinicianData } = await supabase
.from('clinicians')
.select('id')
.eq('clinician_email', profileData.email)
.single();

if (clinicianData) {
clinicianToQuery = clinicianData.id;
}
}

if (clinicianToQuery) {
const { data: availabilityData, error } = await supabase
.from('availability')
.select('*')
.eq('clinician_id', clinicianToQuery)
.eq('is_active', true);

if (error) {
console.error('Error fetching availability:', error);
} else if (availabilityData && availabilityData.length > 0) {
const newSchedule = [...weekSchedule];

const { data: settingsData } = await supabase.functions.invoke('get-availability-settings', {
  body: { clinicianId: clinicianToQuery }
});

if (settingsData) {
setTimeGranularity(settingsData.time_granularity as 'hour' | 'half-hour');
setMinDaysAhead(Number(settingsData.min_days_ahead) || 1);
}

availabilityData.forEach(slot => {
const dayIndex = newSchedule.findIndex(day => day.day === slot.day_of_week);
if (dayIndex !== -1) {
const startTime = slot.start_time.substring(0, 5);
const endTime = slot.end_time.substring(0, 5);

newSchedule[dayIndex].timeSlots.push({
id: slot.id,
startTime: startTime,
endTime: endTime,
});

newSchedule[dayIndex].isOpen = true;
}
});

setWeekSchedule(newSchedule);
}
}
} catch (error) {
console.error('Error:', error);
} finally {
setLoading(false);
}
}

fetchAvailability();
}, [clinicianId]);

const toggleDayOpen = (dayIndex: number) => {
setWeekSchedule(prev => {
const updated = [...prev];
updated[dayIndex] = {
...updated[dayIndex],
isOpen: !updated[dayIndex].isOpen
};
return updated;
});
};

const addTimeSlot = (dayIndex: number) => {
setWeekSchedule(prev => {
const updated = [...prev];
const day = updated[dayIndex];
const newId = `${day.day.toLowerCase().substring(0,3)}-${day.timeSlots.length + 1}`;

updated[dayIndex] = {
...day,
timeSlots: [
...day.timeSlots,
{
id: newId,
startTime: '09:00',
endTime: '17:00'
}
]
};

return updated;
});
};

const deleteTimeSlot = (dayIndex: number, slotId: string) => {
setWeekSchedule(prev => {
const updated = [...prev];
const day = updated[dayIndex];

updated[dayIndex] = {
...day,
timeSlots: day.timeSlots.filter(slot => slot.id !== slotId)
};

return updated;
});
};

const updateTimeSlot = (dayIndex: number, slotId: string, field: 'startTime' | 'endTime', value: string) => {
setWeekSchedule(prev => {
const updated = [...prev];
const day = updated[dayIndex];

updated[dayIndex] = {
...day,
timeSlots: day.timeSlots.map(slot =>
slot.id === slotId ? { ...slot, [field]: value } : slot
)
};

return updated;
});
};

const toggleDayAvailability = (dayIndex: number) => {
setWeekSchedule(prev => {
const updated = [...prev];
updated[dayIndex] = {
...updated[dayIndex],
isOpen: !updated[dayIndex].isOpen
};
return updated;
});
};

const saveAvailability = async () => {
setIsSaving(true);

try {
const { data: sessionData } = await supabase.auth.getSession();

if (!sessionData?.session?.user) {
toast({
title: "Authentication Error",
description: "You must be logged in to save availability",
variant: "destructive"
});
setIsSaving(false);
return;
}

let clinicianIdToUse = clinicianId;

if (!clinicianIdToUse) {
const { data: profileData } = await supabase
.from('profiles')
.select('email')
.eq('id', sessionData.session.user.id)
.single();

if (!profileData) {
toast({
title: "Profile Error",
description: "Could not find your profile",
variant: "destructive"
});
setIsSaving(false);
return;
}

const { data: clinicianData } = await supabase
.from('clinicians')
.select('id')
.eq('clinician_email', profileData.email)
.single();

if (!clinicianData) {
toast({
title: "Clinician Error",
description: "Could not find your clinician record",
variant: "destructive"
});
setIsSaving(false);
return;
}

clinicianIdToUse = clinicianData.id;
}

if (!clinicianIdToUse) {
toast({
title: "Error",
description: "No clinician ID found to save availability",
variant: "destructive"
});
setIsSaving(false);
return;
}

const { error: deleteError } = await supabase
.from('availability')
.delete()
.eq('clinician_id', clinicianIdToUse);

if (deleteError) {
toast({
title: "Error Deleting Existing Availability",
description: deleteError.message,
variant: "destructive"
});
setIsSaving(false);
return;
}

await supabase
.from('availability_settings')
.upsert({
clinician_id: clinicianIdToUse,
time_granularity: timeGranularity,
min_days_ahead: minDaysAhead
}, {
onConflict: 'clinician_id'
});

const availabilityToInsert = weekSchedule.flatMap(day => {
if (!day.isOpen) return [];

return day.timeSlots.map(slot => ({
clinician_id: clinicianIdToUse,
day_of_week: day.day,
start_time: slot.startTime,
end_time: slot.endTime,
is_active: true
}));
});

if (availabilityToInsert.length > 0) {
const { error } = await supabase
.from('availability')
.insert(availabilityToInsert);

if (error) {
toast({
title: "Error Saving Availability",
description: error.message,
variant: "destructive"
});
} else {
toast({
title: "Availability Saved",
description: "Your availability has been updated successfully",
});
if (onAvailabilityUpdated) {
onAvailabilityUpdated();
}
}
} else {
toast({
title: "No Availability Set",
description: "No available time slots were found to save",
});
}
} catch (error) {
console.error('Error saving availability:', error);
toast({
title: "Error",
description: "An unexpected error occurred while saving your availability",
variant: "destructive"
});
} finally {
setIsSaving(false);
}
};

const generateShareLink = () => {
const baseUrl = window.location.origin;
return `${baseUrl}/book/clinician123`;
};

const copyLinkToClipboard = () => {
const link = generateShareLink();
navigator.clipboard.writeText(link);
toast({
title: "Link Copied",
description: "Booking link has been copied to clipboard",
});
};

const generateNewLink = () => {
toast({
title: "New Link Generated",
description: "A new booking link has been created",
});
};

const timeOptions = React.useMemo(() => {
const options = [];

for (let hour = 0; hour < 24; hour++) {
const hourFormatted = hour.toString().padStart(2, '0');
options.push(`${hourFormatted}:00`);

if (timeGranularity === 'half-hour') {
options.push(`${hourFormatted}:30`);
}
}

return options;
}, [timeGranularity]);

if (loading) {
return (
<Card className="h-full">
<CardContent className="flex items-center justify-center py-10">
<div className="flex flex-col items-center gap-2">
<Loader2 className="h-8 w-8 animate-spin text-primary" />
<p className="text-sm text-muted-foreground">Loading availability...</p>
</div>
</CardContent>
</Card>
);
}

return (
<Card className="h-full">
<CardHeader>
<div className="flex justify-between items-center">
<CardTitle className="text-base flex items-center gap-2">
<Clock className="h-4 w-4" />
Availability
</CardTitle>
<div className="flex items-center gap-2">
<span className="text-sm">Enabled</span>
<Switch
checked={availabilityEnabled}
onCheckedChange={setAvailabilityEnabled}
/>
</div>
</div>

<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
<TabsList className="grid w-full grid-cols-2">
<TabsTrigger value="set">Set Hours</TabsTrigger>
<TabsTrigger value="share">Share Link</TabsTrigger>
</TabsList>
</Tabs>
</CardHeader>

<CardContent>
{activeTab === 'set' && (
<div className="space-y-4">
<div className="p-3 border rounded-md">
<h3 className="font-medium mb-2">Scheduling Settings</h3>
<Separator className="my-2" />
<div className="space-y-3">
<div>
<p className="text-sm text-muted-foreground mb-2">
Allow clients to schedule appointments on:
</p>
<RadioGroup
value={timeGranularity}
onValueChange={(value) => setTimeGranularity(value as 'hour' | 'half-hour')}
className="flex flex-col space-y-1"
>
<div className="flex items-center space-x-2">
<RadioGroupItem value="hour" id="hour" />
<Label htmlFor="hour">Hour marks only (e.g., 1:00, 2:00)</Label>
</div>
<div className="flex items-center space-x-2">
<RadioGroupItem value="half-hour" id="half-hour" />
<Label htmlFor="half-hour">Hour and half-hour marks (e.g., 1:00, 1:30)</Label>
</div>
</RadioGroup>
</div>

<div>
<p className="text-sm text-muted-foreground mb-2">
How soon can clients schedule with you?
</p>
<Select 
  value={minDaysAhead.toString()} 
  onValueChange={(value) => setMinDaysAhead(Number(value))}
>
  <SelectTrigger className="w-full max-w-xs">
    <SelectValue placeholder="Select days in advance" />
  </SelectTrigger>
  <SelectContent>
    {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => (
      <SelectItem key={day} value={day.toString()}>
        {day} {day === 1 ? 'day' : 'days'} in advance
      </SelectItem>
    ))}
  </SelectContent>
</Select>
</div>
</div>
</div>

<div className="space-y-2">
{weekSchedule.map((day, index) => (
<Collapsible
key={day.day}
open={day.isOpen}
onOpenChange={() => toggleDayOpen(index)}
className="border rounded-md overflow-hidden"
>
<div className="flex items-center justify-between p-3 bg-gray-50">
<div className="flex items-center gap-2">
<CollapsibleTrigger asChild>
<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
{day.isOpen ? (
<ChevronUp className="h-4 w-4" />
) : (
<ChevronDown className="h-4 w-4" />
)}
</Button>
</CollapsibleTrigger>
<Badge variant="outline" className="font-medium">
{day.day}
</Badge>
</div>
<div className="flex items-center gap-2">
<Button
variant="ghost"
size="sm"
onClick={() => addTimeSlot(index)}
className="h-8 w-8 p-0"
>
<Plus className="h-4 w-4" />
</Button>
</div>
</div>

<CollapsibleContent>
<div className="p-3 space-y-2">
{day.timeSlots.length === 0 ? (
<div className="text-sm text-gray-500 text-center py-2">
No time slots added. Click the + button to add one.
</div>
) : (
day.timeSlots.map((slot) => (
<div key={slot.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
<div className="grid grid-cols-2 gap-2 flex-1">
<Select
value={slot.startTime}
onValueChange={(value) => updateTimeSlot(index, slot.id, 'startTime', value)}
>
<SelectTrigger className="h-8">
<SelectValue placeholder="Start time" />
</SelectTrigger>
<SelectContent>
{timeOptions.map((time) => (
<SelectItem key={`start-${time}`} value={time}>
{time}
</SelectItem>
))}
</SelectContent>
</Select>

<Select
value={slot.endTime}
onValueChange={(value) => updateTimeSlot(index, slot.id, 'endTime', value)}
>
<SelectTrigger className="h-8">
<SelectValue placeholder="End time" />
</SelectTrigger>
<SelectContent>
{timeOptions.map((time) => (
<SelectItem key={`end-${time}`} value={time}>
{time}
</SelectItem>
))}
</SelectContent>
</Select>
</div>

<Button
variant="ghost"
size="sm"
onClick={() => deleteTimeSlot(index, slot.id)}
className="h-8 w-8 p-0"
>
<X className="h-4 w-4" />
</Button>
</div>
))
)}
</div>
</CollapsibleContent>
</Collapsible>
))}
</div>

<Button
className="w-full"
onClick={saveAvailability}
disabled={isSaving}
>
{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
{isSaving ? 'Saving...' : 'Save Availability'}
</Button>
</div>
)}

{activeTab === 'share' && (
<div className="space-y-4">
<div className="text-sm text-gray-600">
Share this link with your clients so they can book appointments during your available hours.
</div>

<div className="flex gap-2 p-2 border rounded-md">
<div className="text-sm flex-1 truncate">
{generateShareLink()}
</div>
<Button
variant="ghost"
size="sm"
className="h-6 w-6 p-0"
onClick={copyLinkToClipboard}
>
<Copy className="h-4 w-4" />
</Button>
</div>

<Button
className="w-full"
onClick={generateNewLink}
>
Generate New Link
</Button>
</div>
)}
</CardContent>
</Card>
);
};

export default AvailabilityPanel;
