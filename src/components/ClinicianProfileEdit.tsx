
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ClinicianProfileEditProps = {
  isOpen: boolean;
  onClose: () => void;
  clinicianId: string | null;
};

const ClinicianProfileEdit = ({ isOpen, onClose }: ClinicianProfileEditProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Clinician Profile Functionality Removed</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <p className="text-center text-gray-600">
            Clinician profile creation and editing functionality has been removed.
          </p>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicianProfileEdit;
