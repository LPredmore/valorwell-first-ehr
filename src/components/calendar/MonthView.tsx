
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface MonthViewProps {
  currentDate: Date;
  clinicianId?: string | null;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, clinicianId }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-4">Monthly View</h3>
        <p className="text-gray-500 text-sm mb-2">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
        <div className="text-center p-6">
          <p className="text-gray-500">Monthly calendar view will be implemented soon</p>
          {clinicianId && (
            <p className="text-xs text-gray-400 mt-2">Showing availability for clinician ID: {clinicianId}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthView;
