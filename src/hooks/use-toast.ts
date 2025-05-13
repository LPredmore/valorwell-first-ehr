
import { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

// Define our own Toast type that includes variant
export interface Toast {
  id?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

// Create a function that returns the toast functionality
// This avoids calling hooks outside of component context
export const useToast = () => {
  const toast = (props: Toast) => {
    const { title, description, variant, action, duration, ...rest } = props;
    
    // Create a unique ID for this toast if none provided
    const id = props.id || Date.now().toString();
    
    // Use appropriate Sonner toast method based on variant
    if (variant === "destructive") {
      sonnerToast.error(title || "", {
        id,
        description,
        duration,
        ...rest
      });
    } else if (variant === "success") {
      sonnerToast.success(title || "", {
        id,
        description,
        duration,
        ...rest
      });
    } else {
      sonnerToast(title || "", {
        id,
        description,
        duration,
        ...rest
      });
    }
    
    return id;
  };
  
  const dismiss = (toastId?: string) => {
    if (toastId) {
      sonnerToast.dismiss(toastId);
    }
  };

  return {
    toast,
    dismiss,
  };
};

// For direct imports without the hook
const toast = (props: Toast) => {
  const { toast: innerToast } = useToast();
  return innerToast(props);
};

export { toast };
