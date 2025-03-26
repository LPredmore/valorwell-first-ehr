import React from 'react';

interface MonthViewProps {
  clinicianId?: string;
}

const MonthView: React.FC<MonthViewProps> = ({ clinicianId }) => {
  return (
    <div>
      <h2>Month View</h2>
      <p>Showing calendar for clinician ID: {clinicianId || 'All clinicians'}</p>
      {/* Month view implementation would go here */}
    </div>
  );
};

export default MonthView;
