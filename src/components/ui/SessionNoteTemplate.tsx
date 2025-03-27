
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SessionNoteTemplateProps {
  onClose: () => void;
  clinicianName?: string;
  clientName?: string;
  clientDob?: string;
}

const SessionNoteTemplate: React.FC<SessionNoteTemplateProps> = ({ 
  onClose, 
  clinicianName = '',
  clientName = '',
  clientDob = ''
}) => {
  return (
    <Card className="w-full border border-gray-200 rounded-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold text-valorwell-700">Session Note Template</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          This is the template used for therapy session notes. You can use this to document client sessions.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6">
          <div className="border rounded-md p-4 bg-white">
            <h2 className="text-xl font-semibold text-valorwell-800 mb-4">Therapy Session Note</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <label className="block text-sm text-valorwell-700 font-semibold">Client Name</label>
                <input className="w-full p-2 border rounded" type="text" defaultValue={clientName} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-valorwell-700 font-semibold">Client DOB</label>
                <input className="w-full p-2 border rounded" type="text" defaultValue={clientDob} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-valorwell-700 font-semibold">Clinician Name</label>
                <input className="w-full p-2 border rounded" type="text" defaultValue={clinicianName} />
              </div>
            </div>
            
            {/* Session content details would go here */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm text-valorwell-700 font-semibold">Session Notes</label>
                <textarea className="w-full p-2 border rounded min-h-[150px]" placeholder="Enter session notes..."></textarea>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="mr-2">Close</Button>
            <Button className="bg-valorwell-700 hover:bg-valorwell-800">Save Note</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionNoteTemplate;
