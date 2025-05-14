
import { toast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import PasswordResetForm from "./PasswordResetForm";

type ForgotPasswordDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const ForgotPasswordDialog = ({ isOpen, onOpenChange }: ForgotPasswordDialogProps) => {
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll help you reset your password.
          </DialogDescription>
        </DialogHeader>
        <PasswordResetForm onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
