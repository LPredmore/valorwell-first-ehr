
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const NotesTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Internal notes about this client</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">No notes have been added yet.</p>
      </CardContent>
    </Card>
  );
};

export default NotesTab;
