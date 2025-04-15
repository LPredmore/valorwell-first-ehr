
import React from 'react';
import { Card } from '@/components/ui/card';

/**
 * Availability Model Documentation
 * 
 * This component provides documentation on the current availability model
 * for reference purposes. This is not meant to be displayed to users but
 * is useful for developers working on the system.
 */
const AvailabilityModel: React.FC = () => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Availability Model Documentation</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-2">Overview</h3>
          <p>
            The availability system uses a combination of three data sources:
          </p>
          <ol className="list-decimal pl-6 mt-2">
            <li>Regular weekly schedule (stored in the clinician table)</li>
            <li>Single-day availability exceptions (stored in single_day_availability)</li>
            <li>Time blocks (stored in time_blocks table)</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Clinician Weekly Schedule</h3>
          <p>
            The primary source for regular weekly availability. Each clinician can have up to 3 
            availability slots per day of the week. These are stored directly in the clinician table.
          </p>
          <p className="mt-2">
            Fields follow the pattern: <code>clinician_[day]start[slot]</code> and <code>clinician_[day]end[slot]</code>
          </p>
          <p className="mt-2">
            Example fields: <code>clinician_mondaystart1</code>, <code>clinician_mondayend1</code>, 
            <code>clinician_mondaystart2</code>, etc.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Single-Day Availability</h3>
          <p>
            Used when a clinician wants to be available on a specific date, regardless of their
            regular weekly schedule. This overrides the regular schedule for that day.
          </p>
          <p className="mt-2">
            Table: <code>single_day_availability</code> (may also be <code>availability_single_date</code> in some instances)
          </p>
          <p className="mt-2">
            Fields: id, clinician_id, availability_date, start_time, end_time
          </p>
          <p className="mt-2">
            These records represent one-off availability slots for specific dates.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Time Blocks</h3>
          <p>
            Used to block out time when a clinician is NOT available. These override both regular
            weekly schedule and single-day availability.
          </p>
          <p className="mt-2">
            Table: <code>time_blocks</code>
          </p>
          <p className="mt-2">
            Fields: id, clinician_id, block_date, start_time, end_time, reason (optional)
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Data Flow</h3>
          <ol className="list-decimal pl-6">
            <li>First, the system gets the clinician's regular weekly schedule from the clinicians table</li>
            <li>Then, it checks for any single-day availability records that override the regular schedule</li>
            <li>Finally, it applies any time blocks that may further restrict the available time</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">Implementation Details</h3>
          <ul className="list-disc pl-6">
            <li>The Edge Function <code>get-availability-settings</code> fetches the weekly schedule from the clinician table</li>
            <li>The <code>useWeekViewData</code> and <code>useMonthViewData</code> hooks fetch and process all three data sources</li>
            <li>Time blocks are applied as the last step, removing portions of availability as needed</li>
          </ul>
        </section>
      </div>
    </Card>
  );
};

export default AvailabilityModel;
