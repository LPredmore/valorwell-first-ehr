
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar, Repeat } from 'lucide-react';

interface EditChoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  specificDate: Date;
  onEditSingle: () => void;
  onEditSeries: () => void;
  isLoading: boolean;
}

const EditChoiceDialog: React.FC<EditChoiceDialogProps> = ({
  isOpen,
  onClose,
  specificDate,
  onEditSingle,
  onEditSeries,
  isLoading
}) => {
  const [selection, setSelection] = React.useState<'single' | 'series'>('single');

  const handleContinue = () => {
    if (selection === 'single') {
      onEditSingle();
    } else {
      onEditSeries();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Recurring Availability</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-sm text-gray-600">
            Would you like to edit only this occurrence on {format(specificDate, 'EEEE, MMMM d, yyyy')} 
            or all future occurrences in this recurring series?
          </p>

          <RadioGroup value={selection} onValueChange={(value) => setSelection(value as 'single' | 'series')} className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-md bg-blue-50 border border-blue-100">
              <RadioGroupItem value="single" id="r1" className="mt-1" />
              <div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-700" />
                  <Label htmlFor="r1" className="font-medium text-blue-700">This occurrence only</Label>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Changes will only apply to {format(specificDate, 'MMMM d')}. 
                  Your recurring schedule for other dates will remain unchanged.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded-md bg-indigo-50 border border-indigo-100">
              <RadioGroupItem value="series" id="r2" className="mt-1" />
              <div>
                <div className="flex items-center">
                  <Repeat className="h-4 w-4 mr-2 text-indigo-700" />
                  <Label htmlFor="r2" className="font-medium text-indigo-700">All future occurrences</Label>
                </div>
                <p className="text-sm text-indigo-600 mt-1">
                  Changes will apply to this and all future occurrences in this weekly recurring series.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={isLoading}>
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditChoiceDialog;
