
import React from 'react';
import FullCalendarView from '../FullCalendarView';
import { FullCalendarProps } from '@/types/calendar';

const WeekView: React.FC<Omit<FullCalendarProps, 'view'>> = (props) => {
  return <FullCalendarView {...props} view="timeGridWeek" />;
};

export default WeekView;
