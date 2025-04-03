
import React from 'react';
import FullCalendarView from '../FullCalendarView';
import { WeekViewProps } from './types';

const WeekView: React.FC<WeekViewProps> = ({ 
  currentDate, 
  clinicianId, 
  refreshTrigger = 0,
  appointments = [],
  getClientName = () => 'Client',
  onAppointmentClick,
  onAvailabilityClick,
  userTimeZone
}) => {
  return (
    <FullCalendarView
      currentDate={currentDate}
      clinicianId={clinicianId}
      refreshTrigger={refreshTrigger}
      appointments={appointments}
      getClientName={getClientName}
      onAppointmentClick={onAppointmentClick}
      onAvailabilityClick={onAvailabilityClick}
      userTimeZone={userTimeZone}
      view="timeGridWeek"
      showAvailability={true}
    />
  );
};

export default WeekView;
