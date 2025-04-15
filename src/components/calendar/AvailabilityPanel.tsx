
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AvailabilityPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This panel will allow you to configure availability settings.
        </p>
      </CardContent>
    </Card>
  );
};

export default AvailabilityPanel;
