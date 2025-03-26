
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clipboard } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import TreatmentPlanModal from '../modals/TreatmentPlanModal';
import SessionNoteModal from '../modals/SessionNoteModal';

interface DocumentationTabProps {
  clientId: string;
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ clientId }) => {
  const [treatmentPlanOpen, setTreatmentPlanOpen] = useState(false);
  const [sessionNoteOpen, setSessionNoteOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Charting Section */}
      <Card>
        <CardHeader>
          <CardTitle>Charting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => setTreatmentPlanOpen(true)}
              className="flex items-center gap-2"
            >
              <FileText size={18} />
              Create Treatment Plan
            </Button>
            <Button 
              onClick={() => setSessionNoteOpen(true)}
              className="flex items-center gap-2"
            >
              <Clipboard size={18} />
              Document Session
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Assessment Forms Section */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select assessment form" />
              </SelectTrigger>
              <SelectContent>
                {/* Will be populated with assessment forms later */}
              </SelectContent>
            </Select>
            
            <Button className="w-full md:w-auto">
              Assign Selected Form
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Modals */}
      <TreatmentPlanModal 
        isOpen={treatmentPlanOpen} 
        onClose={() => setTreatmentPlanOpen(false)} 
        clientId={clientId}
      />
      
      <SessionNoteModal 
        isOpen={sessionNoteOpen} 
        onClose={() => setSessionNoteOpen(false)} 
        clientId={clientId}
      />
    </div>
  );
};

export default DocumentationTab;
