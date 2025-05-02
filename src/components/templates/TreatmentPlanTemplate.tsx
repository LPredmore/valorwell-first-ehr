import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

interface TreatmentPlanTemplateProps {
  onClose: () => void;
  clinicianName: string;
}

export const TreatmentPlanTemplate: React.FC<TreatmentPlanTemplateProps> = ({ 
  onClose,
  clinicianName
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Treatment Plan Template</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p>Clinician: <strong>{clinicianName}</strong></p>
            {/* Template form fields would go here */}
            <p className="text-muted-foreground">
              This form allows you to create a new treatment plan template.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
