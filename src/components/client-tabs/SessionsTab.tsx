
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SessionsTabProps {
  clientData?: any;
}

const SessionsTab: React.FC<SessionsTabProps> = ({ clientData }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>View and manage client therapy sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Upcoming Sessions</h3>
            <Button>Schedule New Session</Button>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            No upcoming sessions scheduled.
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Past Sessions</h3>
            <div className="text-center py-8 text-gray-500">
              No past sessions found.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionsTab;
