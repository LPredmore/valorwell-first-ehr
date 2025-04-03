
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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

          <RadioGroup value={selection} onValueChange={(value) => setSelection(value as 'single' | 'series')}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="single" id="r1" />
              <Label htmlFor="r1" className="font-normal">Edit only this occurrence</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="series" id="r2" />
              <Label htmlFor="r2" className="font-normal">Edit all future occurrences in this series</Label>
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
