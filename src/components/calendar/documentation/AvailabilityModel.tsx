
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AvailabilityModel = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Availability Model Documentation</h1>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regular">Regular Availability</TabsTrigger>
          <TabsTrigger value="single-day">Single-Day Availability</TabsTrigger>
          <TabsTrigger value="time-blocks">Time Blocks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Availability Model Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The availability system uses a combination of tables and fields to manage clinician availability
                in the most efficient and maintainable way. The model consists of four main components:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Regular Weekly Availability</strong> - Stored directly in the clinician table
                  with fields for each day of the week and up to three time slots per day.
                </li>
                <li>
                  <strong>Time Blocks</strong> - Stored in the time_blocks table to track specific periods
                  when a clinician is unavailable.
                </li>
                <li>
                  <strong>Single-Day Availability</strong> - Stored in the single_day_availability table
                  for special days that override the regular weekly schedule.
                </li>
                <li>
                  <strong>Availability Settings</strong> - Stored in the availability_settings table to
                  manage configuration options like booking windows and time slot granularity.
                </li>
              </ol>
              <p>
                The system prioritizes data retrieval in the following order:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Single-day availability overrides (if a specific date is defined)</li>
                <li>Time blocks (blocking out unavailable periods)</li>
                <li>Regular weekly schedule from the clinician record</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="regular" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Regular Weekly Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Structure</h3>
              <p>
                Regular weekly availability is stored directly in the clinician table using the following fields
                for each day of the week:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><code>clinician_[day]start1</code>, <code>clinician_[day]end1</code></li>
                <li><code>clinician_[day]start2</code>, <code>clinician_[day]end2</code></li>
                <li><code>clinician_[day]start3</code>, <code>clinician_[day]end3</code></li>
              </ul>
              <p>Where <code>[day]</code> is one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday.</p>
              
              <h3 className="text-lg font-semibold mt-4">Data Format</h3>
              <p>
                Time values are stored in <code>HH:MM:SS</code> format in the database, but are typically displayed
                and edited as <code>HH:MM</code> in the UI.
              </p>
              
              <h3 className="text-lg font-semibold mt-4">Access Pattern</h3>
              <p>
                This design allows for very efficient retrieval of a clinician's standard weekly schedule with a
                single database query, without requiring joins to other tables.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="single-day" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Single-Day Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Purpose</h3>
              <p>
                Single-day availability allows clinicians to define special availability for specific dates that
                override their regular weekly schedule. This is useful for handling exceptions like:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Working on a day they're normally unavailable</li>
                <li>Having different hours than their regular schedule</li>
                <li>Special events or circumstances requiring adjusted schedules</li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-4">Table Structure</h3>
              <p>The <code>single_day_availability</code> table contains:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><code>id</code>: UUID primary key</li>
                <li><code>clinician_id</code>: UUID reference to the clinician</li>
                <li><code>availability_date</code>: The specific date for this availability exception</li>
                <li><code>start_time</code>: Start time for availability on this date</li>
                <li><code>end_time</code>: End time for availability on this date</li>
                <li><code>created_at</code>, <code>updated_at</code>: Timestamps</li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-4">Priority</h3>
              <p>
                Single-day availability takes precedence over the regular weekly schedule when determining
                a clinician's availability for a specific date.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="time-blocks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Blocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Purpose</h3>
              <p>
                Time blocks allow clinicians to define specific periods when they are unavailable, creating
                exceptions to their regular availability. Common uses include:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Vacation or personal time off</li>
                <li>Meetings, training, or other professional commitments</li>
                <li>Blocking off specific hours within an otherwise available day</li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-4">Table Structure</h3>
              <p>The <code>time_blocks</code> table contains:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><code>id</code>: UUID primary key</li>
                <li><code>clinician_id</code>: UUID reference to the clinician</li>
                <li><code>block_date</code>: The specific date for this block</li>
                <li><code>start_time</code>: Start time of the unavailable period</li>
                <li><code>end_time</code>: End time of the unavailable period</li>
                <li><code>reason</code>: Optional text explaining the reason for the block</li>
                <li><code>created_at</code>, <code>updated_at</code>: Timestamps</li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-4">Processing</h3>
              <p>
                When determining available appointment slots, the system first checks for any time blocks
                on the given date and excludes those time periods from the available slots.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Purpose</h3>
              <p>
                The availability settings control global behavior of the availability system for each clinician,
                including booking windows, default times, and time slot granularity.
              </p>
              
              <h3 className="text-lg font-semibold mt-4">Table Structure</h3>
              <p>The <code>availability_settings</code> table contains:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><code>id</code>: UUID primary key</li>
                <li><code>clinician_id</code>: Reference to the clinician</li>
                <li><code>time_granularity</code>: Defines slot size ('15min', '30min', 'hour')</li>
                <li><code>min_days_ahead</code>: Minimum days in advance for bookings</li>
                <li><code>max_days_ahead</code>: Maximum days in advance for bookings</li>
                <li><code>default_start_time</code>: Default start time for new availability slots</li>
                <li><code>default_end_time</code>: Default end time for new availability slots</li>
                <li><code>buffer_minutes</code>: Optional buffer between appointments</li>
                <li><code>created_at</code>, <code>updated_at</code>: Timestamps</li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-4">Default Values</h3>
              <p>
                If no settings record exists for a clinician, the system uses these defaults:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Time granularity: 'hour'</li>
                <li>Min days ahead: 2</li>
                <li>Max days ahead: 60</li>
                <li>Default start time: '09:00:00'</li>
                <li>Default end time: '17:00:00'</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AvailabilityModel;
