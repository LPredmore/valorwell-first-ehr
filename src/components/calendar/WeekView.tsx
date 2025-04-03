
import React from 'react';
import { WeekViewProps } from './week-view/types';
import { WeekView as EnhancedWeekView } from './week-view';

const WeekView: React.FC<WeekViewProps> = (props) => {
  return <EnhancedWeekView {...props} />;
};

export default WeekView;
