
import { useState, useEffect, ReactNode } from "react";
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

// Convert our toast options to Sonner options
const useToastImplementation = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const toast = (props: Toast) => {
    const { title, description, variant, action, duration, ...rest } = props;
    
    // Create a unique ID for this toast if none provided
    const id = props.id || Date.now().toString();
    const newToast = { id, title, description, variant, action, duration, ...rest };
    
    // Add to our internal toasts state
    setToasts((current) => [...current, newToast]);
    
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
      setToasts((current) =>
        current.filter((toast) => toast.id !== toastId)
      );
      sonnerToast.dismiss(toastId);
    }
  };

  return {
    toast,
    dismiss,
    toasts,
  };
};

// Create a single instance to be shared across the app
const useToast = () => useToastImplementation();

// For direct imports without the hook
const toastSingleton = useToastImplementation();
const toast = toastSingleton.toast;

// Only export the type and functions once, removing the duplicate export
export { useToast, toast };
