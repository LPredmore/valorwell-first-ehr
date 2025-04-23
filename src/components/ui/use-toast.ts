
import { toast } from "sonner";

// Creating our own hook to maintain API compatibility
const useToast = () => {
  return {
    toast,
  };
};

export { useToast, toast };
